const C = window.CLASS;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const initial = (name) => name.trim().split(/\s+/).pop()[0] || "?";

// ---- Thông tin chung
document.title = `Lớp ${C.name} — Kỷ niệm thanh xuân`;
$("brand").textContent = C.name;
$("years").textContent = `${C.school} · ${C.years}`;
$("title").textContent = `Lớp ${C.name}`;
$("tagline").textContent = C.tagline;
$("stats").innerHTML = C.stats.map((s) => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`).join("");
$("footerText").textContent = `© ${C.name} · ${C.years} — Làm bằng tình yêu với lớp cũ`;
const contact = $("contact");
contact.textContent = C.contact.label;
contact.href = C.contact.url;

// ---- Timeline
$("timelineList").innerHTML = C.timeline
  .map((t) => `<li><div class="yr">${esc(t.year)}</div><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></li>`)
  .join("");

// ---- Thành viên
$("memberList").innerHTML = C.members
  .map((m) => {
    const av = m.avatar
      ? `<img class="avatar" src="${esc(m.avatar)}" alt="${esc(m.name)}" loading="lazy">`
      : `<div class="avatar">${esc(initial(m.name))}</div>`;
    return `<div class="member">${av}<h3>${esc(m.name)}</h3><div class="role">${esc(m.role || "")}</div>${m.quote ? `<q>${esc(m.quote)}</q>` : ""}</div>`;
  })
  .join("");

// ---- Lưu bút
$("wishList").innerHTML = C.wishes
  .map((w, i) => `<div class="wish" style="--r:${i % 2 ? 1.2 : -1.2}deg">${esc(w.text)}<small>— ${esc(w.from)}</small></div>`)
  .join("");

// ---- Thư viện ảnh
const hues = [12, 28, 190, 330, 260, 150];
let photos = window.PHOTOS || [];
const demo = photos.length === 0;
if (demo) {
  photos = ["Ngày khai giảng", "Văn nghệ", "Hội thao", "Dã ngoại", "Giờ ra chơi", "Lễ tri ân", "Chụp kỷ yếu", "Họp lớp"].map((c, i) => ({
    caption: c, album: C.timeline[i % 4].year, h: 180 + (i % 3) * 70, hue: hues[i % hues.length],
  }));
  $("galleryHint").textContent = "Đây là ảnh mẫu — thêm ảnh thật vào thư mục photos/ rồi chạy tools/gen-photos.ps1 (xem README).";
}

let filter = "Tất cả";
let visible = [];
const albums = ["Tất cả", ...new Set(photos.map((p) => p.album))];
$("filters").innerHTML = albums.map((a) => `<button class="chip${a === filter ? " on" : ""}">${esc(a)}</button>`).join("");
$("filters").addEventListener("click", (e) => {
  if (!e.target.classList.contains("chip")) return;
  filter = e.target.textContent;
  [...$("filters").children].forEach((c) => c.classList.toggle("on", c.textContent === filter));
  renderGrid();
});

function renderGrid() {
  visible = photos.filter((p) => filter === "Tất cả" || p.album === filter);
  $("grid").innerHTML = visible
    .map((p, i) =>
      `<figure class="tile" data-i="${i}">` +
      (p.src
        ? `<img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy">`
        : `<div class="ph" style="height:${p.h}px;background:linear-gradient(135deg,hsl(${p.hue} 75% 55%),hsl(${p.hue + 40} 80% 65%))">${esc(p.caption)}</div>`) +
      `<div class="cap">${esc(p.caption)}</div></figure>`)
    .join("");
}
renderGrid();

// ---- Lightbox
const lb = $("lightbox");
let cur = 0;
function show(i) {
  cur = (i + visible.length) % visible.length;
  const p = visible[cur];
  if (!p.src) return;
  $("lbImg").src = p.src;
  $("lbImg").alt = p.caption;
  $("lbCap").textContent = `${p.caption} · ${p.album}`;
  lb.hidden = false;
}
$("grid").addEventListener("click", (e) => {
  const t = e.target.closest(".tile");
  if (t) show(+t.dataset.i);
});
lb.querySelector(".lb-close").onclick = () => (lb.hidden = true);
lb.querySelector(".prev").onclick = () => show(cur - 1);
lb.querySelector(".next").onclick = () => show(cur + 1);
lb.addEventListener("click", (e) => { if (e.target === lb) lb.hidden = true; });
document.addEventListener("keydown", (e) => {
  if (lb.hidden) return;
  if (e.key === "Escape") lb.hidden = true;
  if (e.key === "ArrowLeft") show(cur - 1);
  if (e.key === "ArrowRight") show(cur + 1);
});
