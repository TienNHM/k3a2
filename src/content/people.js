// Members and notes. The 30 names below come from the class Zalo group's current member list.
// Anyone who has left the group is not here yet; add them like the others.
//
//   name     – required
//   role     – optional label under the name (e.g. 'Lớp trưởng')
//   quote    – optional: something they used to say
//   now      – optional: a line about them today. A card WITH `now` turns over to show it;
//              a card without it stays flat (no empty back side)
//   avatar   – optional path, e.g. 'photos/avatars/a.jpg' (square, ~160px; taken from Zalo)
//   teacher  – true for the homeroom teacher: pinned first and highlighted
//   sort     – optional: the word to sort by, when the given name is not the last word of `name`
//
// Cards are sorted by given name (the last word), the teacher first.

export const members = [
  { name: 'Thầy Nguyễn Trí Tín', role: 'Giáo viên chủ nhiệm', teacher: true },
  { name: 'Bảo Linh', avatar: 'photos/avatars/bao-linh.jpg' },
  { name: 'Thanh Hòa', avatar: 'photos/avatars/thanh-hoa.jpg' },
  { name: 'Trần Kim Quyên', avatar: 'photos/avatars/tran-kim-quyen.jpg' },
  { name: 'Lê Công Phúc', avatar: 'photos/avatars/le-cong-phuc.jpg' },
  { name: 'Lê Hoàng Sơn', avatar: 'photos/avatars/le-hoang-son.jpg' },
  { name: 'Lê Minh Tính' },
  { name: 'Lê Thị Bảo Trân', avatar: 'photos/avatars/le-thi-bao-tran.jpg' },
  { name: 'Lê Thị Bơ', avatar: 'photos/avatars/le-thi-bo.jpg' },
  { name: 'Linh Nguyễn', sort: 'Linh' },
  { name: 'Minh Thuận' },
  { name: 'Ngọc', avatar: 'photos/avatars/ngoc.jpg' },
  { name: 'Nguyễn Huỳnh Minh Tiến', avatar: 'photos/avatars/nguyen-huynh-minh-tien.jpg' },
  { name: 'Nguyễn Minh Ý', avatar: 'photos/avatars/nguyen-minh-y.jpg' },
  { name: 'Nguyễn Quốc Thái', avatar: 'photos/avatars/nguyen-quoc-thai.jpg' },
  { name: 'Nguyễn Thanh Tài', avatar: 'photos/avatars/nguyen-thanh-tai.jpg' },
  { name: 'Nguyễn Thế Hiền', avatar: 'photos/avatars/nguyen-the-hien.jpg' },
  { name: 'Nguyễn Thế Vinh', avatar: 'photos/avatars/nguyen-the-vinh.jpg' },
  { name: 'Nguyễn Thị Mỹ Tiên', avatar: 'photos/avatars/nguyen-thi-my-tien.jpg' },
  { name: 'Oanh', avatar: 'photos/avatars/oanh.jpg' },
  { name: 'Phan Trâm Anh' },
  { name: 'Tấn Phát', avatar: 'photos/avatars/tan-phat.jpg' },
  { name: 'Thúy Nga', avatar: 'photos/avatars/thuy-nga.jpg' },
  { name: 'Thủy Tiên', avatar: 'photos/avatars/thuy-tien.jpg' },
  { name: 'Trần Minh Nhiều', avatar: 'photos/avatars/tran-minh-nhieu.jpg' },
  { name: 'Trần Phát Đạt', avatar: 'photos/avatars/tran-phat-dat.jpg' },
  { name: 'Trịnh Thanh Tú', avatar: 'photos/avatars/trinh-thanh-tu.jpg' },
  { name: 'Trương Minh Thắng', avatar: 'photos/avatars/truong-minh-thang.jpg' },
  { name: 'Vân Anh', avatar: 'photos/avatars/van-anh.jpg' },
  { name: 'Yến Nhi', avatar: 'photos/avatars/yen-nhi.jpg' },
];

export const wishes = [
  { from: 'Một bạn nào đó', text: 'Mong 10 năm nữa mình vẫn đủ cả lớp ngồi chung một bàn.' },
  { from: 'Một bạn khác', text: 'Cảm ơn cả lớp vì đã làm thanh xuân của mình đáng nhớ.' },
];

// Shown at the end of the time machine ("Nay").
export const present = {
  title: 'Bây giờ',
  text: 'Mười năm nữa, chúng mình sẽ nhìn lại những bức ảnh này và mỉm cười. Hãy thêm vào đây câu chuyện của hôm nay.',
};
