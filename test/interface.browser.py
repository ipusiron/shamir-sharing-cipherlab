"""Local file:// browser checks. Run: python test/interface.browser.py"""
from pathlib import Path

from playwright.sync_api import sync_playwright


URL = (Path(__file__).resolve().parents[1] / "index.html").as_uri()


def geometry(page, width):
    measured = page.evaluate("""() => ({
      page: document.documentElement.scrollWidth,
      viewport: innerWidth,
      grid: document.querySelector('#grid-frame').scrollWidth,
      gridFrame: document.querySelector('#grid-frame').clientWidth,
      byteTable: document.querySelector('#byte-table-frame').scrollWidth,
      byteFrame: document.querySelector('#byte-table-frame').clientWidth
    })""")
    assert measured["page"] <= measured["viewport"], measured
    assert measured["viewport"] == width, measured
    assert measured["gridFrame"] <= measured["viewport"], measured
    assert measured["byteFrame"] <= measured["viewport"], measured
    assert measured["grid"] >= measured["gridFrame"], measured
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
    assert page.locator("#panel-linear [data-i18n='linearRecoveryTitle']").bounding_box()["y"] < page.locator("#panel-linear [data-i18n='linearShares']").bounding_box()["y"]
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
    assert page.locator("[data-i18n='linearGridTitle']").inner_text() == "② シェアが1つだけあった場合：1点を通る直線を考える"
    assert "直線が何本も引ける" in page.locator("[data-i18n='linearGridIntro']").inner_text()
    assert page.locator("#linear-one-focus").inner_text() == "ここでは #3 のシェア (3,4) だけに注目します。"
    assert page.locator("[data-i18n='linearGridTitle']").bounding_box()["y"] < page.locator("[data-i18n='linearTwoTitle']").bounding_box()["y"]
    assert page.locator("#linear-two").is_hidden()
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
    assert "(3,4)" in page.locator("#linear-selected").inner_text()
    pair_meaning = page.locator("#panel-linear [data-i18n='linearPairMeaning']")
    assert "(1,9) は、管理人番号1（＝#1）とシェア9のセット" in pair_meaning.inner_text()
    assert pair_meaning.bounding_box()["y"] < page.locator("#linear-picks").bounding_box()["y"]
    assert page.locator("#linear-analogy").bounding_box()["width"] <= width
    assert page.locator("#linear-grid").count() == 0
    assert page.locator("#linear-to-hand").count() == 0
    page.locator("#linear-candidate").select_option("5")
    assert "a₁=(4−5)÷3≡4" in page.locator("#linear-candidate-result").inner_text()
    assert "(mod 13)" in page.locator("#linear-candidate-result").inner_text()
    page.locator('[data-linear-pick="2"]').click()
    assert "s=5" in page.locator("#linear-two-result").inner_text()
    assert page.locator("[data-i18n='linearTwoTitle']").inner_text() == "③ シェアが2つ揃った場合：2点から式を決める"
    assert "(2,n) しきい値法" in page.locator("[data-i18n='linearTwoIntro']").inner_text()
    assert page.locator("#linear-analogy").is_visible()
    assert page.locator("#linear-one-focus").inner_text() == "ここでは #2 のシェア (2,0) だけに注目します。"
    page.locator('[data-linear-pick="2"]').click()
    assert "13本" in page.locator("#linear-one-result").inner_text()
    page.locator('[data-linear-pick="1"]').click()
    assert "s=5" in page.locator("#linear-two-result").inner_text()
    page.locator('[data-linear-pick="1"]').click()
    assert page.locator("#linear-one-focus").inner_text() == "ここでは #3 のシェア (3,4) だけに注目します。"
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
    page.locator('[data-linear-pick="1"]').click()
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
    assert "(3,0)" in page.locator("#linear-selected").inner_text()
    page.locator('[data-linear-pick="2"]').click()
    assert "s=7" in page.locator("#linear-two-result").inner_text()
    page.locator("#linear-n").select_option("7")
    assert page.locator("#linear-picks button").count() == 7
    assert page.locator("#linear-threshold").inner_text().startswith("7人のうち2人")
    assert rows.count() == 7
    assert "v₇=f(7)=(7+2×7) mod 13=8" in rows.last.inner_text()
    page.locator("#linear-reset").click()
    assert page.locator("#linear-picks button").count() == 5
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
    assert "Their y-intercepts are f(0)" in page.locator("#linear-analogy-caption").inner_text()
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
    assert "v₁ = f(1) = 11" in lines.first.inner_text()
    assert "復元用の組： (1,v₁) = (1,f(1)) = (1,(5 + 4×1 + 2×1^2) mod 13) = (1,11)" in lines.first.inner_text()
    assert page.locator("#share-data").bounding_box()["y"] > page.locator("#distribution-table").bounding_box()["y"]
    page.locator("#share-count").select_option("7")
    assert lines.count() == 7
    assert lines.last.inner_text().startswith("#7 のシェア： v₇ = f(7) =")
    assert "(7,(5 + 4×7 + 2×7^2) mod 13)" in lines.last.inner_text()
    page.locator("[data-coefficient='1']").fill("6")
    page.locator("[data-coefficient='1']").dispatch_event("change")
    assert lines.first.inner_text().endswith("(1,(5 + 6×1 + 2×1^2) mod 13) = (1,0)")
    page.locator("#prime").select_option("17")
    assert lines.first.inner_text().endswith("mod 17) = (1,13)")
    page.locator("#threshold").select_option("1")
    assert lines.first.inner_text().endswith("(1,(5) mod 17) = (1,5)")
    page.locator("#language").click()
    assert lines.first.inner_text().startswith("Share #1: v₁ = f(1) = 5")
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
    assert page.locator("#help-dialog ol.help-list li").count() == 7
    assert page.locator("#help-dialog ul.help-list li").count() == 6
    assert page.locator("#help-dialog [data-i18n='helpUses']").inner_text() == "活用例"
    assert "実際に使っているパスワード、シードフレーズ、鍵" in dialog.inner_text()
    assert "保存するのは表示言語と明暗の設定だけ" in dialog.inner_text()
    assert "座標平面の点をドラッグ" in dialog.inner_text()
    assert "CTF・謎解き" in dialog.inner_text()
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


def test_interactions(page):
    assert first_y(page) == "11"
    assert "左下のマスが (0,0)" in page.locator("[data-i18n='gridHint']").inner_text()
    page.locator('#field-grid [data-share-x="1"]').hover()
    tooltip = page.locator("#grid-coordinate-tooltip")
    assert tooltip.is_visible() and tooltip.inner_text() == "(1, 11)"
    origin = page.locator('#field-grid [data-cell-x="0"][data-cell-y="0"]').bounding_box()
    page.mouse.move(origin["x"] + origin["width"] / 2, origin["y"] + origin["height"] / 2)
    assert tooltip.inner_text() == "(0, 0)"
    page.mouse.move(0, 0)
    assert not tooltip.is_visible()
    assert "≡ 5" in page.locator("#reconstruction-result").inner_text()
    for method in ("keyboard", "tap", "drag"):
        page.locator("#reset-hand").click()
        point = page.locator('#field-grid [data-share-x="1"]')
        cell = page.locator('#field-grid [data-cell-x="1"][data-cell-y="12"]')
        if method == "keyboard":
            point.click()
            page.keyboard.press("ArrowUp")
        elif method == "tap":
            point.click()
            cell.click()
        else:
            point.scroll_into_view_if_needed()
            start, end = point.bounding_box(), cell.bounding_box()
            page.mouse.move(start["x"] + start["width"] / 2, start["y"] + start["height"] / 2)
            page.mouse.down()
            page.mouse.move(end["x"] + end["width"] / 2, end["y"] + end["height"] / 2)
            page.mouse.up()
        assert first_y(page) == "12", method
        assert "≡ 8" in page.locator("#reconstruction-result").inner_text(), method
        assert "Δs=3" in page.locator("#tweak-result").inner_text(), method
        assert page.locator('#field-grid [data-share-x="1"]').get_attribute("aria-label").endswith("1, 12")
    page.locator("#reset-hand").click()
    page.locator("#threshold").select_option("1")
    assert "コピー" in page.locator("#tweak-result").inner_text()
    assert [row.locator("td").last.inner_text() for row in page.locator("#distribution-table tr").all()] == ["5"] * 5
    page.locator("#reset-hand").click()
    page.locator("#select-kminus").click()
    assert "13/13" in page.locator("#candidate-result").inner_text()
    page.locator("#leading-only").check()
    assert "12/13" in page.locator("#candidate-result").inner_text()
    page.locator('#real-graph [data-real-x="0"]').focus()
    before = page.locator("#real-result").inner_text()
    page.keyboard.press("ArrowUp")
    assert page.locator("#real-result").inner_text() != before
    page.locator("#reset-hand").click()
    real_point = page.locator('#real-graph [data-real-x="1"]')
    real_point.click()
    point_box, graph_box = real_point.bounding_box(), page.locator("#real-graph").bounding_box()
    page.locator("#real-graph").click(position={"x": point_box["x"] + point_box["width"] / 2 - graph_box["x"], "y": point_box["y"] + point_box["height"] / 2 - graph_box["y"] - 20})
    assert "(1,11)" not in page.locator("#real-result").inner_text()
    page.locator("#reset-hand").click()
    real_point = page.locator('#real-graph [data-real-x="1"]')
    real_point.scroll_into_view_if_needed()
    point_box = real_point.bounding_box()
    x, y = point_box["x"] + point_box["width"] / 2, point_box["y"] + point_box["height"] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y - 20)
    page.mouse.up()
    assert "(1,11)" not in page.locator("#real-result").inner_text()


def test_single_selected_share(page):
    # Reproduce the one-selected-share state: (1,11), (2,4), (3,10), (4,3), (5,9).
    page.locator("#reset-hand").click()
    for index, value in ((1, "6"), (2, "0")):
        coefficient = page.locator(f'[data-coefficient="{index}"]')
        coefficient.fill(value)
        coefficient.press("Tab")
    for x, y in enumerate((11, 4, 10, 3, 9), 1):
        assert page.locator(f'[data-pick="{x}"]').inner_text() == f"#{x} ({x},{y})"
    page.locator('[data-pick="1"]').click()
    page.locator('[data-pick="2"]').click()
    assert page.locator(".field-ghost").count() == 13
    assert page.locator("#tweak-result").inner_text()
    original = page.locator("#polynomial").inner_text()
    page.locator('#field-grid [data-share-x="3"]').click()
    assert page.locator("#polynomial").inner_text() == original
    assert page.evaluate('() => document.activeElement.getAttribute("data-share-x")') == "3"
    page.keyboard.press("ArrowUp")
    assert page.locator('#field-grid [data-share-x="3"]').get_attribute("aria-label").endswith("3, 11")
    assert page.locator("#secret").input_value() == "5"
    assert page.locator("[data-coefficient]").count() == 2

    page.locator("#reset-hand").click()
    page.locator('[data-pick="1"]').click()
    page.locator('[data-pick="2"]').click()
    point = page.locator('#field-grid [data-share-x="3"]')
    cell = page.locator('#field-grid [data-cell-x="3"][data-cell-y="10"]')
    point.scroll_into_view_if_needed()
    start, end = point.bounding_box(), cell.bounding_box()
    page.mouse.move(start["x"] + start["width"] / 2, start["y"] + start["height"] / 2)
    page.mouse.down()
    page.mouse.move(end["x"] + end["width"] / 2, end["y"] + end["height"] / 2)
    page.mouse.up()
    assert page.locator('#field-grid [data-share-x="3"]').get_attribute("aria-label").endswith("3, 10")
    assert page.locator("#secret").input_value() == "5"
    assert page.locator("[data-coefficient]").count() == 2
    assert page.evaluate('() => document.activeElement.getAttribute("data-share-x")') == "3"

    page.locator("#reset-hand").click()
    page.locator("#select-kminus").click()
    page.locator("#next-candidate").click()
    assert page.locator("#candidate-result").inner_text().endswith("=6")
    page.locator('#field-grid [data-share-x="1"]').click()
    page.keyboard.press("ArrowUp")
    assert page.locator('[data-pick="2"]').inner_text() == "#2 (2,8)"
    assert page.locator("#secret").input_value() == "6"
    assert page.locator("[data-coefficient]").count() == 2


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
    assert "λᵢ(0)" in byte_text and "XOR" in byte_text
    assert "復元値はまず16進で確かめます" in byte_text
    assert not page.locator("#panel-hand").is_visible()
    assert "MEET AT DAWN" in page.locator("#byte-restored-text").inner_text()
    before = page.locator("#byte-secret-hex").inner_text()
    page.locator("#byte-message").evaluate("el => {el.dispatchEvent(new CompositionEvent('compositionstart')); el.value='あ'; el.dispatchEvent(new Event('input',{bubbles:true}));}")
    assert page.locator("#byte-secret-hex").inner_text() == before
    page.locator("#byte-message").evaluate("el => el.dispatchEvent(new CompositionEvent('compositionend'))")
    assert "E38182" in page.locator("#byte-secret-hex").inner_text()
    page.locator("#byte-message").fill("あ")
    assert "E38182" in page.locator("#byte-restored-hex").inner_text()
    page.locator("#byte-message").fill("A" * 33)
    assert page.locator("#byte-error").inner_text()
    assert not page.locator("#byte-table tbody tr").count()
    page.locator("#byte-message").fill("MEET AT DAWN")
    page.locator("#tab-pitfalls").click()
    assert page.locator("#panel-pitfalls").is_visible()
    assert "わかったこと" in page.locator("#tamper-output").inner_text()
    assert "分かったこと" not in page.locator("#panel-pitfalls").inner_text()
    page.locator("#tamper-layer").select_option("crc")
    assert "FD0D0F13" in page.locator("#tamper-output").inner_text()
    page.locator("#tamper-layer").select_option("fingerprint")
    assert "8739EBE2" in page.locator("#tamper-output").inner_text()
    page.locator("#language").click()
    assert page.locator("html").get_attribute("lang") == "en"
    assert page.locator("#tab-hand").inner_text() == "Trace (k, n) by hand"
    assert page.locator("#field-grid").get_attribute("aria-label") == "Finite-field coordinate plane of shares and candidates"
    assert page.locator("#real-graph").get_attribute("aria-label") == "Real-number interpolation curve"
    assert page.locator("#panel-pitfalls").is_visible()
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
                page.locator("#prime").select_option("23")
                page.locator('#field-grid [data-cell-x="22"][data-cell-y="22"]').hover()
                tooltip = page.locator("#grid-coordinate-tooltip")
                assert tooltip.is_visible() and tooltip.inner_text() == "(22, 22)"
                tip_box = tooltip.bounding_box()
                assert 0 <= tip_box["x"] and tip_box["x"] + tip_box["width"] <= width
                large = geometry(page, width)
                assert large["grid"] > large["gridFrame"] if width == 320 else True
                page.locator("#reset-hand").click()
                normal = geometry(page, width)
                test_hand_primer(page)
                test_distributed_share_data(page)
                test_help(page, width)
                if width == 320:
                    assert page.locator("#field-grid").get_attribute("width") == "260"
                    assert normal["grid"] == normal["gridFrame"], normal
                    page.locator("#tab-bytes").click()
                    byte_width = page.evaluate("() => ({table:document.querySelector('#byte-table-frame').scrollWidth, frame:document.querySelector('#byte-table-frame').clientWidth, page:document.documentElement.scrollWidth})")
                    assert byte_width["table"] > byte_width["frame"] and byte_width["page"] == width, byte_width
                    page.locator("#tab-hand").click()
                if width == 390:
                    test_book_example(page)
                    test_interactions(page)
                    assert page.locator(".field-value").first.evaluate("el => getComputedStyle(el).animationName") == "none"
                    test_single_selected_share(page)
                    test_tabs_and_localization(page)
                assert not failures, failures
                print(browser_name, width, "OK", normal)
                page.close()
            browser.close()


if __name__ == "__main__":
    main()
