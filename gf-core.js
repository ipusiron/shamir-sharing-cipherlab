/* ShamirSharing CipherLab - MIT (c) 2026 ipusiron. Pure educational arithmetic. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShamirGF = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const PRIMES = [7, 11, 13, 17, 19, 23];
  const mod = (a, p) => ((a % p) + p) % p;
  function checkP(p) { if (!PRIMES.includes(p)) throw new RangeError('unsupported prime'); }
  function invP(a, p) {
    checkP(p);
    let r0 = p, r1 = mod(a, p), t0 = 0, t1 = 1;
    while (r1) {
      const q = Math.floor(r0 / r1);
      [r0, r1] = [r1, r0 - q * r1];
      [t0, t1] = [t1, t0 - q * t1];
    }
    if (r0 !== 1) throw new RangeError('zero has no inverse');
    return mod(t0, p);
  }
  const evalP = (coefficients, x, p) => coefficients.reduceRight((v, c) => mod(v * x + c, p), 0);
  function validatePointsP(points, p) {
    checkP(p);
    if (!Array.isArray(points) || !points.length) throw new RangeError('no points');
    const xs = new Set();
    for (const [x, y] of points) {
      if (!Number.isInteger(x) || x < 1 || x >= p || !Number.isInteger(y) || y < 0 || y >= p || xs.has(x))
        throw new RangeError('invalid or duplicate point');
      xs.add(x);
    }
  }
  function splitP(coefficients, n, p) {
    checkP(p);
    if (!Array.isArray(coefficients) || !coefficients.length || !Number.isInteger(n) || n < coefficients.length || n > Math.min(p - 1, 8) || coefficients.some(c => !Number.isInteger(c) || c < 0 || c >= p))
      throw new RangeError('invalid polynomial or share count');
    return Array.from({ length: n }, (_, i) => [i + 1, evalP(coefficients, i + 1, p)]);
  }
  function lagrangeP(points, k, p) {
    validatePointsP(points, p);
    if (!Number.isInteger(k) || k < 1 || points.length < k) throw new RangeError('insufficient shares');
    const terms = points.map(([xi, yi], i) => {
      let numerator = 1, denominator = 1;
      points.forEach(([xj], j) => { if (j !== i) {
        numerator = mod(numerator * xj, p);
        denominator = mod(denominator * (xj - xi), p);
      }});
      const inverse = invP(denominator, p);
      const lambda = mod(numerator * inverse, p);
      return { x: xi, y: yi, numerator, denominator, inverse, lambda, term: mod(lambda * yi, p) };
    });
    return { terms, secret: mod(terms.reduce((sum, row) => sum + row.term, 0), p) };
  }
  function polynomialP(points, p) {
    const xs = new Set(points.map(point => point[0]));
    if (xs.size !== points.length) throw new RangeError('duplicate point');
    let coefficients = [0];
    points.forEach(([xi, yi], i) => {
      let basis = [1], denominator = 1;
      points.forEach(([xj], j) => { if (i !== j) {
        const next = Array(basis.length + 1).fill(0);
        basis.forEach((value, degree) => {
          next[degree] = mod(next[degree] - value * xj, p);
          next[degree + 1] = mod(next[degree + 1] + value, p);
        });
        basis = next;
        denominator = mod(denominator * (xi - xj), p);
      }});
      const scale = mod(yi * invP(denominator, p), p);
      while (coefficients.length < basis.length) coefficients.push(0);
      basis.forEach((value, degree) => { coefficients[degree] = mod(coefficients[degree] + value * scale, p); });
    });
    return coefficients;
  }
  function candidatesP(points, k, p) {
    checkP(p);
    if (k < 2 || points.length !== k - 1) throw new RangeError('select exactly k-1 shares');
    validatePointsP(points, p);
    return Array.from({ length: p }, (_, secret) => {
      const coefficients = polynomialP([[0, secret], ...points], p);
      return { secret, coefficients, values: Array.from({ length: p }, (_, x) => evalP(coefficients, x, p)), leadingZero: coefficients[k - 1] === 0 };
    });
  }
  function mul256(a, b) {
    let result = 0, x = a & 255, y = b & 255;
    for (let i = 0; i < 8; i++) {
      result ^= x & -(y & 1);
      const carry = (x >>> 7) & 1;
      x = ((x << 1) & 255) ^ (0x1b & -carry);
      y >>>= 1;
    }
    return result;
  }
  function mul256Bitwise(a, b) {
    let result = 0, x = a, y = b;
    while (y) {
      if (y & 1) result ^= x;
      x = ((x << 1) ^ ((x & 128) ? 0x11b : 0)) & 255;
      y >>>= 1;
    }
    return result;
  }
  const EXP = new Uint8Array(510), LOG = new Uint8Array(256);
  { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x = mul256(x, 3); }
    for (let i = 255; i < 510; i++) EXP[i] = EXP[i - 255]; }
  const mul256Table = (a, b) => a && b ? EXP[LOG[a] + LOG[b]] : 0;
  function pow256(a, exponent) {
    let result = 1, base = a;
    for (let i = 0; i < 8; i++) {
      const factor = (exponent >>> i) & 1;
      const product = mul256(result, base);
      result ^= (result ^ product) & -factor;
      base = mul256(base, base);
    }
    return result;
  }
  function inv256(a) { if (!a) throw new RangeError('zero has no inverse'); return pow256(a, 254); }
  const div256 = (a, b) => mul256(a, inv256(b));
  const eval256 = (coefficients, x) => coefficients.reduceRight((v, c) => mul256(v, x) ^ c, 0);
  function split256(secretBytes, k, n, randomBytes) {
    if (!(secretBytes instanceof Uint8Array) || !Number.isInteger(k) || k < 2 || !Number.isInteger(n) || n < k || n > 8 || typeof randomBytes !== 'function')
      throw new RangeError('invalid split input');
    const shares = Array.from({ length: n }, (_, i) => ({ x: i + 1, y: new Uint8Array(secretBytes.length) }));
    secretBytes.forEach((byte, index) => {
      const drawn = randomBytes(k - 1);
      if (!(drawn instanceof Uint8Array) || drawn.length !== k - 1) throw new RangeError('random byte source failed');
      const coefficients = [byte, ...drawn];
      shares.forEach(share => { share.y[index] = eval256(coefficients, share.x); });
    });
    return shares;
  }
  function validateShares256(shares, k) {
    if (!Array.isArray(shares) || !Number.isInteger(k) || k < 2 || shares.length < k) throw new RangeError('insufficient shares');
    const length = shares[0].y && shares[0].y.length, xs = new Set();
    for (const share of shares) {
      if (!Number.isInteger(share.x) || share.x < 1 || share.x > 255 || xs.has(share.x) || !(share.y instanceof Uint8Array) || share.y.length !== length)
        throw new RangeError('invalid or duplicate share');
      xs.add(share.x);
    }
  }
  function lagrange256(shares) {
    return shares.map((share, i) => {
      let numerator = 1, denominator = 1;
      shares.forEach((other, j) => { if (i !== j) {
        numerator = mul256(numerator, other.x);
        denominator = mul256(denominator, other.x ^ share.x);
      }});
      return { x: share.x, numerator, denominator, inverse: inv256(denominator), lambda: div256(numerator, denominator) };
    });
  }
  function combine256(shares, k) {
    validateShares256(shares, k);
    const terms = lagrange256(shares), out = new Uint8Array(shares[0].y.length);
    out.forEach((_, byte) => { out[byte] = shares.reduce((value, share, i) => value ^ mul256(terms[i].lambda, share.y[byte]), 0); });
    return { terms, out };
  }
  return { PRIMES, mod, invP, evalP, splitP, lagrangeP, polynomialP, candidatesP,
    mul256, mul256Bitwise, mul256Table, EXP, LOG, pow256, inv256, div256, eval256, split256, combine256 };
}));
