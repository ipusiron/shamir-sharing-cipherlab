"""Local file:// browser checks. Run: python test/interface.browser.py"""
from pathlib import Path
import re

from playwright.sync_api import sync_playwright


URL = (Path(__file__).resolve().parents[1] / "index.html").as_uri()


def geometry(page, width):
    measured = page.evaluate("""() => ({
      page: document.documentElement.scrollWidth,
      viewport: innerWidth,
      graph: document.querySelector('.hand-graph-frame').scrollWidth,
      graphFrame: document.querySelector('.hand-graph-frame').clientWidth,
      byteTable: document.querySelector('#byte-table-frame').scrollWidth,
      byteFrame: document.querySelector('#byte-table-frame').clientWidth
    })""")
    assert measured["page"] <= measured["viewport"], measured
    assert measured["viewport"] == width, measured
    assert measured["graphFrame"] <= measured["viewport"], measured
    assert measured["byteFrame"] <= measured["viewport"], measured
    assert measured["graph"] >= measured["graphFrame"], measured
    assert measured["byteTable"] >= measured["byteFrame"], measured
    return measured


def first_y(page):
    return page.locator("#distribution-table tr").first.locator("td").last.inner_text()


def test_linear_intro(page, width):
    assert page.locator("#panel-linear").is_visible()
    assert not page.locator("#panel-hand").is_visible()
    assert page.locator("#tab-linear").get_attribute("aria-selected") == "true"
    assert page.locator("#panel-linear [data-i18n='linearDistributionTitle']").inner_text().startswith("分散段階")
    assert page.locator("#panel-linear [data-i18n='linearRecoveryTitle']").inner_text().startswith("復元段階")
    assert page.locator("#panel-linear [data-i18n='linearRecoveryTitle']").bounding_box()["y"] < page.locator("#panel-linear [data-i18n='linearGridTitle']").bounding_box()["y"]
    primer = page.locator(".field-primer")
    assert primer.is_visible()
    formula = page.locator("#panel-linear .linear-formula")
    assert primer.bounding_box()["y"] < formula.bounding_box()["y"]
    assert "p=13 に固定し、GF(p) の世界で f(x) を考えます" in formula.inner_text()
    assert formula.locator("strong").inner_text() == "f(x) = s + a₁x (mod 13)"
    assert "0〜12 の13個の数" in primer.inner_text()
    assert "9 + 7 = 16。13で割った余りは3" in primer.inner_text()
    assert "5 × 4 = 20。13で割った余りは7" in primer.inner_text()
    assert "2×7 = 14 ≡ 1" in primer.inner_text()
    assert "2×□ ≡ 1 (mod 12)" in primer.inner_text()
    assert "既定値は n=5、s=5、a₁=4" in primer.inner_text()
    assert "f(i)=(5+4i) mod 13 を i=1〜5 に代入" in primer.inner_text()
    assert "(1,9)(2,0)(3,4)(4,8)(5,12)" in primer.inner_text()
    assert "f(2)=s+2a₁" in primer.inner_text()
    assert "整数の世界で f(x)=5+4x を考え" in primer.inner_text()
    assert "2a₁ は必ず偶数" in primer.inner_text()
    assert page.locator("[data-i18n='gf13FieldContrast']").inner_text().startswith("それに対して")
    assert "0〜12の整数値として扱い" in primer.inner_text()
    assert "f(2)=5+2×4=13" in primer.inner_text()
    assert "このシェア値0だけでは秘密情報 s の偶奇は決まりません" in primer.inner_text()
    assert formula.locator("br").count() == 0
    assert "1個のシェアが得られる確率はどの秘密情報 s に対しても同じ" in primer.inner_text()
    assert "GF(2⁸)" not in primer.inner_text()
    assert primer.evaluate("el => el.scrollWidth <= el.clientWidth")
    assert page.locator("#linear-dealer").get_attribute("open") is None
    assert page.locator("#linear-threshold").inner_text() == "5人のうち2人が揃ってシェアを出せば秘密情報sを復元できることになります。"
    assert "13本" in page.locator("#linear-one-result").inner_text()
    assert page.locator("[data-i18n='linearGridTitle']").inner_text() == "① シェアが1つだけの場合：1点を通る直線を考える"
    assert "直線が何本も引ける" in page.locator("[data-i18n='linearGridIntro']").inner_text()
    assert "(3,4)" in page.locator("#linear-one-selected").inner_text()
    assert page.locator("[data-i18n='linearGridTitle']").bounding_box()["y"] < page.locator("[data-i18n='linearTwoTitle']").bounding_box()["y"]
    assert "(1,9)" in page.locator("#linear-two-selected").inner_text()
    assert "(3,4)" in page.locator("#linear-two-selected").inner_text()
    assert "s=5" in page.locator("#linear-two-result").inner_text()
    graph = page.locator("#linear-two-graph")
    assert graph.get_attribute("viewBox") == "0 0 320 292"
    assert graph.locator(".linear-two-share").count() == 2
    assert graph.locator(".linear-two-share").evaluate_all("els => els.map(el => [el.getAttribute('cx'), el.getAttribute('cy')])") == [["108", "180"], ["72", "90"]]
    assert graph.locator(".linear-two-secret").count() == 1
    assert graph.locator(".linear-two-branch").count() > 1
    assert graph.locator(".linear-two-secret").get_attribute("cx") == "54"
    assert graph.locator(".linear-two-secret").get_attribute("cy") == "162"
    assert "離れて見える線も同じ式" in page.locator("#linear-two-graph-caption").inner_text()
    lines = page.locator("#linear-analogy .linear-analogy-line")
    assert lines.count() == 4
    assert page.locator("#linear-analogy").get_attribute("viewBox") == "0 0 320 292"
    assert "x=12" in page.locator("#linear-analogy").text_content()
    assert "普通の座標平面" in page.locator("#linear-analogy-caption").inner_text()
    assert "y軸との交点は x=0 での値 f(0)" in page.locator("#linear-analogy-caption").inner_text()
    distinct = page.locator("#linear-distinct")
    assert "f₀(x)=0+10x と f₅(x)=5+4x" in distinct.inner_text()
    assert "f₀(0)=0、f₅(0)=5" in distinct.inner_text()
    assert "余りの見かけではありません" in distinct.inner_text()
    assert "GF(13) での x=0,1,2 の値は 0,10,7" in page.locator("#linear-candidate-result").inner_text()
    assert "GF(13) の係数 a₁ をそのまま傾きにした線ではありません" in page.locator("#linear-candidate-result").inner_text()
    assert page.locator("#linear-one-picks button").count() == 5
    assert page.locator("#linear-two-picks button").count() == 5
    assert page.locator("#linear-one-picks [aria-pressed='true']").count() == 1
    assert page.locator("#linear-two-picks [aria-pressed='true']").count() == 2
    pair_meaning = page.locator("#panel-linear [data-i18n='linearPairMeaning']")
    assert "(1,9) は、管理人番号1（＝#1）とシェア9のセット" in pair_meaning.inner_text()
    assert pair_meaning.bounding_box()["y"] < page.locator("#linear-one-picks").bounding_box()["y"]
    assert page.locator("#linear-analogy").bounding_box()["width"] <= width
    assert graph.bounding_box()["width"] <= width
    assert page.locator("#linear-grid").count() == 0
    assert page.locator("#linear-to-hand").count() == 0
    page.locator("#linear-candidate").select_option("5")
    assert "a₁=(4−5)÷3≡4" in page.locator("#linear-candidate-result").inner_text()
    assert "(mod 13)" in page.locator("#linear-candidate-result").inner_text()
    page.locator('#linear-one-picks [data-linear-pick="2"]').click()
    assert page.locator("#linear-one-picks [aria-pressed='true']").count() == 1
    assert page.locator('#linear-one-picks [data-linear-pick="2"]').evaluate("el => el === document.activeElement")
    assert "(2,0)" in page.locator("#linear-one-selected").inner_text()
    assert "(1,9)" in page.locator("#linear-two-selected").inner_text()
    assert "(2,0)" in page.locator("#linear-two-selected").inner_text()
    assert "s=5" in page.locator("#linear-two-result").inner_text()
    page.locator('#linear-two-picks [data-linear-pick="3"]').click()
    assert "s=5" in page.locator("#linear-two-result").inner_text()
    assert page.locator("#linear-two-picks [aria-pressed='true']").count() == 2
    assert page.locator('#linear-two-picks [data-linear-pick="3"]').evaluate("el => el === document.activeElement")
    assert page.locator("[data-i18n='linearTwoTitle']").inner_text() == "② シェアが2つ揃った場合：2点から直線が決まる"
    assert "(2,n) しきい値法" in page.locator("[data-i18n='linearTwoIntro']").inner_text()
    assert page.locator("#linear-analogy").is_visible()
    page.locator('#linear-two-picks [data-linear-pick="3"]').click()
    assert "13本" in page.locator("#linear-one-result").inner_text()
    assert "もう1人" in page.locator("#linear-two-result").inner_text()
    assert graph.locator(".linear-two-branch").count() == 0
    assert graph.locator(".linear-two-share").count() == 1
    assert graph.locator(".linear-analogy-line").count() == 3
    assert all(f"s={candidate}" in graph.text_content() for candidate in (0, 5, 12))
    assert graph.locator(".linear-two-secret").count() == 0
    assert page.locator("#linear-two-graph-title").inner_text() == "1点を通る直線を図で見る"
    assert "点 (2,0) を通る秘密候補" in page.locator("#linear-two-graph-caption").inner_text()
    assert graph.get_attribute("aria-label") == "選んだ1点を通る秘密候補の直線3本"
    page.locator('#linear-two-picks [data-linear-pick="1"]').click()
    assert "s=5" in page.locator("#linear-two-result").inner_text()
    assert graph.locator(".linear-analogy-line").count() == 0
    assert graph.locator(".linear-two-branch").count() > 0
    assert page.locator("#linear-two-graph-title").inner_text() == "2点から決まる式を図で見る"
    page.locator('#linear-two-picks [data-linear-pick="4"]').click()
    assert "(2,0)" in page.locator("#linear-two-selected").inner_text()
    assert "(4,8)" in page.locator("#linear-two-selected").inner_text()
    assert page.locator("#linear-two-picks [aria-pressed='true']").count() == 2
    page.locator('#linear-two-picks [data-linear-pick="2"]').click()
    assert "もう1人" in page.locator("#linear-two-result").inner_text()
    page.locator('#linear-two-picks [data-linear-pick="5"]').click()
    assert "s=5" in page.locator("#linear-two-result").inner_text()
    page.locator('#linear-one-picks [data-linear-pick="3"]').click()
    assert "(3,4)" in page.locator("#linear-one-selected").inner_text()
    assert page.locator("#linear-two-picks [aria-pressed='true']").count() == 2
    assert "(3,4)" in page.locator("#linear-two-selected").inner_text()
    assert "(1,9)" in page.locator("#linear-two-selected").inner_text()
    assert "点 (3,4)" in page.locator("#linear-analogy-caption").inner_text()
    assert page.locator("#linear-analogy .linear-analogy-line").evaluate_all("(els) => els.every(el => Number(el.getAttribute('x2')) > Number(document.querySelector('.linear-analogy-point').getAttribute('cx')))")
    assert page.locator(".linear-analogy-point-label").evaluate("""el => {
      const box=el.getBBox();
      return [...document.querySelectorAll('#linear-analogy .linear-analogy-line')].every(line => {
        const x1=Number(line.getAttribute('x1')), x2=Number(line.getAttribute('x2'));
        const y1=Number(line.getAttribute('y1')), y2=Number(line.getAttribute('y2'));
        const left=Math.max(box.x-3,x1), right=Math.min(box.x+box.width+3,x2);
        if(left>right)return true;
        const at=x=>y1+(x-x1)*(y2-y1)/(x2-x1);
        return Math.min(at(left),at(right))>box.y+box.height+3 || Math.max(at(left),at(right))<box.y-3;
      });
    }""")
    page.locator('#linear-one-picks [data-linear-pick="1"]').click()
    assert "(1,9)" in page.locator("#linear-two-selected").inner_text()
    assert "(2,0)" in page.locator("#linear-two-selected").inner_text()
    page.locator("#linear-dealer summary").click()
    assert page.locator("#linear-dealer [data-i18n='linearDealerSet']").inner_text() == "秘密情報sと乱数a₁を決めます。"
    assert "本ツールでは仕組みを試すために値を変えられます。" in page.locator("#linear-dealer [data-i18n='linearDealerHelp']").inner_text()
    rows = page.locator("#linear-distribution p")
    assert rows.count() == 5
    assert "v₁=f(1)=(5+4×1) mod 13=9" in rows.first.inner_text()
    assert "管理人 #1 にシェア 9 を渡します" in rows.first.inner_text()
    assert "v₅=f(5)=(5+4×5) mod 13=12" in rows.last.inner_text()
    page.locator("#linear-secret").fill("7")
    page.locator("#linear-secret").press("Tab")
    page.locator("#linear-slope").fill("2")
    page.locator("#linear-slope").press("Tab")
    assert "v₁=f(1)=(7+2×1) mod 13=9" in rows.first.inner_text()
    assert "(3,0)" in page.locator("#linear-one-selected").inner_text()
    assert "s=7" in page.locator("#linear-two-result").inner_text()
    assert graph.locator(".linear-two-secret").get_attribute("cy") == "126"
    page.locator("#linear-n").select_option("7")
    assert page.locator("#linear-one-picks button").count() == 7
    assert page.locator("#linear-two-picks button").count() == 7
    assert page.locator("#linear-threshold").inner_text().startswith("7人のうち2人")
    assert rows.count() == 7
    assert "v₇=f(7)=(7+2×7) mod 13=8" in rows.last.inner_text()
    page.locator("#linear-slope").fill("0")
    page.locator("#linear-slope").press("Tab")
    assert graph.locator(".linear-two-branch").count() == 1
    assert graph.locator(".linear-two-share").count() == 2
    assert graph.locator(".linear-two-branch").first.get_attribute("y1") == "126"
    assert graph.locator(".linear-two-branch").first.get_attribute("y2") == "126"
    page.locator("#linear-reset").click()
    assert page.locator("#linear-one-picks button").count() == 5
    assert page.locator("#linear-two-picks button").count() == 5
    assert "(3,4)" in page.locator("#linear-two-selected").inner_text()
    assert "(1,9)" in page.locator("#linear-two-selected").inner_text()
    assert rows.count() == 5
    page.locator("#language").click()
    assert page.locator("#tab-linear").inner_text() == "Visualize (2, n)"
    assert "(1,9) means custodian number 1 (#1) and share value 9" in pair_meaning.inner_text()
    assert page.locator("#panel-linear [data-i18n='linearDistributionTitle']").inner_text().startswith("Distribution")
    assert page.locator("#panel-linear [data-i18n='linearRecoveryTitle']").inner_text().startswith("Reconstruction")
    assert "What is GF(13)?" in primer.inner_text()
    assert "This tab defaults to n=5, s=5, and a₁=4" in primer.inner_text()
    assert "over the ordinary integers" in primer.inner_text()
    assert "consider f(x) over GF(p)" in formula.inner_text()
    assert "(1,9)(2,0)(3,4)(4,8)(5,12)" in primer.inner_text()
    assert "ordinary coordinate plane" in page.locator("#linear-analogy-caption").inner_text()
    assert "Each y-intercept is f(0)" in page.locator("#linear-analogy-caption").inner_text()
    assert "segments represent the same polynomial" in page.locator("#linear-two-graph-caption").inner_text()
    page.locator('#linear-two-picks [data-linear-pick="1"]').click()
    assert page.locator("#linear-two-graph-title").inner_text() == "See lines through one point"
    assert "all 13 secrets" in page.locator("#linear-two-graph-caption").inner_text()
    assert graph.locator(".linear-analogy-line").count() == 3
    assert "distinct polynomials" in distinct.inner_text()
    assert "2×7 = 14 ≡ 1" in primer.inner_text()
    assert "D computes v₁=f(1)=(5+4×1) mod 13=9" in rows.first.inner_text()
    assert page.locator("#linear-threshold").inner_text().startswith("When two of the 5 participants")
    assert "Thirteen polynomials of degree at most one" in page.locator("#linear-one-result").inner_text()
    page.locator("#language").click()
    page.locator("#tab-hand").click()
    assert page.locator("#panel-hand").is_visible()
    assert page.locator("#tab-hand").evaluate("el => document.activeElement === el")


def test_distributed_share_data(page):
    lines = page.locator("#share-data p")
    assert lines.count() == 5
    assert page.locator("#polynomial").inner_text() == "f(x) = 5 + 4x + 2x² (mod 13)"
    assert page.locator("[data-i18n='termValues']").inner_text() == "計算式"
    assert page.locator("#distribution-table tr").first.locator("td").nth(1).inner_text() == "f(1)=5+4×1+2×1²=5+4+2"
    assert page.locator("#distribution-table tr").nth(1).locator("td").nth(1).inner_text() == "f(2)=5+4×2+2×2²=5+8+8"
    assert page.locator("[data-i18n='sharePairsHeading']").inner_text() == "復元用の組（シェア番号, シェア値）"
    assert [line.inner_text() for line in lines.all()] == ["#1： (1,11)", "#2： (2,8)", "#3： (3,9)", "#4： (4,1)", "#5： (5,10)"]
    assert page.locator("#share-data").bounding_box()["y"] > page.locator("#distribution-table").bounding_box()["y"]
    page.locator("#share-count").select_option("7")
    assert lines.count() == 7
    assert lines.last.inner_text() == "#7： (7,1)"
    page.locator("[data-coefficient='1']").fill("6")
    page.locator("[data-coefficient='1']").dispatch_event("change")
    assert lines.first.inner_text() == "#1： (1,0)"
    page.locator("#prime").select_option("17")
    assert lines.first.inner_text() == "#1： (1,13)"
    page.locator("#threshold").select_option("1")
    assert lines.first.inner_text() == "#1： (1,5)"
    page.locator("#language").click()
    assert lines.first.inner_text() == "Share #1: (1,5)"
    page.locator("#language").click()
    page.locator("#reset-hand").click()


def test_help(page, width):
    assert page.locator(".eyebrow").count() == 0
    assert page.locator(".page-header > p").count() == 2
    assert page.locator(".subtitle").inner_text() == "Shamirが提案した(k, n)しきい値法の可視化ツールです。"
    assert "k−1個では秘密が決まらない" in page.locator(".tagline").inner_text()
    assert page.locator(".subtitle").bounding_box()["y"] < page.locator(".tagline").bounding_box()["y"]
    assert page.locator(".subtitle").evaluate("el => getComputedStyle(el).textAlign") == "center"
    assert page.locator(".tagline").evaluate("el => getComputedStyle(el).textAlign") == "center"
    tagline_box = page.locator(".tagline").bounding_box()
    assert abs(tagline_box["x"] + tagline_box["width"] / 2 - width / 2) < 1
    assert page.locator("main > details").count() == 0
    assert page.locator("main [data-i18n='educational']").count() == 0
    assert page.locator("footer").inner_text() == "GitHubリポジトリ"
    assert page.locator("footer a").get_attribute("href") == "https://github.com/ipusiron/shamir-sharing-cipherlab"
    assert page.locator("footer").evaluate("el => getComputedStyle(el).textAlign") == "center"
    page.locator("#help").click()
    dialog = page.locator("#help-dialog")
    assert dialog.is_visible()
    assert page.locator("#help-title").inner_text() == "ヘルプ"
    assert page.locator("#help-dialog ol.help-list li").count() == 5
    assert page.locator("#help-dialog ul.help-list li").count() == 6
    assert page.locator("#help-dialog [data-i18n='helpUses']").inner_text() == "活用例"
    assert "実際に使っているパスワード、シードフレーズ、鍵" in dialog.inner_text()
    assert "保存するのは表示言語と明暗の設定だけ" in dialog.inner_text()
    assert "実数で計算した曲線の違い" in dialog.inner_text()
    assert "CTF・謎解き" in dialog.inner_text()
    assert dialog.locator("[data-i18n='multiplication']").inner_text() == "GF(2⁸) の掛け算"
    assert "固定例{57}×{13}={FE}" in dialog.locator("[data-i18n='multiplyIntro']").inner_text()
    assert dialog.locator("#multiply-steps tbody tr").count() == 8
    assert "「バイトで見る」の復元計算には使っていません" in dialog.locator("#multiply-log").inner_text()
    theory = page.locator("#help-theory")
    assert theory.get_attribute("open") is None
    assert page.locator("#lessons .lesson-card").count() == 8
    help_body = page.locator(".help-body")
    assert help_body.evaluate("el => el.scrollHeight > el.clientHeight")
    assert help_body.evaluate("el => el.scrollWidth <= el.clientWidth")
    box = dialog.bounding_box()
    assert box["x"] >= 0 and box["x"] + box["width"] <= width
    theory.locator("summary").click()
    assert theory.get_attribute("open") is not None
    assert help_body.evaluate("el => el.scrollWidth <= el.clientWidth")
    assert page.locator("#lessons .source-links a").first.is_visible()
    assert page.locator("#lessons table").count() == 0
    assert "(3,10,1)" in page.locator("#lessons .lesson-card").nth(1).inner_text()
    assert page.locator("#lessons .lesson-card p:not(.source-links)").count() >= 24
    help_body.evaluate("el => el.scrollTop = el.scrollHeight")
    header_box = page.locator(".help-header").bounding_box()
    body_box = help_body.bounding_box()
    assert body_box["y"] >= header_box["y"] + header_box["height"] - 1
    assert page.locator("#help-title").is_visible()
    page.locator("#close-help").click()
    assert not dialog.is_visible()
    assert page.locator("#help").evaluate("el => document.activeElement === el")
    page.locator("#help").click()
    assert help_body.evaluate("el => el.scrollTop") == 0
    page.locator("#close-help").click()
    page.locator("#language").click()
    assert page.locator(".subtitle").inner_text() == "A visualization tool for the (k, n) threshold scheme proposed by Shamir."
    assert page.locator("footer").inner_text() == "GitHub repository"
    page.locator("#help").click()
    assert page.locator("#help-title").inner_text() == "Help"
    assert "Ways to use this tool" in dialog.inner_text()
    assert "This example does not change with the shares" in dialog.locator("[data-i18n='multiplyIntro']").inner_text()
    assert "This table is not used for reconstruction in “Bytes”" in dialog.locator("#multiply-log").inner_text()
    assert "Only the language and theme settings are saved" in dialog.inner_text()
    page.keyboard.press("Escape")
    assert not dialog.is_visible()
    page.locator("#language").click()


def test_hand_primer(page):
    primer = page.locator("#panel-hand .hand-primer")
    assert primer.is_visible()
    assert primer.bounding_box()["y"] < page.locator("#panel-hand .settings-grid").first.bounding_box()["y"]
    assert "(k,n) しきい値法" in primer.inner_text()
    assert "n 個のシェア" in primer.inner_text()
    assert "① n 人のうち k 人" in primer.inner_text()
    assert "② k−1人" in primer.inner_text()
    assert "情報は一切わかりません" in primer.inner_text()
    assert "最大 k−1" in primer.inner_text()
    assert "k=1：0次、k=2：1次、k=3：2次" in primer.inner_text()
    assert "k=3" in primer.inner_text()
    assert "ラグランジュ補間" in primer.inner_text()
    assert page.locator("#panel-hand .hand-formula").inner_text() == "f(x) = s + a₁x + a₂x² (mod p)"
    assert primer.evaluate("el => el.scrollWidth <= el.clientWidth")
    notation = page.locator("#share-notation")
    assert notation.is_visible()
    assert notation.bounding_box()["y"] < page.locator("#share-picks").bounding_box()["y"]
    assert "#i はシェア番号" in notation.inner_text()
    assert "vᵢ=f(i) はシェアの値" in notation.inner_text()
    assert "(k,n)" in notation.inner_text() and "座標ではありません" in notation.inner_text()
    assert "n=7 ならシェアは7個で、番号は #1～#7" in notation.inner_text()
    page.locator("#language").click()
    assert "Any k of the n participants" in primer.inner_text()
    assert "reveal no information" in primer.inner_text()
    assert "degree at most k−1" in primer.inner_text()
    assert "degree 0 for k=1, degree 1 for k=2, and degree 2 for k=3" in primer.inner_text()
    assert "Lagrange interpolation" in primer.inner_text()
    assert primer.evaluate("el => el.scrollWidth <= el.clientWidth")
    assert "#i is the share number" in notation.inner_text()
    assert "vᵢ=f(i) is the share value" in notation.inner_text()
    assert "not point coordinates" in notation.inner_text()
    assert "n=7, there are seven shares numbered #1 through #7" in notation.inner_text()
    page.locator("#theme").click()
    assert primer.is_visible()
    page.locator("#theme").click()
    page.locator("#language").click()
    page.locator("#share-count").select_option("7")
    shares = page.locator("#share-picks [data-pick]").all()
    assert [share.get_attribute("data-pick") for share in shares] == [str(i) for i in range(1, 8)]
    page.locator("#share-count").select_option("5")


def test_hand_recovery_stages(page):
    assert page.locator("[data-i18n='handIntro']").inner_text() == "小さな素数の座標平面で、分散と復元における計算を追います。"
    assert page.locator("#coefficient-inputs label span").all_inner_texts() == ["a₁", "a₂"]
    assert "独立に選ぶ乱数" in page.locator("[data-i18n='handCoefficientHelp']").inner_text()
    assert page.locator("[data-i18n='distribute']").inner_text() == "分散段階"
    assert page.locator("[data-i18n='reconstruct']").inner_text() == "復元段階"
    assert [b.get_attribute("data-few-pick") for b in page.locator("#hand-few-picks [aria-pressed='true']").all()] == ["1", "2"]
    assert [b.get_attribute("data-pick") for b in page.locator("#share-picks [aria-pressed='true']").all()] == ["1", "2", "3"]
    assert page.locator("#hand-few-graph .hand-graph-value").count() >= 3
    assert page.locator("#hand-enough-graph .hand-graph-value").count() == 6
    assert page.locator("#hand-few-graph .hand-graph-guide").count() == 4
    assert page.locator("#hand-enough-graph .hand-graph-guide-active").count() == 1
    assert page.locator("#hand-few-graph .hand-graph-guide-active").get_attribute("d").count("M") > 1
    assert "2次曲線" in page.locator("#hand-few-graph-caption").inner_text()
    for graph_id in ("hand-few-graph", "hand-enough-graph"):
        graph = page.locator("#" + graph_id)
        curve = graph.locator(".hand-graph-guide-active").get_attribute("d")
        for point in graph.locator(".hand-graph-share").all():
            coordinate = f"{float(point.get_attribute('cx')):.2f},{float(point.get_attribute('cy')):.2f}"
            assert coordinate in curve, (graph_id, coordinate)
    assert "≡ 5" in page.locator("#reconstruction-result").inner_text()
    page.locator('#hand-few-picks [data-few-pick="2"]').click()
    assert page.locator("#candidate-section").is_hidden()
    assert page.locator("#hand-few-graph .hand-graph-value").count() == 0
    assert page.locator("#hand-few-graph path").count() == 0
    page.locator('#hand-few-picks [data-few-pick="4"]').click()
    assert page.locator("#candidate-section").is_visible()
    assert [b.get_attribute("data-pick") for b in page.locator("#share-picks [aria-pressed='true']").all()] == ["1", "2", "4"]
    page.locator('#share-picks [data-pick="2"]').click()
    assert page.locator("#reconstruction-section").is_hidden()
    assert page.locator("#hand-enough-graph .hand-graph-value").count() == 0
    page.locator('#share-picks [data-pick="5"]').click()
    assert page.locator("#hand-enough-graph .hand-graph-value").count() == 6
    assert "≡ 5" in page.locator("#reconstruction-result").inner_text()
    assert page.evaluate("() => document.documentElement.scrollWidth <= innerWidth")
    page.locator("#reset-hand").click()


def test_real_comparison(page):
    page.locator('#reset-hand').click()
    assert page.locator('#hand-explore').count() == 0
    assert page.locator('#real-comparison').is_visible()
    assert page.locator('#real-comparison-graph .real-comparison-curve').count() == 1
    assert '(1,11)' in page.locator('#real-comparison-graph').text_content()
    assert '(2,21)' in page.locator('#real-comparison-graph').text_content()
    assert 'x=2の整数値は21、GF(13)では8' in page.locator('#real-comparison-caption').inner_text()
    page.locator('#next-candidate').click()
    assert 's=6' in page.locator('#real-comparison-caption').inner_text()
    assert 's=6' in page.locator('#real-comparison-graph').text_content()
    page.locator('#previous-candidate').click()
    assert page.locator('#real-comparison-graph path').count() == 1
    assert page.locator('#hand-few-graph .hand-graph-guide').count() == 4
    page.locator('#all-candidates').click()
    assert page.locator('#hand-few-graph .hand-graph-guide').count() == 13
    page.locator('#all-candidates').click()
    page.locator('#hand-few-picks [data-few-pick="2"]').click()
    assert page.locator('#real-comparison').is_hidden()
    page.locator('#hand-few-picks [data-few-pick="2"]').click()
    assert page.locator('#real-comparison').is_visible()
    page.locator('#threshold').select_option('2')
    assert '高々1次' in page.locator('#real-comparison-caption').inner_text()
    assert '直線' in page.locator('#hand-few-graph-caption').inner_text()
    assert page.locator('#hand-enough-graph .hand-graph-guide-active').count() == 1
    page.locator('#threshold').select_option('4')
    assert '高々3次' in page.locator('#real-comparison-caption').inner_text()
    assert page.locator('#hand-few-graph path, #hand-enough-graph path').count() == 0
    page.locator('#threshold').select_option('3')
    page.locator('#coefficient-inputs [data-coefficient="2"]').fill('0')
    page.locator('#coefficient-inputs [data-coefficient="2"]').press('Tab')
    assert '高々2次' in page.locator('#hand-few-graph-caption').inner_text()
    assert '青い直線' in page.locator('#hand-few-graph-caption').inner_text()
    page.locator('#reset-hand').click()


def test_book_example(page):
    page.locator("#reset-hand").click()
    page.locator("#prime").select_option("17")
    page.locator("#secret").fill("13")
    for index, value in ((1, "10"), (2, "2")):
        coefficient = page.locator(f'[data-coefficient="{index}"]')
        coefficient.fill(value)
        coefficient.press("Tab")
    assert [first.inner_text() for first in page.locator("#distribution-table tr td:last-child").all()] == ["8", "7", "10", "0", "11"]
    page.locator('[data-pick="2"]').click()
    page.locator('[data-pick="5"]').click()
    assert "≡ 13" in page.locator("#reconstruction-result").inner_text()
    page.locator("#reset-hand").click()


def test_tabs_and_localization(page):
    assert page.locator("#panel-hand").is_visible()
    assert not page.locator("#panel-bytes").is_visible()
    page.locator("#tab-hand").focus()
    page.keyboard.press("ArrowRight")
    assert page.locator("#panel-bytes").is_visible()
    byte_text = page.locator("#panel-bytes").inner_text()
    assert "256は素数ではなく" in byte_text
    assert "AESと同じ有限体" in byte_text
    assert "UTF-8 のバイト列" in byte_text
    assert "各バイトを別々の秘密情報 s" in byte_text
    assert "XOR" in byte_text
    assert "復元値はまず16進で確かめます" in byte_text
    assert not page.locator("#panel-hand").is_visible()
    assert "0/3個" in page.locator("#byte-selection-status").inner_text()
    assert "シェアを1個選ぶ" in page.locator("#byte-pending-equations").inner_text()
    page.locator("[data-byte-pick='1']").click()
    first_share_byte = page.locator("#byte-table tbody tr:nth-child(2) td:nth-child(2)").inner_text()
    assert "1/3個" in page.locator("#byte-selection-status").inner_text()
    assert f"F₀(01) = s₀ ⊕ a₁,₀·01 ⊕ a₂,₀·01² = {first_share_byte}" in page.locator("#byte-pending-equations").inner_text()
    assert not page.locator("#byte-weights").is_visible()
    assert not page.locator("#byte-restored-text").inner_text()
    page.locator("[data-byte-pick='2']").click()
    assert "2/3個" in page.locator("#byte-selection-status").inner_text()
    assert page.locator("#byte-pending-equations p").count() == 3
    assert "s₀は00〜FFのどの値もありえます" in page.locator("#byte-pending-equations").inner_text()
    page.locator("[data-byte-pick='3']").click()
    assert "3/3個" in page.locator("#byte-selection-status").inner_text()
    assert page.locator("#byte-weights tbody tr").count() == 3
    assert "λᵢ(0)" in page.locator("#byte-weights-intro").inner_text()
    products = [int(cell.split("=")[-1], 16) for cell in page.locator("#byte-weights tbody tr td:last-child").all_inner_texts()]
    assert products[0] ^ products[1] ^ products[2] == 0x4D
    assert "s₀ = " in page.locator("#byte-recovery-example").inner_text()
    assert "= 4D" in page.locator("#byte-recovery-example").inner_text()
    assert "MEET AT DAWN" in page.locator("#byte-restored-text").inner_text()
    page.locator("[data-byte-pick='3']").click()
    page.locator("[data-byte-pick='4']").click()
    assert any(value != "01" for value in page.locator("#byte-weights tbody tr td:nth-child(7)").all_inner_texts())
    assert "MEET AT DAWN" in page.locator("#byte-restored-text").inner_text()
    assert page.locator("#panel-bytes [data-i18n='multiplication']").count() == 0
    assert "0x11B" in page.locator("[data-i18n='fieldRule']").inner_text()
    assert "シェアを作る式Fⱼ(X)" in page.locator("[data-i18n='byteFieldReason']").inner_text()
    formula = page.locator("#byte-formula")
    assert formula.inner_text().startswith("F₀(X) = s₀ ⊕ a₁,₀·X ⊕ a₂,₀·X² = {4D} ⊕ ")
    assert "X²" in formula.inner_text()
    values = re.findall(r"\{([0-9A-F]{2})\}", formula.inner_text())
    assert len(values) == 3
    assert values[0] == "4D"
    assert "crypto.getRandomValues" in page.locator("[data-i18n='byteRandomHow']").inner_text()
    assert "00も候補" in page.locator("[data-i18n='byteRandomHow']").inner_text()
    assert "k−1個以下のシェア" in page.locator("[data-i18n='byteRandomWhy']").inner_text()
    assert "バイト位置を切り替えるだけなら乱数は引き直しません" in page.locator("[data-i18n='byteRandomWhy']").inner_text()
    source = page.locator("#byte-coefficient-source").inner_text()
    assert f"a₁,₀={values[1]}" in source and f"a₂,₀={values[2]}" in source
    assert "s₀から計算した値ではありません" in source
    assert "#1専用という意味ではありません" in source
    headings = page.locator("#byte-calculation thead th").all_inner_texts()
    assert headings == ["シェア", "X", "元のバイト", "a₁,₀·X", "a₂,₀·X²", "XORの結果"]
    first_result = page.locator("#byte-calculation tbody tr").first.locator("td").last.inner_text()
    assert f"F₀(01) = 4D ⊕ ({values[1]}×01) ⊕ ({values[2]}×01²) = 4D ⊕ {values[1]} ⊕ {values[2]} = {first_result}" in page.locator("#byte-first-example").inner_text()
    for share_number, row in enumerate(page.locator("#byte-calculation tbody tr").all(), 1):
        cells = row.locator("td").all_inner_texts()
        total = int(cells[2], 16)
        for term in cells[3:-1]:
            total ^= int(term.split("=")[1], 16)
        assert total == int(cells[-1], 16)
        assert cells[-1] == page.locator(f"#byte-table tbody tr:nth-child({share_number + 1}) td:nth-child(2)").inner_text()
    page.locator("#byte-column").select_option("1")
    assert formula.inner_text().startswith("F₁(X) = s₁ ⊕ a₁,₁·X ⊕ a₂,₁·X² = {45} ⊕ ")
    assert page.locator("#byte-calculation thead th").all_inner_texts()[3:5] == ["a₁,₁·X", "a₂,₁·X²"]
    page.locator("#byte-column").select_option("0")
    assert re.findall(r"\{([0-9A-F]{2})\}", formula.inner_text()) == values
    page.locator("#byte-k").select_option("2")
    assert "X²" not in formula.inner_text()
    page.locator("#byte-k").select_option("4")
    assert "X³" in formula.inner_text()
    assert "a₃,₀·X³" in page.locator("#byte-calculation thead").inner_text()
    page.locator("#byte-k").select_option("3")
    before = page.locator("#byte-secret-hex").inner_text()
    page.locator("#byte-message").evaluate("el => {el.dispatchEvent(new CompositionEvent('compositionstart')); el.value='あ'; el.dispatchEvent(new Event('input',{bubbles:true}));}")
    assert page.locator("#byte-secret-hex").inner_text() == before
    page.locator("#byte-message").evaluate("el => el.dispatchEvent(new CompositionEvent('compositionend'))")
    assert "E38182" in page.locator("#byte-secret-hex").inner_text()
    page.locator("#byte-message").fill("あ")
    for share_number in (1, 2, 3):
        page.locator(f"[data-byte-pick='{share_number}']").click()
    assert "E38182" in page.locator("#byte-restored-hex").inner_text()
    page.locator("#byte-message").fill("A" * 33)
    assert page.locator("#byte-error").inner_text()
    assert not page.locator("#byte-table tbody tr").count()
    assert not page.locator("#byte-coefficient-source").inner_text()
    assert not page.locator("#byte-first-example").inner_text()
    page.locator("#byte-message").fill("MEET AT DAWN")
    page.locator("#tab-pitfalls").click()
    assert page.locator("#panel-pitfalls").is_visible()
    assert "値が出ても、それが元の秘密情報とは限りません" in page.locator("#panel-pitfalls").inner_text()
    assert "#1・#2・#3から「MEET AT DUSK」" in page.locator("#tamper-output").inner_text()
    assert "#2・#4・#5" in page.locator("#tamper-output").inner_text()
    assert "x=0 を受け付けず" in page.locator("#zero-output").inner_text()
    assert "あと1個必要" in page.locator("#short-output").inner_text()
    page.locator("#short-output + details summary").click()
    assert "2DB1D648901E974C5FCE7FF2" in page.locator("#short-calculation").inner_text()
    assert "わかったこと" in page.locator("#tamper-output").inner_text()
    assert "分かったこと" not in page.locator("#panel-pitfalls").inner_text()
    page.locator("#tamper-layer").select_option("crc")
    assert "FD0D0F13" in page.locator("#tamper-output").inner_text()
    page.locator("#tamper-layer").select_option("fingerprint")
    assert "8739EBE2" in page.locator("#tamper-output").inner_text()
    page.locator("#tamper-output + details summary").click()
    assert "#2・#4・#5" in page.locator("#tamper-calculation").inner_text()
    page.locator("#language").click()
    assert page.locator("html").get_attribute("lang") == "en"
    assert page.locator("#tab-hand").inner_text() == "Trace (k, n) by hand"
    assert page.locator("#real-comparison-graph").get_attribute("aria-label") == "Real-number curve for the selected candidate coefficients"
    assert page.locator("#panel-pitfalls").is_visible()
    page.locator("#tab-bytes").click()
    assert "crypto.getRandomValues" in page.locator("[data-i18n='byteRandomHow']").inner_text()
    assert "Switching the inspected byte position does not redraw them" in page.locator("[data-i18n='byteRandomWhy']").inner_text()
    assert "does not mean “for share #1”" in page.locator("#byte-coefficient-source").inner_text()
    assert page.locator("#byte-calculation thead th").all_inner_texts() == ["Share", "X", "Original byte", "a₁,₀·X", "a₂,₀·X²", "XOR result"]
    page.locator("#tab-pitfalls").click()
    page.locator("#theme").click()
    assert page.locator("html").get_attribute("data-theme") == "dark"
    page.locator("#help").click()
    assert page.locator("#help-dialog").is_visible()
    page.locator("#close-help").click()
    assert not page.locator("#help-dialog").is_visible()


def main():
    with sync_playwright() as playwright:
        for browser_name in ("chromium", "firefox"):
            browser = getattr(playwright, browser_name).launch(headless=True)
            for width in (320, 390, 1280):
                page = browser.new_page(viewport={"width": width, "height": 900}, reduced_motion="reduce")
                failures = []
                page.on("pageerror", lambda error: failures.append(str(error)))
                page.on("console", lambda message: failures.append(message.text) if message.type == "error" else None)
                page.goto(URL)
                test_linear_intro(page, width)
                page.locator('#prime').select_option('23')
                assert 'GF(23)' in page.locator('#real-comparison-caption').inner_text()
                page.locator('#reset-hand').click()
                normal = geometry(page, width)
                test_hand_primer(page)
                test_hand_recovery_stages(page)
                if width == 320:
                    assert page.locator(".hand-graph-frame").first.evaluate("el => el.scrollWidth > el.clientWidth")
                    assert page.evaluate("() => document.documentElement.scrollWidth === innerWidth")
                test_distributed_share_data(page)
                test_help(page, width)
                if width == 320:
                    assert normal["graph"] > normal["graphFrame"], normal
                    page.locator("#tab-bytes").click()
                    byte_width = page.evaluate("() => ({table:document.querySelector('#byte-table-frame').scrollWidth, frame:document.querySelector('#byte-table-frame').clientWidth, page:document.documentElement.scrollWidth})")
                    assert byte_width["table"] > byte_width["frame"] and byte_width["page"] == width, byte_width
                    assert page.locator("#byte-calculation").evaluate("el => el.scrollWidth > el.clientWidth")
                    for share_number in (1, 2, 3):
                        page.locator(f"[data-byte-pick='{share_number}']").click()
                    assert page.locator("#byte-weights").evaluate("el => el.scrollWidth > el.clientWidth")
                    assert page.evaluate("() => document.documentElement.scrollWidth === innerWidth")
                    page.locator("#tab-hand").click()
                if width == 390:
                    test_book_example(page)
                    test_real_comparison(page)
                    test_tabs_and_localization(page)
                assert not failures, failures
                print(browser_name, width, "OK", normal)
                page.close()
            browser.close()


if __name__ == "__main__":
    main()
