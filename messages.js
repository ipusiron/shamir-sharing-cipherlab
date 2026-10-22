/* ShamirSharing CipherLab - MIT (c) 2026 ipusiron. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShamirMessages = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
    ja: {
      theme: '明暗を切り替える', language: '英語に切り替える', help: 'ヘルプ', tablist: '学ぶ順番',
      tagline: 'k枚で1本に決まり、k−1枚ならどの秘密にも1本ずつ通ります。',
      educational: '学習用。本物の秘密（パスワード・シード・鍵）は入れないでください。',
      hand: '手で追う', bytes: 'バイトで見る', pitfalls: '確かめる',
      handIntro: '小さな素数の方眼で、分けて戻す計算を追います。',
      bytesIntro: '同じ考え方を GF(2⁸) のバイトに運びます。',
      pitfallsIntro: 'わざと無防備な模型と守る実装を比べます。',
      theory: '座学', theoryIntro: 'しきい値法の根拠と実装上の注意を読みます。',
      privacy: '入力は保存・送信しません。保存するのは言語と明暗のみです。',
      source: 'ソースコード / MIT License', helpText: '3つのタブを順に開き、方眼と表で計算を確かめてください。', close: '閉じる'
    },
    en: {
      theme: 'Toggle theme', language: 'Switch to Japanese', help: 'Help', tablist: 'Learning steps',
      tagline: 'k shares fix one polynomial; k−1 shares fit one polynomial for every secret.',
      educational: 'Educational use only. Do not enter real secrets, passwords, seed phrases or keys.',
      hand: 'Trace by hand', bytes: 'Bytes', pitfalls: 'Pitfalls',
      handIntro: 'Use a small prime field and a grid to follow splitting and reconstruction.',
      bytesIntro: 'Carry the same idea to bytes in GF(2⁸).',
      pitfallsIntro: 'Compare deliberately unsafe models with guarded implementations.',
      theory: 'Theory', theoryIntro: 'Read the basis of threshold sharing and implementation cautions.',
      privacy: 'Inputs are neither stored nor sent. Only language and theme are saved.',
      source: 'Source code / MIT License', helpText: 'Open the three tabs and check the arithmetic with the grid and tables.', close: 'Close'
    }
  };
}));
