English · [日本語](README.md)

# ShamirSharing CipherLab - Shamir secret sharing on grids and bytes

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/shamir-sharing-cipherlab?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/shamir-sharing-cipherlab?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/shamir-sharing-cipherlab)
![GitHub license](https://img.shields.io/github/license/ipusiron/shamir-sharing-cipherlab)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/shamir-sharing-cipherlab/)

**Day123 - 200 Security Tools with Generative AI**

ShamirSharing CipherLab is a hands-on teaching tool for Shamir secret sharing, using a grid, byte tables, and deliberately unsafe models. With k shares, one polynomial is fixed and the secret returns. With k−1 shares, exactly one polynomial fits every possible secret, so those shares reveal nothing about it.

Educational use only. Do not enter real secrets, passwords, seed phrases, or keys. This tool does not provide share formats, printing, QR codes, or storage advice.

---

## 🌐 Demo

👉 **[Open ShamirSharing CipherLab](https://ipusiron.github.io/shamir-sharing-cipherlab/)**

Open it in a browser, or open the HTML directly with `file://`. Computation and input stay in the browser, with no external submission.

---

## 📸 Screenshots

| State | Light | Dark |
|---|---|---|
| Trace by hand | ![Hand calculation, English, light](assets/en/light/hand.png) | ![Hand calculation, English, dark](assets/en/dark/hand.png) |
| k−1 candidates | ![Candidate grid, English, light](assets/en/light/candidates.png) | ![Candidate grid, English, dark](assets/en/dark/candidates.png) |
| Bytes | ![Byte table, English, light](assets/en/light/bytes.png) | ![Byte table, English, dark](assets/en/dark/bytes.png) |
| Pitfalls | ![Pitfall cards, English, light](assets/en/light/pitfalls.png) | ![Pitfall cards, English, dark](assets/en/dark/pitfalls.png) |

The same four states in Japanese appear in the [Japanese README](README.md).

## ✨ Features

| Step | Action | What you can see |
|---|---|---|
| Trace by hand | Distribute in GF(p), reconstruct with k shares, overlay k−1 candidates | Lagrange weights and one polynomial per candidate secret |
| Bytes | Split a short UTF-8 phrase in GF(2⁸) and recover with k shares | XOR, eight shift/reduce steps, and a display-only log/exp table |
| Pitfalls | Compare tampering, x=0, and too few shares | The differences among no check, CRC-32, and an embedded fingerprint |

The default GF(13) example is `p=13, k=3, n=5, f(x)=5+4x+2x²`. Its shares are `(1,11), (2,8), (3,9), (4,1), (5,10)`. For {1,2,3}, the reconstruction weights are `(3,10,1)`, the weighted terms are `(7,2,9)`, and the secret is `5`. Two shares leave 13 candidates. Forcing the highest coefficient to be nonzero removes the candidate `S=1`.

Coefficients are allowed to be zero, so the polynomial has degree *at most* k−1. With `k=1`, every share is simply the secret: copying instead of splitting.

## 📖 How to use it

1. In “Trace by hand”, vary `p, k, n, S, a₁…` and read the distribution and reconstruction tables. Enter coefficients or draw them with cryptographic randomness.
2. Select `k−1 shares`. Advance one candidate at a time or overlay all of them. Toggle the red nonzero-leading-coefficient switch to see a candidate vanish.
3. Drag a grid point, or select it and tap another cell in the same column. Clicking a point focuses it, and up and down arrow keys move it one cell. With k shares, the table and `ΔS=λᵢ·Δ (mod p)` update together. With fewer than k−1 shares, the curve is not unique; faint points show one example from the current polynomial.
4. Drag points on the real-number curve to change its y-intercept. With k−1 points, you can move the intercept and still pass through them. Ordinary integers and real numbers leak remainders; compare with the finite-field grid.
5. In “Bytes”, enter up to 32 UTF-8 bytes. Split with `2≤k≤n≤8`, select k shares, and recover. Hex is always shown; text appears only for valid UTF-8, with controls escaped.
6. In “Pitfalls”, switch the checking layer. All three cards use fixed `MEET AT DAWN` data rather than your input.

## 🔬 Method and limits

In GF(p), `λᵢ = Πⱼ≠ᵢ xⱼ/(xⱼ−xᵢ)` and `S = Σᵢ λᵢyᵢ`. GF(2⁸) uses the same interpolation with XOR for addition and subtraction. Its irreducible polynomial is `x⁸+x⁴+x³+x+1`; `0x11B` is the code notation. The display-only log/exp table uses generator `{03}`, as in the SLIP-39 reference implementation. The bundled tests check that `{03}` has order 255 and `{02}` has order 51.

Actual splitting and reconstruction use eight shifts and masks, without table lookups. [CVE-2023-25000](https://osv.dev/vulnerability/GO-2023-1709) is an example where table lookup timing mattered. JavaScript execution does not guarantee constant time. This browser implementation is for teaching, not operational secret sharing.

CRC-32 detects transcription errors, but a participant who changes a share can recompute its CRC. A four-byte prefix of SHA-256 included in the shared secret detects an incorrect reconstruction with high probability, but cannot identify the bad share. Without knowing the original secret, a cheater can choose an offset but cannot target an arbitrary replacement phrase. The model can show `DAWN→DUSK` because the original phrase is visible to the audience.

Each theory section in the interface separates primary and secondary sources. Shamir’s paper appeared in *Communications of the ACM* 22(11), 612–613 (1979), [DOI:10.1145/359168.359176](https://doi.org/10.1145/359168.359176). For Lagrange interpolation, see [HAC 12.71](https://cacr.uwaterloo.ca/hac/about/chap12.pdf) and IPUSIRON’s Japanese-language book 『暗号技術のすべて』, p.654. Tompa and Woll’s full text was not checked; bibliographies disagree between 1988 1(2) and 1989 1(3).

## 🔄 Day070 and prior work

| Aspect | [Day070 VisualCryptography CipherLab](https://github.com/ipusiron/visual-cryptography-cipherlab) | Day123 ShamirSharing CipherLab |
|---|---|---|
| Scheme | Naor–Shamir visual cryptography (1994) | Shamir threshold sharing (1979) |
| Secret | Black-and-white image pixels | Numbers in GF(p) and bytes in GF(2⁸) |
| Reconstruction | Overlay two images and look | Compute Lagrange interpolation |
| Thresholds shown | (2,2) hands-on | Vary (k,n) and draw k−1 candidates |
| Share size | Pixels expand and contrast falls when overlaid | Same size as the secret (ideal) |

| Aspect | Prior examples within the research scope | Added experience here |
|---|---|---|
| Visualization | Videos, slides, and a Wolfram graph | Overlay candidates on a grid and move points |
| Manual arithmetic | codex32’s GF(32) paper tool | Trace small GF(p) interpolation, then move to GF(2⁸) |
| Pitfalls | Many implementations reject or check invalid inputs | Place unsafe models beside guarded functions |

The prior-work survey was not exhaustive. Day070 shares images; Day123 shares numbers and bytes using a different scheme.

## 🎯 Use cases

Ways of using this tool in particular:

- Mathematics class: students fix `(1,11)` and `(2,8)` and overlay 13 candidates. They can see why no candidate gets priority.
- Introduction to finite fields: compare integer values `21,35` of `f(x)=5+4x+2x²` with GF(13) values `8,9`. Students see when remainders disclose the secret.
- Code review exercise: a reviewer toggles the nonzero-leading-coefficient rule, watches `S=1` disappear, and checks the coefficient generation policy.
- Puzzle or CTF design: an author makes a puzzle with public sample values; participants compute secret `5` from `λ=(3,10,1)`. No real credentials are used.
- Programming lesson: passing two shares to the unsafe function returns wrong bytes beginning `2DB1…`. Students can design threshold and UTF-8 checks.

It also works as a companion to p.654 of 『暗号技術のすべて』 (Japanese-language book), a comparison with Day070’s visual cryptography, an entry to fingerprinting through [Day118 SHA-256 Byte Inspector](https://github.com/ipusiron/sha256-byte-inspector), and a bridge to information-theoretic secrecy in [Day029 OTP Animation](https://github.com/ipusiron/otp-animation).

## 🔒 Inputs and implementation cautions

- Storage: Only language and theme are saved. Phrases and coefficients never go into localStorage or the URL.
- Network: Application computation makes no external request, and CSP sets `connect-src 'none'`.
- Input: At most 32 UTF-8 bytes; GF(p) values range from 0 to p−1. IME composition does not trigger recomputation.
- Recovery: The guarded interpolation rejects x=0, duplicate x, fewer than k shares, and inconsistent lengths. Unsafe models live in a separate file.
- Limit: This teaching tool does not prove that shares from different split runs belong together or identify a dishonest participant.

## 🧪 Tests

Run `npm test` with Node.js 22 or later. No package installation is required. GitHub Actions runs the suite on push and pull request. With Python Playwright available, `python test/interface.browser.py` checks `file://` behavior in Chromium and Firefox at 320, 390, and 1280 pixels.

| Area | Main checks |
|---|---|
| A GF(2⁸) | All 65,536 multiplication pairs, two FIPS 197 examples, 255 inverses, generator orders |
| B GF(p) | Five default shares, three λ sets, 13 candidates, removed `S=1`, integer values, `λᵢ·Δ`, k=1 |
| C Split and combine | Known shares from fixed test randomness, all ten 3-of-5 subsets, random round trips |
| D Pitfalls | Tampering, CRC, fingerprint, x=0, too few shares, every fixed vector field |
| E Static and UI | CSP, storage keys, forbidden APIs, bilingual dictionary, SHA-256 copy, viewport and interactions |

Expected values come from `test/vectors.json`. Its test-only random byte number i is `(37·i+11) mod 256`. The interface uses `crypto.getRandomValues` for splitting.

## 📁 Directory structure

The text after `#` explains each file. The local `.work/` directory is excluded from Git.

```text
|-- .github/workflows/test.yml # Node 22 CI
|-- LICENSE # MIT license
|-- README.md # Japanese documentation and hub YAML
|-- README.en.md # English documentation
|-- package.json # Test command
|-- index.html # Three-tab interface and CSP
|-- style.css # Graph-paper colors and layout
|-- messages.js # Japanese and English dictionary
|-- app.js # DOM, finite-field grid, real-number graph
|-- gf-core.js # Pure field and interpolation functions
|-- pitfalls.js # Deliberately unsafe models and checks
|-- sha256-core.js # SHA-256 copy from Day118
|-- test/core.test.js # Known-value and arithmetic tests
|-- test/structure.test.js # CSP and dictionary static tests
|-- test/readme.test.js # Bilingual README and file list tests
|-- test/interface.browser.py # file:// and UI browser tests
|-- test/vectors.json # Expected values copied from the reference
|-- assets/ja/light/hand.png # Japanese light hand calculation
|-- assets/ja/light/bytes.png # Japanese light byte table
|-- assets/ja/light/pitfalls.png # Japanese light pitfall cards
|-- assets/ja/light/candidates.png # Japanese light candidates
|-- assets/ja/dark/hand.png # Japanese dark hand calculation
|-- assets/ja/dark/bytes.png # Japanese dark byte table
|-- assets/ja/dark/pitfalls.png # Japanese dark pitfall cards
|-- assets/ja/dark/candidates.png # Japanese dark candidates
|-- assets/en/light/hand.png # English light hand calculation
|-- assets/en/light/bytes.png # English light byte table
|-- assets/en/light/pitfalls.png # English light pitfall cards
|-- assets/en/light/candidates.png # English light candidates
|-- assets/en/dark/hand.png # English dark hand calculation
|-- assets/en/dark/bytes.png # English dark byte table
|-- assets/en/dark/pitfalls.png # English dark pitfall cards
|-- assets/en/dark/candidates.png # English dark candidates
```

## 💻 Requirements

The interface was checked in recent Chromium and Firefox. It works under `file://`. Screenshots and browser tests used Python Playwright. The application itself uses no external library, WebAssembly, or external font.

## 📄 License

MIT License. `sha256-core.js` was copied byte for byte, including its MIT notice, from the same author’s Day118 tool.

---

## 🛠️ About this tool

This tool was created as part of the “200 Security Tools with Generative AI” project. The project makes and publishes security-related learning tools with help from AI.

🔗 [About the project](https://akademeia.info/?page_id=44607)
