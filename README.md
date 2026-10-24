# K3A2 — Triển lãm kỷ niệm

Website tĩnh (HTML + CSS + JavaScript module, **không cần build**) lưu giữ ký ức của lớp K3A2, THPT Châu Thành 1, Đồng Tháp.
Giao diện theo hướng một triển lãm trực tuyến: sảnh, các phòng trưng bày theo chủ đề, dòng thời gian, cỗ máy thời gian, chế độ "Lắng đọng".

## Chạy thử trên máy

JavaScript module không chạy khi mở file trực tiếp (`file://`), cần một server tĩnh bất kỳ:

```bash
npx serve .
```

## Cấu trúc

```
index.html, con-nguoi.html, dia-diem.html, lang-dong.html   trang viết tay (chỉ là khung ghép thành phần)
<phong>.html                                                trang phòng — TỰ SINH, đừng sửa tay
src/content/    NỘI DUNG: chỉnh ở đây, không cần đụng code
src/js/         ENGINE (core/) + THÀNH PHẦN (components/)
src/css/        design system: tokens → base → layout → components → pages
photos/         ảnh: photos/<Phòng>/<Bộ sưu tập>/NNN.jpg (+ thumbs/)
tools/          script PowerShell để nhập ảnh và sinh dữ liệu
docs/           tài liệu kiến trúc
```

Chi tiết và cách mở rộng: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Việc thường làm

| Muốn | Làm |
|---|---|
| Đổi tên lớp, tiêu đề, link nhóm chat | sửa `src/content/site.js` |
| Đổi mô tả/màu/ảnh bìa của một phòng | sửa `src/content/rooms.js` |
| Thêm ngày, địa điểm, câu chuyện cho một bộ sưu tập | sửa `src/content/albums.js` |
| Sửa dòng thời gian | sửa `src/content/timeline.js` |
| Điền tên bạn bè, lưu bút | sửa `src/content/people.js` |
| Thêm địa điểm trên bản đồ | sửa `src/content/places.js` |
| Thêm video YouTube | sửa `src/content/videos.js` |

## Thêm ảnh

1. Tải album từ Google Photos (⋮ → *Tải xuống tất cả*).
2. Nhập vào repo (nén ảnh, tạo ảnh thu nhỏ, **giữ video riêng ngoài repo** ở `~/Videos/K3A2/<Bộ sưu tập>`):
   ```powershell
   ./tools/import-album.ps1 -Zip album-1-001.zip -Topic "Cuối cấp" -Album "Buổi học cuối cùng"
   ```
   `-Topic` là tên **phòng**, `-Album` là tên **bộ sưu tập**. Thêm `-VideosOnly` để chỉ lấy video.
3. Lọc ảnh trùng: `./tools/dedupe-photos.ps1` (thêm `-DryRun` để xem trước).
4. Sinh lại dữ liệu và trang phòng: `./tools/gen-photos.ps1`.

Ảnh muốn loại nhưng chưa xóa hẳn: chuyển vào `photos/_removed/` (bị bỏ qua, không đưa lên GitHub).

## Đưa lên mạng

GitHub Pages: *Settings → Pages →* nhánh `master`, thư mục `/ (root)`. File `CNAME` giữ tên miền riêng, `.nojekyll` bỏ qua bước Jekyll.

> Ảnh có mặt các bạn cùng lớp: hãy hỏi ý trước khi đăng công khai.
