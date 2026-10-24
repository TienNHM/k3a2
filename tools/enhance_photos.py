"""Gently enhance class photos: tame blown highlights, lift shadows, balance colour, add natural vibrance.

Usage:
  python tools/enhance_photos.py --sample 8 --out _preview        # write before/after comparison, touch nothing
  python tools/enhance_photos.py --apply --backup <dir>           # enhance every photo in photos/ (and rebuild thumbs)

Originals are copied to --backup first; the repo's git history also keeps the previous versions.
"""
import argparse, os, random, shutil, sys
import cv2
import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, "photos")
SKIP = {"thumbs", "_removed", "avatars"}


def list_photos():
    out = []
    for dp, dn, fn in os.walk(PHOTOS):
        dn[:] = [d for d in dn if d not in SKIP]
        for f in fn:
            if f.lower().endswith((".jpg", ".jpeg")):
                out.append(os.path.join(dp, f))
    return sorted(out)


def imread(path):
    data = np.fromfile(path, dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def imwrite(path, img, q=88):
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, q])
    buf.tofile(path)


def enhance(bgr):
    img = bgr.astype(np.float32) / 255.0

    # 1. gentle gray-world white balance on mid-tones (ignores clipped/very dark pixels)
    lum = img.mean(axis=2)
    mask = (lum > 0.12) & (lum < 0.88)
    if mask.sum() > 500:
        means = np.array([img[..., c][mask].mean() for c in range(3)])
        gain = means.mean() / np.maximum(means, 1e-3)
        gain = np.clip(gain, 0.88, 1.12)
        gain = 1.0 + (gain - 1.0) * 0.7
        img = np.clip(img * gain, 0, 1)

    # 2. work on luminance in Lab
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L = lab[..., 0] / 100.0
    meanL = float(L.mean())

    # exposure normalisation (towards ~0.50)
    if meanL > 0.60:
        L = np.power(L, 1.0 + (meanL - 0.60) * 1.6)
    elif meanL < 0.38:
        L = np.power(L, 1.0 - (0.38 - meanL) * 1.4)

    # highlight compression: soft knee so bright areas keep detail instead of burning out
    knee = 0.58
    over = np.clip(L - knee, 0, None)
    L = np.where(L > knee, knee + over * 0.50, L)

    # shadow lift
    under = np.clip(0.30 - L, 0, None)
    L = L + under * 0.35

    # local contrast (CLAHE), blended
    L8 = np.clip(L * 255, 0, 255).astype(np.uint8)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(6, 6)).apply(L8).astype(np.float32) / 255.0
    L = L * 0.50 + clahe * 0.50

    # gentle S-curve for punch
    L = np.clip(L, 0, 1)
    L = L + 0.10 * (L - 0.5) * (1 - np.abs(2 * L - 1))

    lab[..., 0] = np.clip(L, 0, 1) * 100.0
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    img = np.clip(img, 0, 1)

    # 3. vibrance: boost muted colours more than already-saturated ones (protects skin tones)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    s = hsv[..., 1] / 1.0
    boost = (1.0 + 0.45 * (1.0 - s)) * 1.05
    hsv[..., 1] = np.clip(s * boost, 0, 1)
    img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    img = np.clip(img, 0, 1)

    out = (img * 255).astype(np.uint8)

    # 4. mild denoise (these are phone photos in poor light) then light sharpen
    out = cv2.fastNlMeansDenoisingColored(out, None, 2.5, 2.5, 5, 15)
    blur = cv2.GaussianBlur(out, (0, 0), 1.1)
    out = cv2.addWeighted(out, 1.45, blur, -0.45, 0)
    return out


def make_thumb(img, max_side=480):
    h, w = img.shape[:2]
    s = min(1.0, max_side / max(h, w))
    return cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)


def label(img, text, w):
    h = int(img.shape[0] * w / img.shape[1])
    img = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)
    cv2.rectangle(img, (0, 0), (46, 20), (0, 0, 0), -1)
    cv2.putText(img, text, (4, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
    return img


def sample_sheet(n, out_dir, seed):
    photos = list_photos()
    rnd = random.Random(seed)
    pick = rnd.sample(photos, min(n, len(photos)))
    os.makedirs(out_dir, exist_ok=True)
    rows = []
    W = 420
    for p in pick:
        b = imread(p)
        a = enhance(b)
        l, r = label(b, "cu", W), label(a, "moi", W)
        hh = max(l.shape[0], r.shape[0])
        canvas = np.zeros((hh, W * 2 + 6, 3), np.uint8)
        canvas[: l.shape[0], :W] = l
        canvas[: r.shape[0], W + 6 :] = r
        rows.append(canvas)
        print(os.path.relpath(p, ROOT))
    # arrange in 2 columns of rows
    cols = 2
    per = (len(rows) + cols - 1) // cols
    colimgs = []
    for c in range(cols):
        chunk = rows[c * per : (c + 1) * per]
        if not chunk:
            continue
        colimgs.append(np.vstack([np.pad(x, ((0, 6), (0, 0), (0, 0))) for x in chunk]))
    H = max(x.shape[0] for x in colimgs)
    colimgs = [np.pad(x, ((0, H - x.shape[0]), (0, 6), (0, 0))) for x in colimgs]
    sheet = np.hstack(colimgs)
    path = os.path.join(out_dir, "compare.jpg")
    imwrite(path, sheet, 85)
    print("wrote", path, sheet.shape)


def apply_all(backup):
    photos = list_photos()
    for i, p in enumerate(photos, 1):
        rel = os.path.relpath(p, PHOTOS)
        dst = os.path.join(backup, rel)
        if not os.path.exists(dst):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(p, dst)
        img = imread(p)
        if img is None:
            print("skip", rel)
            continue
        out = enhance(img)
        imwrite(p, out, 88)
        tdir = os.path.join(os.path.dirname(p), "thumbs")
        if os.path.isdir(tdir) and os.path.exists(os.path.join(tdir, os.path.basename(p))):
            imwrite(os.path.join(tdir, os.path.basename(p)), make_thumb(out), 82)
        if i % 25 == 0:
            print(f"{i}/{len(photos)}")
    print("done", len(photos))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", type=int)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default=os.path.join(ROOT, "_preview"))
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--backup")
    a = ap.parse_args()
    if a.sample:
        sample_sheet(a.sample, a.out, a.seed)
    elif a.apply:
        if not a.backup:
            sys.exit("--backup is required with --apply")
        apply_all(a.backup)
    else:
        ap.print_help()
