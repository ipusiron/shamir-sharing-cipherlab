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
  assert.match(ja, /本物の秘密.*入れない/);
  assert.match(en, /Educational use only\. Do not enter real secrets/);
  assert.doesNotMatch(en, /category_ja:|slug: shamir-sharing-cipherlab/);
});
test('README: Japanese and English section order has full parity', () => {
  const headings = text => [...text.matchAll(/^## (.+)$/gm)].map(match => match[1]);
  const j = headings(ja), e = headings(en);
  assert.equal(j.length, 13);
  assert.equal(e.length, 13);
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
    assert.ok(text.includes('S=1'));
    assert.ok(text.includes('13'));
    assert.ok(text.includes('21,35'));
    assert.ok(text.includes('8,9'));
    assert.ok(text.includes('2DB1'));
    assert.ok(text.includes('65,536'));
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
