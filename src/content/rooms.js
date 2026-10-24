// One entry per room (= one folder directly under photos/). The key must match the folder name.
// A room that has photos but no entry here still works — it just gets default styling.
//
//   order  – position in menus and on the lobby (lower first)
//   hue    – 0–360, the room's accent colour (HSL hue)
//   kicker – small line above the title      mood – one-word feeling
//   desc   – the sentence shown on the room's door and in its hero
//   cover  – optional: the `src` of the photo to use as the room's cover, e.g. 'photos/Cuối cấp/Tập thể/002.jpg'
//            (without it a landscape photo from the middle of the room is chosen)

export const roomMeta = {
  'Cuối cấp': {
    order: 1, hue: 12, kicker: 'Chia xa', mood: 'Xúc động',
    desc: 'Buổi học cuối, lễ tổng kết, những cái ôm thật chặt trước ngày mỗi người một ngả.',
  },
  'Lễ hội và văn nghệ': {
    order: 2, hue: 335, kicker: 'Rực rỡ', mood: 'Rộn ràng',
    desc: 'Hội trại, văn nghệ, lễ hội ẩm thực — những ngày cả lớp cùng bước ra ánh đèn.',
  },
  'Hằng ngày': {
    order: 3, hue: 175, kicker: 'Bình thường mà nhớ', mood: 'Dịu dàng',
    desc: 'Giờ ra chơi, giờ nghỉ trưa, góc bàn quen — những khoảnh khắc đời thường hóa thành ký ức.',
  },
  'Họp lớp và sau này': {
    order: 4, hue: 215, kicker: 'Hiện tại', mood: 'Ấm áp',
    desc: 'Mỗi người một nơi, nhưng vẫn tìm đường về gặp nhau.',
  },
};
