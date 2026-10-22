'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const GF = require('../gf-core.js');
const V = require('./vectors.json');
const root = path.join(__dirname, '..');
const ja = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const en = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');

test('README: hub metadata, opening and educational warning', () => {
  for (const snippet of ['id: day123', 'slug: shamir-sharing-cipherlab', 'title: "ShamirSharing CipherLab"',
    'category_ja:', '  - 現代暗号', '  - 情報理論', 'category_en:', '  - Modern Cryptography',
    '  - Information Theory', 'difficulty: 3', 'hub: true']) assert.ok(ja.includes(snippet), snippet);
  assert.match(ja, /ShamirSharing CipherLabは、/);
  assert.match(ja, /① `n`人のうち`k`人/);
  assert.match(ja, /② `k−1`人.*情報は一切わかりません/);
  assert.match(en, /① Any k of the n participants/);
  assert.match(en, /② With only k−1 participants.*reveal no information/);
  assert.match(ja, /「手で追う」の`s`には架空の数.*実際に使っているパスワード、シードフレーズ、鍵の分割や保管には、この教材を使わない/);
  assert.match(en, /Use an invented number for s.*Do not use this teaching tool to split or store passwords/);
  assert.doesNotMatch(en, /category_ja:|slug: shamir-sharing-cipherlab/);
});
test('README: Japanese and English section order has full parity', () => {
  const headings = text => [...text.matchAll(/^## (.+)$/gm)].map(match => match[1]);
  const j = headings(ja), e = headings(en);
  assert.equal(j.length, 14);
  assert.equal(e.length, 14);
  assert.deepEqual(j.map(h => h.split(' ')[0]), e.map(h => h.split(' ')[0]));
  assert.match(ja, /このツールならではの使い方/);
  assert.match(en, /Ways of using this tool in particular/);
  for (const text of [ja, en]) {
    assert.match(text, /Day070 VisualCryptography CipherLab/);
    assert.match(text, /SHA-256 Byte Inspector/);
    assert.match(text, /OTP Animation/);
  }
});
test('README: arithmetic values agree with reference vectors in both languages', () => {
  const shares = GF.splitP([5, 4, 2], 5, 13);
  assert.deepEqual(shares, V.gfp_shares);
  for (const text of [ja, en]) {
    for (const pair of shares) assert.ok(text.includes(`(${pair.join(',')})`), pair.join(','));
    assert.ok(text.includes('(3,10,1)'));
    assert.ok(text.includes('(7,2,9)'));
    assert.ok(text.includes('s=1'));
    assert.ok(text.includes('13'));
    assert.ok(text.includes('21,35'));
    assert.ok(text.includes('8,9'));
    assert.ok(text.includes('2DB1'));
    assert.ok(text.includes('65,536'));
  }
});
test('README: book example can be reproduced from its stated coefficients', () => {
  const bookShares = GF.splitP([13, 10, 2], 5, 17);
  assert.deepEqual(bookShares, [[1, 8], [2, 7], [3, 10], [4, 0], [5, 11]]);
  for (const text of [ja, en]) {
    assert.ok(text.includes('p=17, k=3, n=5, s=13, a₁=10, a₂=2'));
    assert.ok(text.includes('8,7,10,0,11'));
  }
});
test('README: both file trees match real tracked-source layout', () => {
  function allFiles(dir, prefix = '') {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
      if (item.name === '.git' || item.name === '.work') return [];
      const relative = prefix ? `${prefix}/${item.name}` : item.name;
      return item.isDirectory() ? allFiles(path.join(dir, item.name), relative) : [relative];
    });
  }
  const actual = allFiles(root).sort();
  for (const [name, text] of [['ja', ja], ['en', en]]) {
    const listed = [...text.matchAll(/^\|-- ([^ ]+) # (.+)$/gm)].map(match => match[1]).sort();
    assert.deepEqual(listed, actual, name);
  }
});
test('README: screenshots exist and wording stays in educational scope', () => {
  for (const [locale, text] of [['ja', ja], ['en', en]]) {
    for (const theme of ['light', 'dark']) for (const tab of ['hand', 'bytes', 'pitfalls', 'candidates']) {
      const image = `assets/${locale}/${theme}/${tab}.png`;
      assert.ok(text.includes(image), image);
      assert.ok(fs.statSync(path.join(root, image)).size > 2000, image);
    }
  }
  assert.doesNotMatch(ja, /照合|突き合わせ|効く|走る|安全に保管できる|本物の秘密を分けて/);
});
