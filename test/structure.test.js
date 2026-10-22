'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const M = require('../messages.js');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('index.html'), app = read('app.js'), gf = read('gf-core.js'), pitfalls = read('pitfalls.js');

test('E: strict CSP and offline file script structure', () => {
  assert.match(html, /default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; connect-src 'none'/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.doesNotMatch(html, /<script[^>]*type="module"|<script(?![^>]*src=)[^>]*>|\sstyle=|\sonclick=/);
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.match(html, /<dialog id="help-dialog"/);
});
test('E: calculation uses no weak random fallback or network and stores only preferences', () => {
  for (const code of [gf, pitfalls, app]) {
    assert.doesNotMatch(code, /Math\.random\s*\(|fetch\s*\(|XMLHttpRequest|WebSocket|innerHTML/);
  }
  assert.match(app, /crypto\.getRandomValues/);
  assert.deepEqual([...app.matchAll(/localStorage\.(?:setItem|getItem)\('shamir-sharing-cipherlab\.([^']+)'/g)].map(match => match[1]).sort(), ['language','theme']);
  assert.doesNotMatch(app, /URLSearchParams|location\.search|location\.hash/);
  assert.doesNotMatch(gf, /pitfalls\.js/);
});
test('E: bilingual keys and all HTML labels', () => {
  assert.deepEqual(Object.keys(M.ja).sort(), Object.keys(M.en).sort());
  for (const match of html.matchAll(/data-(?:i18n|label)="([^"]+)"/g)) {
    assert.ok(Object.hasOwn(M.ja, match[1]), `missing ${match[1]}`);
  }
  for (let i = 1; i <= 8; i++) for (const suffix of ['', 'Text']) assert.ok(M.ja[`lesson${i}${suffix}`]);
});
test('E: wording and original SHA-256 bytes from Day118 main 2c1afac', () => {
  for (const [locale, messages] of Object.entries(M)) {
    for (const [key, value] of Object.entries(messages)) {
      if (locale === 'ja') assert.doesNotMatch(value, /照合|突き合わせ|効く|走る|安全に保管できる|本物の秘密を分けて/, key);
    }
  }
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, '..', 'sha256-core.js'))).digest('hex');
  assert.equal(hash, '8b8f66a17ac3dd93503c8390652cb9150b6d8a9e8788364e9d6f26b9c3e67246');
});
