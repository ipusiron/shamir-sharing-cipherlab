'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const GF = require('../gf-core.js');
const P = require('../pitfalls.js');
const V = require('./vectors.json');
const source = fs.readFileSync(path.join(__dirname, '..', 'gf-core.js'), 'utf8');
const hex = P.hex;
const sample = new TextEncoder().encode('MEET AT DAWN');

test('A: three GF(2^8) multiplication methods agree on all 65,536 pairs', () => {
  for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) {
    assert.equal(GF.mul256(a, b), GF.mul256Table(a, b));
    assert.equal(GF.mul256(a, b), GF.mul256Bitwise(a, b));
  }
});
test('A: FIPS 197 multiplication examples, editions distinguished', () => {
  // 0x57 * 0x13 = 0xfe: FIPS 197 (2001) and upd1 (2023).
  assert.equal(GF.mul256(0x57, 0x13).toString(16), V.fips['57x13']);
  // 0x57 * 0x83 = 0xc1: FIPS 197 (2001), section 4.2 only.
  assert.equal(GF.mul256(0x57, 0x83).toString(16), V.fips['57x83']);
  for (let a = 1; a < 256; a++) assert.equal(GF.mul256(a, GF.inv256(a)), 1);
  assert.throws(() => GF.inv256(0), RangeError);
});
test('A: generator 03 has order 255 and 02 has order 51', () => {
  const order = g => { let x = 1, count = 0; do { x = GF.mul256(x, g); count++; } while (x !== 1); return count; };
  assert.equal(order(2), V.order_02);
  assert.equal(order(3), V.order_03);
  assert.equal(new Set(GF.EXP.slice(0, 255)).size, 255);
});
test('A: 0x11B reduction and the fixed byte-share example', () => {
  const modulus = (1 << 8) | (1 << 4) | (1 << 3) | (1 << 1) | 1;
  assert.equal(modulus, 0x11b);
  let power = 2;
  for (let i = 0; i < 4; i++) power = GF.mul256(power, power);
  assert.equal(power, 0x5e); // z^16 mod m(z)
  const degree = x => 31 - Math.clz32(x);
  const remainder = (a, b) => { while (a && degree(a) >= degree(b)) a ^= b << (degree(a) - degree(b)); return a; };
  let a = modulus, b = power ^ 2;
  while (b) [a, b] = [b, remainder(a, b)];
  assert.equal(a, 1);
  for (let i = 4; i < 8; i++) power = GF.mul256(power, power);
  assert.equal(power, 2); // z^256 mod m(z) = z
  assert.equal(GF.eval256([0x4d, 0x57, 0x13], 2), 0xaf);
  assert.equal(GF.eval256([0x4d, 0x57, 0x13], 4), 0x21);
});
test('B: default GF(13) shares and all three interpolation tables', () => {
  const shares = GF.splitP([5, 4, 2], 5, 13);
  assert.deepEqual(shares, V.gfp_shares);
  for (const pick of ['123', '245', '135']) {
    const chosen = [...pick].map(x => shares[Number(x) - 1]);
    const result = GF.lagrangeP(chosen, 3, 13);
    const expected = V['gfp_lambda_' + pick];
    assert.deepEqual(result.terms.map(row => row.lambda), expected.lambda);
    assert.deepEqual(result.terms.map(row => row.term), expected.terms);
    assert.equal(result.secret, expected.secret);
  }
});
test('B: k-1 gives every candidate once and leading-zero restriction leaks s=1', () => {
  const candidates = GF.candidatesP(V.gfp_shares.slice(0, 2), 3, 13);
  assert.equal(candidates.length, V.gfp_candidates_count);
  assert.equal(new Set(candidates.map(row => row.values.join(','))).size, V.gfp_candidates_distinct);
  assert.deepEqual(candidates.filter(row => row.leadingZero).map(row => row.secret), V.gfp_leading_zero_candidates);
  for (const row of candidates) {
    assert.equal(row.values[1], 11);
    assert.equal(row.values[2], 8);
  }
});
test('B: integer remainder, linear tweak, k=1 and guards', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(x => 5 + 4 * x + 2 * x * x), [11, 21, 35, 53, 75]);
  const changed = GF.lagrangeP([[1, 12], [2, 8], [3, 9]], 3, 13);
  assert.equal(changed.secret, V.gfp_tweak_x1_plus1);
  assert.equal(GF.mod(5 + changed.terms[0].lambda, 13), V.gfp_tweak_x1_plus1);
  assert.deepEqual(GF.splitP([5], 3, 13), V.gfp_k1_shares);
  assert.throws(() => GF.lagrangeP([[0, 5], [1, 11], [2, 8]], 3, 13), RangeError);
  assert.throws(() => GF.lagrangeP([[1, 11], [1, 8], [2, 8]], 3, 13), RangeError);
  assert.throws(() => GF.lagrangeP([[1, 11], [2, 8]], 3, 13), RangeError);
});
test('C: deterministic GF(2^8) shares, coefficients and weights', () => {
  const shares = GF.split256(sample, 3, 5, P.deterministicRandom());
  assert.deepEqual(shares.map(share => ({ x: share.x, y: hex(share.y) })), V.gf256_shares_MEET);
  assert.deepEqual(Array.from(P.deterministicRandom()(4)), V.gf256_first_coeffs);
  assert.deepEqual(GF.combine256(shares.slice(0, 3), 3).terms.map(row => row.lambda), V.gf256_lambda_123);
  assert.deepEqual(GF.combine256([shares[1], shares[3], shares[4]], 3).terms.map(row => row.lambda.toString(16).toUpperCase().padStart(2, '0')), V.gf256_lambda_245);
});
test('C: every 3-of-5 combination reconstructs the sample', () => {
  const shares = GF.split256(sample, 3, 5, P.deterministicRandom());
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 4; b++) for (let c = b + 1; c < 5; c++)
    assert.deepEqual(GF.combine256([shares[a], shares[b], shares[c]], 3).out, sample);
  assert.equal(V.gf256_roundtrip_ok, true);
});
test('C: random round trips and invalid share checks', () => {
  for (let k = 2; k <= 8; k++) {
    const secret = new Uint8Array(24), random = count => { const out = new Uint8Array(count); require('node:crypto').webcrypto.getRandomValues(out); return out; };
    require('node:crypto').webcrypto.getRandomValues(secret);
    const shares = GF.split256(secret, k, 8, random);
    assert.deepEqual(GF.combine256(shares.slice(0, k), k).out, secret);
  }
  const shares = GF.split256(sample, 3, 5, P.deterministicRandom());
  assert.throws(() => GF.combine256(shares.slice(0, 2), 3), RangeError);
  assert.throws(() => GF.combine256([{ x: 0, y: shares[0].y }, shares[1], shares[2]], 3), RangeError);
  assert.throws(() => GF.combine256([shares[0], shares[0], shares[2]], 3), RangeError);
  assert.equal(source.includes('pitfalls.js'), false);
});
test('D: unsafe models and CRC/fingerprint match every known vector', () => {
  const demo = P.demo();
  assert.equal(hex(demo.missing), V.naive_two_shares_12);
  assert.equal(Array.from(demo.missing, b => String.fromCharCode(b)).join(''), V.naive_two_shares_12_ascii);
  assert.equal(new TextDecoder().decode(demo.zero), V.x0_attack_result);
  assert.equal(hex(P.fingerprint(sample)), V.digest_T);
  assert.deepEqual(demo.shares.map(share => ({ x: share.x, y: hex(share.y) })), V.gf256_shares_M);
  assert.deepEqual(demo.shares.map(share => ({ x: share.x, crc: P.crcShare(share).toString(16).toUpperCase().padStart(8, '0') })), V.crc32_shares_M);
  assert.equal(hex(demo.error), V.tamper_E);
  assert.equal(hex(demo.changed.y), V.tamper_share2_y);
  assert.equal(demo.changedCrc.toString(16).toUpperCase().padStart(8, '0'), V.tamper_share2_crc_recomputed);
  assert.equal(new TextDecoder().decode(demo.reconstructed.slice(0, sample.length)), V.tamper_reconstructed_S);
  assert.equal(hex(demo.reconstructed.slice(sample.length)), V.tamper_reconstructed_T);
  assert.equal(demo.fingerprintPassesChanged, V.tamper_digest_matches);
  assert.equal(new TextDecoder().decode(demo.recoveredByCheater.slice(0, sample.length)), V.tamper_cheater_recovers);
  assert.equal(hex(demo.reconstructed245.slice(0, sample.length)), V.tamper_set245_S_hex);
  assert.equal(P.verifyFingerprint(demo.reconstructed245), V.tamper_set245_digest_matches);
  assert.equal(demo.originalCrcPassesChanged, false);
  assert.equal(demo.recomputedCrcPassesChanged, true);
  assert.equal(demo.originalCrcs[1].toString(16).toUpperCase().padStart(8, '0'), V.crc32_share2_original);
  assert.equal(P.crc32(new TextEncoder().encode('123456789')).toString(16), V.crc32_check_123456789);
});
