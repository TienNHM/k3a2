# Trang kỷ niệm lớp K3A2

Site tĩnh (HTML/CSS/JS), không cần build. Mở `index.html` hoặc chạy `npx serve` để xem.

## Sửa nội dung
Chỉnh `data.js`: tên lớp, trường, mốc thời gian, thành viên, lưu bút, link nhóm chat.

## Thêm ảnh từ Google Photos
Google Photos không cho nhúng ảnh trực tiếp ổn định, nên tải ảnh về rồi để trong repo:

1. Mở album trên Google Photos → **⋮ → Tải xuống tất cả** (hoặc dùng [Google Takeout](https://takeout.google.com) nếu nhiều ảnh).
2. Giải nén vào `photos/`, mỗi album một thư mục con, ví dụ `photos/2016-van-nghe/`.
   Ảnh đại diện thành viên để trong `photos/avatars/`.
3. Nên nén ảnh (~1600px cạnh dài, <500KB) để web tải nhanh.
4. Chạy:
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/gen-photos.ps1
   ```
   Lệnh này tạo lại `photos.js`; tên thư mục thành bộ lọc album, tên file thành chú thích.

## Đưa lên mạng (miễn phí)
Push repo lên GitHub → Settings → Pages → chọn branch `main`, hoặc kéo thả thư mục vào Netlify.

> Lưu ý riêng tư: đã public thì ai cũng xem được ảnh. Hỏi ý các bạn trước khi đăng, hoặc dùng Netlify có đặt mật khẩu.
