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
      source: 'ソースコード / MIT License', helpText: '3つのタブを順に開き、方眼と表で計算を確かめてください。', close: '閉じる',
      randomCoefficients:'係数を乱数で決める', reset:'既定の例に戻す', distribute:'① 配る', termValues:'各項の整数値', sum:'合計',
      reconstruct:'② 戻す', chooseShares:'共有を選んで、k枚またはk−1枚で比べます。', selectK:'k枚を選ぶ', selectKMinus:'k−1枚を選ぶ', inverse:'分母の逆元',
      candidateTitle:'k−1枚で残る候補', candidateCount:'本の候補', candidateSecret:'秘密の候補', previous:'前の候補', next:'次の候補', showAll:'全部を重ねる',
      leadingOnly:'朱の印：最高次の係数を0以外に限る（候補が消える）', gridTitle:'GF(p) 方眼', gridHint:'点をドラッグするか、選んで同じ列のマスをタップ。矢印キーでも1マス動かせます。',
      gridLabel:'有限体の共有と候補の方眼', sharePoint:'共有点', realTitle:'実数の曲線を動かす', realWarning:'実数のままでは余りが漏れます。本体の計算は上の有限体の方眼で見てください。',
      realLabel:'実数の補間曲線', realIntercept:'y切片', realPoints:'通る点', integerTitle:'なぜ整数ではだめか',
      integerIntro:'mod p を外すと、f(x) mod x が秘密 S mod x になります。', integerExample:'整数の共有から余りが見える：',
      invalidInput:'0以上 p 未満の整数を入れてください。', kOne:'k=1：全員の共有が秘密そのもの。分けていない（ただのコピー）。'
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
      source: 'Source code / MIT License', helpText: 'Open the three tabs and check the arithmetic with the grid and tables.', close: 'Close',
      randomCoefficients:'Draw random coefficients', reset:'Reset example', distribute:'① Distribute', termValues:'Integer terms', sum:'Sum',
      reconstruct:'② Reconstruct', chooseShares:'Select k or k−1 shares to compare.', selectK:'Select k shares', selectKMinus:'Select k−1 shares', inverse:'Denominator inverse',
      candidateTitle:'Candidates with k−1 shares', candidateCount:'candidate polynomials', candidateSecret:'Candidate secret', previous:'Previous', next:'Next', showAll:'Overlay all',
      leadingOnly:'Red mark: require nonzero highest coefficient (candidates disappear)', gridTitle:'GF(p) grid', gridHint:'Drag a point, or select it and tap a cell in its column. Arrow keys move one cell.',
      gridLabel:'Finite field grid of shares and candidates', sharePoint:'Share point', realTitle:'Move a real-number curve', realWarning:'Real numbers leak remainders. Use the finite-field grid above for the actual arithmetic.',
      realLabel:'Real-number interpolation curve', realIntercept:'y-intercept', realPoints:'Points', integerTitle:'Why not ordinary integers?',
      integerIntro:'Without mod p, f(x) mod x reveals S mod x.', integerExample:'Integer shares expose remainders:',
      invalidInput:'Enter an integer from 0 to p−1.', kOne:'k=1: every share equals the secret. This is just copying, not splitting.'
    }
  };
}));
