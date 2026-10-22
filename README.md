<!--
---
id: day123
slug: shamir-sharing-cipherlab
title: "ShamirSharing CipherLab"
subtitle_ja: "方眼とバイトで追うシャミアの秘密分散"
subtitle_en: "Shamir secret sharing on grids and bytes"
description_ja: "GF(p)の方眼、GF(2⁸)のバイト、実装の落とし穴で(k,n)しきい値法を学ぶ教材。"
description_en: "Explore (k,n) Shamir secret sharing with a finite-field grid, bytes, and implementation pitfalls."
category_ja:
  - 現代暗号
  - 情報理論
category_en:
  - Modern Cryptography
  - Information Theory
difficulty: 3
tags:
  - shamir
  - secret-sharing
  - finite-field
  - lagrange-interpolation
repo_url: "https://github.com/ipusiron/shamir-sharing-cipherlab"
demo_url: "https://ipusiron.github.io/shamir-sharing-cipherlab/"
hub: true
---
-->

# ShamirSharing CipherLab - 方眼とバイトで追うシャミアの秘密分散

[English](README.en.md)

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/shamir-sharing-cipherlab?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/shamir-sharing-cipherlab?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/shamir-sharing-cipherlab)
![GitHub license](https://img.shields.io/github/license/ipusiron/shamir-sharing-cipherlab)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/shamir-sharing-cipherlab/)

**Day123 - 生成AIで作るセキュリティツール200**

ShamirSharing CipherLabは、シャミアの秘密分散を方眼・バイト表・落とし穴の模型で手を動かして学ぶ教材です。k枚そろえば1本の多項式が決まり、秘密が戻ります。k−1枚では、どの秘密にも多項式が1本ずつ通るため、秘密について何もわかりません。

学習用です。本物の秘密（パスワード・シード・鍵）は入れないでください。共有の書式、印刷、QR、保管の方法は扱いません。

---

## 🌐 デモページ

👉 **[ShamirSharing CipherLabを開く](https://ipusiron.github.io/shamir-sharing-cipherlab/)**

通常のブラウザーで開けます。HTMLファイルを`file://`で直接開いても動作します。計算と入力はブラウザー内で完結し、外部には送信しません。

---

## 📸 スクリーンショット

| 状態 | ライト | ダーク |
|---|---|---|
| 手で追う | ![手で追う・日本語・ライト](assets/ja/light/hand.png) | ![手で追う・日本語・ダーク](assets/ja/dark/hand.png) |
| k−1枚の候補 | ![候補の方眼・日本語・ライト](assets/ja/light/candidates.png) | ![候補の方眼・日本語・ダーク](assets/ja/dark/candidates.png) |
| バイトで見る | ![バイト表・日本語・ライト](assets/ja/light/bytes.png) | ![バイト表・日本語・ダーク](assets/ja/dark/bytes.png) |
| 確かめる | ![落とし穴・日本語・ライト](assets/ja/light/pitfalls.png) | ![落とし穴・日本語・ダーク](assets/ja/dark/pitfalls.png) |

英語の同じ4状態は[English README](README.en.md)に掲載しています。

## ✨ できること

| 段階 | 操作 | 見えること |
|---|---|---|
| 手で追う | GF(p)で配る・k枚で戻す・k−1枚の候補を重ねる | ラグランジュ係数と、候補ごとに1本の多項式 |
| バイトで見る | UTF-8の短い文をGF(2⁸)で分け、k枚から戻す | XOR、8回のシフトと還元、表示専用のlog/exp表 |
| 確かめる | 改ざん・x=0・足りない枚数の模型を比べる | 検査なし、CRC-32、秘密中の指紋の違い |

既定のGF(13)の例は`p=13, k=3, n=5, f(x)=5+4x+2x²`です。共有は`(1,11), (2,8), (3,9), (4,1), (5,10)`で、{1,2,3}の復元係数は`(3,10,1)`、寄与は`(7,2,9)`、秘密は`5`です。2枚だけなら13個の候補が残ります。最高次の係数を0以外に限ると、候補`S=1`が消える様子も見られます。

係数は0も許します。そのため多項式は「次数k−1以下」と書きます。`k=1`を選ぶと全員の共有が秘密そのものになり、「分けていない（ただのコピー）」ことがわかります。

## 📖 使い方

1. 「手で追う」で`p, k, n, S, a₁…`を変え、配る表と戻す表を読みます。係数は手で入れるか、暗号学的乱数から選べます。
2. `k−1枚を選ぶ`を押し、候補を1本ずつ送るか全部重ねます。朱の「最高次の係数を0以外に限る」を切り替えると、消える候補を確認できます。
3. 方眼の点をドラッグするか、点を選んで同じ列のマスをタップします。点にフォーカスして上下矢印でも1マス動かせます。k枚のときは`ΔS=λᵢ·Δ (mod p)`が表とともに更新されます。
4. 実数の曲線では共有点をドラッグしてy切片を動かします。k−1点ならy切片を動かしても同じ点を通れます。ただし整数や実数のままでは余りが漏れるため、有限体の方眼と比べてください。
5. 「バイトで見る」でUTF-8の文を32バイト以内で入力します。`2≤k≤n≤8`で分け、共有をk枚選んで戻します。16進は常に表示し、正しいUTF-8だけ文字として示します。制御文字はエスケープします。
6. 「確かめる」で検査の層を切り替えます。3つのカードは固定データ`MEET AT DAWN`の模型で、入力した文は使いません。

## 🔬 仕組みと限界

GF(p)では`λᵢ = Πⱼ≠ᵢ xⱼ/(xⱼ−xᵢ)`、`S = Σᵢ λᵢyᵢ`です。GF(2⁸)でも同じ補間を行いますが、足し引きはXORです。掛け算の既約多項式は`x⁸+x⁴+x³+x+1`で、`0x11B`はコード上の表記です。表示するlog/exp表の生成元`{03}`はSLIP-39の参照実装で使われ、{03}の位数255と{02}の位数51は付属テストでも検算します。

実データの分割・復元には、表引きをしない8回のシフトとマスクによる掛け算を使います。[CVE-2023-25000](https://osv.dev/vulnerability/GO-2023-1709)は表引きのタイミングが問題になった実例です。ただしJavaScriptの実行環境で定数時間は保証できません。教育用のブラウザー実装であり、実運用の秘密分散器ではありません。

CRC-32は書き写しの誤りを見つけられますが、書き換えた人がCRCを再計算すれば通ります。秘密に付けたSHA-256の先頭4バイトは、戻った値の不一致を高い確率で見つけますが、悪い共有の持ち主を特定しません。改ざん者は元の秘密を知らないため、任意の文を狙って復元させることはできず、ずらす量だけを決められます。この模型で`DAWN→DUSK`を見せられるのは、観客に元の秘密が見えているためです。

座学の出典は画面の各節に一次資料・二次資料を分けて示しました。Shamirの原論文は *Communications of the ACM* 22(11), 612–613 (1979), [DOI:10.1145/359168.359176](https://doi.org/10.1145/359168.359176)です。ラグランジュ補間は[HAC 12.71](https://cacr.uwaterloo.ca/hac/about/chap12.pdf)と、IPUSIRON『暗号技術のすべて』P654をあわせて参照できます。Tompa & Wollの本文は未確認で、書誌の年・号は資料間で1988年1(2)と1989年1(3)に割れています。

## 🔄 Day070と先行例との関係

| 観点 | [Day070 VisualCryptography CipherLab](https://github.com/ipusiron/visual-cryptography-cipherlab) | Day123 ShamirSharing CipherLab |
|---|---|---|
| 方式 | Naor・Shamirの視覚暗号（1994） | Shamirのしきい値法（1979） |
| 秘密 | 白黒画像の画素 | GF(p)の数、GF(2⁸)のバイト |
| 戻し方 | 2枚を重ねて目で見る | ラグランジュ補間で計算する |
| 扱うしきい値 | (2,2)を体験 | (k,n)を変え、k−1枚の候補を描く |
| 共有の大きさ | 画素が広がり、重ねるとコントラストが落ちる | 秘密と同じ大きさ（理想的） |

| 観点 | 調べた範囲の先行例 | この教材で追加する体験 |
|---|---|---|
| 可視化 | 動画・スライド・Wolframの図 | 方眼に候補を重ね、点を動かす |
| 手計算 | codex32のGF(32)用の紙の道具 | 小さなGF(p)で補間表を追い、GF(2⁸)へ移る |
| 落とし穴 | 多くの実装は拒否や検査を行う | わざと無防備な模型と守る実装を並べる |

先行例の調査は網羅的ではありません。Day070は画像、Day123は数とバイトで、別の方式を体験します。

## 🎯 ユースケース

このツールならではの使い方：

- 数学の授業：学習者が(1,11)(2,8)を固定し、13本の候補を重ねる。候補が1本も優先されない理由を目で追える。
- 有限体の入門：`f(x)=5+4x+2x²`の整数値`21,35`とGF(13)の値`8,9`を並べる。余りから秘密が漏れる場合と漏れない場合を比較できる。
- 実装レビューの演習：レビュー担当が最高次係数の非ゼロ切り替えで`S=1`の候補が消えるのを見て、係数生成の仕様を点検する。
- 謎解き・CTFの題材：作者が公開値だけの問題を作り、参加者が`λ=(3,10,1)`から秘密`5`を計算する。本物の認証情報は使わない。
- プログラミングの授業：2枚を素の実装へ渡すと`2DB1…`の誤ったバイトが出る例から、しきい値とUTF-8の検査を設計する。

ほかに、『暗号技術のすべて』P654の副読、Day070の視覚暗号との比較、[Day118 SHA-256 Byte Inspector](https://github.com/ipusiron/sha256-byte-inspector)で指紋の仕組みの学習、[Day029 OTP Animation](https://github.com/ipusiron/otp-animation)と情報理論的安全性を比べる教材にも使えます。

## 🔒 入力と実装上の注意

- 保存：言語と明暗のみ。入力した文や係数をlocalStorageやURLに置かない。
- 通信：アプリの計算は外部通信を行わず、`connect-src 'none'`のCSPを設定。
- 入力：UTF-8で32バイト、GF(p)の値は0以上p未満。IMEの変換中は再計算しない。
- 復元：本物の補間関数はx=0、重複x、k未満、長さ不一致を拒否。無防備な模型は別ファイルに分離。
- 限界：異なる分割から混ぜた共有の正しさや、誰が改ざんしたかはこの教材だけでは証明しない。

## 🧪 テスト

Node.js 22以上で`npm test`を実行します。依存パッケージは不要です。GitHub Actionsでもpushとpull requestの両方で実行します。`python test/interface.browser.py`はPython Playwrightがある環境でChromium・Firefoxを使い、`file://`の操作と320/390/1280pxを検査します。

| 範囲 | 主な検査 |
|---|---|
| A GF(2⁸) | 65,536組の掛け算一致、FIPS 197の2例、逆元255個、生成元の位数 |
| B GF(p) | 既定の5共有、3組のλ、13候補、消える`S=1`、整数値、`λᵢ·Δ`、k=1 |
| C 分割と補間 | 固定乱数の既知共有、10組すべての3-of-5復元、ランダム往復 |
| D 落とし穴 | 改ざん・CRC・指紋、x=0、k不足、固定ベクターの全項目 |
| E 静的・UI | CSP、保存項目、禁止API、日英辞書、SHA-256の原本一致、画面幅と操作 |

期待値は`test/vectors.json`を読み込みます。固定乱数はi番目のバイトが`(37·i+11) mod 256`です。これはテスト専用で、画面の分割には`crypto.getRandomValues`を使います。

## 📁 ディレクトリー構造

各行の`#`以降は役割です。作業用の`.work/`はGitに含めません。

```text
|-- .github/workflows/test.yml # Node 22のCI
|-- LICENSE # MITライセンス
|-- README.md # 日本語の説明とハブ用YAML
|-- README.en.md # 英語の説明
|-- package.json # テストコマンド
|-- index.html # 3タブの画面とCSP
|-- style.css # 方眼ノートの配色とレイアウト
|-- messages.js # 日英の辞書
|-- app.js # DOM、方眼、実数グラフ
|-- gf-core.js # 有限体と補間の純関数
|-- pitfalls.js # 無防備な実装の模型と検査
|-- sha256-core.js # Day118由来の指紋用SHA-256
|-- test/core.test.js # 既知値と計算のテスト
|-- test/structure.test.js # CSPと辞書などの静的テスト
|-- test/readme.test.js # 日英READMEとファイル一覧のテスト
|-- test/interface.browser.py # file://と画面操作のブラウザーテスト
|-- test/vectors.json # 参照実装から写した期待値
|-- assets/ja/light/hand.png # 日本語・ライトの手計算
|-- assets/ja/light/bytes.png # 日本語・ライトのバイト表
|-- assets/ja/light/pitfalls.png # 日本語・ライトの落とし穴
|-- assets/ja/light/candidates.png # 日本語・ライトの候補
|-- assets/ja/dark/hand.png # 日本語・ダークの手計算
|-- assets/ja/dark/bytes.png # 日本語・ダークのバイト表
|-- assets/ja/dark/pitfalls.png # 日本語・ダークの落とし穴
|-- assets/ja/dark/candidates.png # 日本語・ダークの候補
|-- assets/en/light/hand.png # 英語・ライトの手計算
|-- assets/en/light/bytes.png # 英語・ライトのバイト表
|-- assets/en/light/pitfalls.png # 英語・ライトの落とし穴
|-- assets/en/light/candidates.png # 英語・ライトの候補
|-- assets/en/dark/hand.png # 英語・ダークの手計算
|-- assets/en/dark/bytes.png # 英語・ダークのバイト表
|-- assets/en/dark/pitfalls.png # 英語・ダークの落とし穴
|-- assets/en/dark/candidates.png # 英語・ダークの候補
```

## 💻 動作環境

最近のChromium・Firefoxで確認しています。`file://`でも動作します。スクリーンショットとブラウザーテストにはPython Playwrightを使いました。アプリ本体は外部ライブラリー、WebAssembly、外部フォントを使いません。

## 📄 ライセンス

MIT Licenseです。`sha256-core.js`は同じ作者のDay118から、先頭のMIT表示を含めて同じバイト列で取り込みました。

---

## 🛠️ このツールについて

本ツールは、「生成AIで作るセキュリティツール200」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを制作・公開しています。

🔗 [プロジェクトの案内](https://akademeia.info/?page_id=44607)
