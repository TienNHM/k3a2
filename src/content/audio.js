// Sound settings. By default everything is synthesised in the browser (no audio files needed).
//
//   volume – master level, 0–1
//   music  – optional: use your own looping track instead of the synthesised chamber music, e.g.
//            { src: 'audio/nhac-nen.mp3', title: 'Tên bài hát' }
//            (put the file in an `audio/` folder at the site root; only use music you have the rights to)

export const audioConfig = {
  volume: 0.7,
  music: null,
};
