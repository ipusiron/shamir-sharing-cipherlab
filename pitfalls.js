/* ShamirSharing CipherLab - MIT (c) 2026 ipusiron.
 * Deliberately unsafe reconstruction models live only in this file. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./gf-core.js'), require('./sha256-core.js'));
  else root.ShamirPitfalls = factory(root.ShamirGF, root.SHA256ByteCore);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (GF, SHA) {
  'use strict';
  const bytes = text => new TextEncoder().encode(text);
  const hex = values => Array.from(values, value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  function crc32(values) {
    let crc = 0xffffffff;
    for (const byte of values) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  const crcShare = share => crc32(Uint8Array.of(share.x, ...share.y));
  // Missing threshold and x=0 validation are intentional flaws of this model.
  function unsafeCombine(shares) {
    if (!shares.length) throw new RangeError('no shares');
    const length = shares[0].y.length, xs = new Set();
    for (const share of shares) {
      if (xs.has(share.x) || share.y.length !== length) throw new RangeError('duplicate x or length');
      xs.add(share.x);
    }
    const lambda = shares.map((share, i) => {
      let num = 1, den = 1;
      shares.forEach((other, j) => { if (i !== j) {
        num = GF.mul256(num, other.x);
        den = GF.mul256(den, other.x ^ share.x);
      }});
      return GF.div256(num, den);
    });
    const out = new Uint8Array(length);
    for (let b = 0; b < length; b++) out[b] = shares.reduce((acc, share, i) => acc ^ GF.mul256(lambda[i], share.y[b]), 0);
    return { lambda, out };
  }
  function fingerprint(secret) { return SHA.hash(secret).digest.slice(0, 4); }
  function attachFingerprint(secret) {
    const out = new Uint8Array(secret.length + 4);
    out.set(secret); out.set(fingerprint(secret), secret.length);
    return out;
  }
  function verifyFingerprint(combined) {
    if (combined.length < 4) return false;
    const secret = combined.slice(0, -4), actual = fingerprint(secret);
    return actual.every((value, index) => value === combined[secret.length + index]);
  }
  function deterministicRandom() {
    let index = 0;
    return count => Uint8Array.from({ length: count }, () => (37 * index++ + 11) & 255);
  }
  function demo() {
    const secret = bytes('MEET AT DAWN');
    const plain = GF.split256(secret, 3, 5, deterministicRandom());
    const missing = unsafeCombine([plain[0], plain[1]]).out;
    const forgedZero = { x: 0, y: bytes('ATTACKER!!!!') };
    const zero = unsafeCombine([plain[0], forgedZero, plain[2]]).out;
    const packed = attachFingerprint(secret);
    const shares = GF.split256(packed, 3, 5, deterministicRandom());
    const error = new Uint8Array(packed.length);
    const target = bytes('MEET AT DUSK');
    for (let i = 0; i < secret.length; i++) error[i] = secret[i] ^ target[i];
    const lambda2 = GF.combine256(shares.slice(0, 3), 3).terms[1].lambda;
    const changed = { x: 2, y: Uint8Array.from(shares[1].y, (value, i) => value ^ GF.div256(error[i], lambda2)) };
    const reconstructed = unsafeCombine([shares[0], changed, shares[2]]).out;
    const reconstructed245 = unsafeCombine([changed, shares[3], shares[4]]).out;
    const recoveredByCheater = Uint8Array.from(reconstructed, (value, i) => value ^ error[i]);
    return { secret, plain, missing, zero, packed, shares, error, changed, reconstructed,
      reconstructed245, recoveredByCheater, originalCrcs: shares.map(crcShare), changedCrc: crcShare(changed),
      originalCrcPassesChanged: crcShare(shares[1]) === crcShare(changed),
      recomputedCrcPassesChanged: crcShare(changed) === crcShare(changed),
      fingerprintPassesChanged: verifyFingerprint(reconstructed) };
  }
  return { bytes, hex, crc32, crcShare, unsafeCombine, fingerprint, attachFingerprint, verifyFingerprint, deterministicRandom, demo };
}));
