// Site-wide identity & copy. Edit freely — no code changes needed.

export const site = {
  name: 'K3A2',
  classCodes: ['10A2', '11A2', '12TN2'],
  school: 'THPT Châu Thành 1',
  province: 'Đồng Tháp',
  years: [2015, 2018],

  exhibit: {
    kicker: 'Triển lãm trực tuyến',
    title: ['Thanh xuân', 'của chúng mình'],
    note: 'Ba năm · một lớp · một đời nhớ',
  },

  // Words that scroll across the lobby.
  marquee: ['Kỷ niệm', 'Con người', 'Địa điểm', 'Khoảnh khắc', 'Lắng đọng', 'Quá khứ', 'Hiện tại'],

  // Pages that are not rooms. Rooms are added to the menu automatically.
  nav: [
    { href: 'con-nguoi.html', label: 'Con người', key: 'people', kicker: 'Gương mặt & lời nhắn' },
    { href: 'dia-diem.html', label: 'Địa điểm', key: 'places', kicker: 'Nơi ký ức đã đi qua' },
    { href: 'lang-dong.html', label: 'Lắng đọng', key: 'reverie', kicker: 'Ngồi lại một lát' },
  ],

  contact: { label: 'Nhóm Zalo / Facebook của lớp', url: '#' },
};
