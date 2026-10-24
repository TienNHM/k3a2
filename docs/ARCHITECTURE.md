# Kiến trúc

Mục tiêu: **thêm nội dung không cần sửa code, thêm tính năng không cần sửa chỗ khác.** Site gồm ba lớp tách bạch.

```
        ┌───────────────────────────────┐
 viết   │  src/content/*.js             │  dữ liệu thuần: tên, mô tả, ngày, màu, người, nơi chốn
 tay    └──────────────┬────────────────┘
        ┌──────────────┴────────────────┐
 sinh   │  src/content/photos.manifest  │  danh sách ảnh + kích thước, do tools/gen-photos.ps1 tạo
 tự động└──────────────┬────────────────┘
                       ▼
        ┌───────────────────────────────┐
 engine │  src/js/core/                 │  data (mô hình), dom (h), motion, registry
        └──────────────┬────────────────┘
                       ▼
        ┌───────────────────────────────┐
 giao   │  src/js/components/*.js       │  mỗi thành phần một file: mount(el)
 diện   └──────────────┬────────────────┘
                       ▼
        trang HTML = khung + <section data-component="...">
```

## Luồng dữ liệu

`photos/<Phòng>/<Bộ sưu tập>/NNN.jpg` → `gen-photos.ps1` → `photos.manifest.js` → `core/data.js` ghép với `content/rooms.js` và `content/albums.js` thành **Room → Album → Photo**. Mọi thành phần chỉ đọc mô hình này (`rooms`, `photos`, `featured`, `photosOfYear`…); không thành phần nào tự đọc thư mục hay tự đoán cấu trúc.

Tên phòng/bộ sưu tập trong `content/*.js` phải **khớp tên thư mục**. Phòng không có mục trong `rooms.js` vẫn hoạt động với kiểu mặc định.

## Quy ước

- **ES modules**, không bundler, không dependency runtime. GSAP + ScrollTrigger tải từ CDN và là *tùy chọn*: thiếu hoặc người dùng bật "giảm chuyển động" thì mọi thứ vẫn dùng được (`core/motion.js` có `canScrub`).
- **Dựng DOM bằng `h()`** (`core/dom.js`), không nối chuỗi `innerHTML` → văn bản luôn được escape. Ngoại lệ duy nhất: `svg()` cho SVG trang trí cố định.
- **Mỗi thành phần** là `export default function mount(el)`; đọc tuỳ chọn từ `el.dataset`; thêm class gốc cho chính nó; không đụng phần tử ngoài `el` (trừ lớp phủ toàn trang như viewer/reverie, tự tạo khi cần).
- **CSS theo lớp** (`@layer tokens, base, layout, components, pages`): lớp sau thắng lớp trước, nên không cần `!important`. Mọi màu, cỡ chữ, khoảng cách, thời gian nằm ở `tokens.css`. Màu nhấn của phòng đi theo biến `--hue`.
- **Chuyển động**: dùng thuộc tính `translate`/`rotate`/`scale` riêng lẻ cho hiệu ứng CSS (reveal, nghiêng khung) để không đụng `transform` mà GSAP dùng. Hiệu ứng vào trang chạy khi `<html>` có class `is-entered`.
- **Lưới và hàng cuộn**: ô lưới một cột phải khai báo `minmax(0, 1fr)`, và phần tử lưới có `margin-inline: auto` phải có `width: 100%`. Nếu không, một dòng chữ dài hoặc một cuộn phim rộng sẽ làm giãn cả lưới; trên điện thoại trình duyệt khi đó thu nhỏ cả trang. `layout.css` đã gom sẵn các khối một cột; khối mới nên thêm vào danh sách `:where(...)` đó.
- **Âm thanh**: mọi âm thanh đi qua `core/audio.js` (tổng hợp bằng Web Audio, không có file). Chỉ phát sau khi người xem bật; thành phần chỉ gọi `sfx('tên')` / `setMood('tên')`, không tự tạo `AudioContext`.
- **Truy cập**: nút thật cho mọi thao tác, `aria-label` cho nút biểu tượng, `Esc`/mũi tên cho viewer, tôn trọng `prefers-reduced-motion`.

## Công thức mở rộng

### Thêm một phòng mới
Tạo thư mục `photos/<Tên phòng>/<Bộ sưu tập>/`, nhập ảnh, chạy `tools/gen-photos.ps1`. Trang `<slug>.html` và mục menu/cánh cửa tự xuất hiện. Muốn đặt màu, mô tả: thêm mục vào `content/rooms.js`.

### Thêm câu chuyện cho một bộ sưu tập
Trong `content/albums.js`: `'Tên bộ sưu tập': { year: 2018, dates: '…', place: '…', story: '…' }`. Câu chuyện hiện bên cạnh bộ sưu tập, trong viewer và trong chế độ Lắng đọng; `year` đưa ảnh vào dòng thời gian và cỗ máy thời gian.

### Thêm một khối giao diện mới
1. Tạo `src/js/components/ten-khoi.js` với `export default function mount(el) { … }`.
2. Đăng ký trong `src/js/core/registry.js`: `'ten-khoi': () => import('../components/ten-khoi.js')`.
3. Đặt `<section data-component="ten-khoi"></section>` vào trang cần dùng.
4. Style trong `src/css/pages/` (hoặc `components/` nếu dùng lại nhiều nơi) và `@import` trong `main.css`.

### Thêm một trang mới
Sao chép một trang viết tay (ví dụ `dia-diem.html`), đổi `data-page`, `data-key`, nội dung; thêm vào `site.nav` trong `content/site.js` để có mặt trong menu.

### Đổi diện mạo
Sửa `tokens.css` (palette, font, thang cỡ chữ, easing). Đổi font: sửa liên kết Google Fonts ở các trang HTML và biến `--f-*`.

## Kiểm tra nhanh trước khi đăng

- Mở từng trang: console không có lỗi, không tràn ngang trên 375px.
- Mở viewer (click ảnh), `←/→`, `Esc`; chạy "Lắng đọng", `Space` tạm dừng.
- Bật "giảm chuyển động" của hệ điều hành: trang vẫn đọc được, không có chữ ẩn.
- Chặn CDN (offline): site vẫn hiển thị, chỉ mất hiệu ứng cuộn.
