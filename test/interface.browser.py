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


def test_interactions(page):
    assert first_y(page) == "11"
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
        assert "ΔS=3" in page.locator("#tweak-result").inner_text(), method
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


def test_tabs_and_localization(page):
    assert page.locator("#panel-hand").is_visible()
    assert not page.locator("#panel-bytes").is_visible()
    page.locator("#tab-hand").focus()
    page.keyboard.press("ArrowRight")
    assert page.locator("#panel-bytes").is_visible()
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
    page.locator("#tamper-layer").select_option("crc")
    assert "FD0D0F13" in page.locator("#tamper-output").inner_text()
    page.locator("#tamper-layer").select_option("fingerprint")
    assert "8739EBE2" in page.locator("#tamper-output").inner_text()
    page.locator("#language").click()
    assert page.locator("html").get_attribute("lang") == "en"
    assert page.locator("#tab-hand").inner_text() == "Trace by hand"
    assert page.locator("#field-grid").get_attribute("aria-label") == "Finite field grid of shares and candidates"
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
                page.locator("#prime").select_option("23")
                large = geometry(page, width)
                assert large["grid"] > large["gridFrame"] if width == 320 else True
                page.locator("#reset-hand").click()
                normal = geometry(page, width)
                if width == 320:
                    assert page.locator("#field-grid").get_attribute("width") == "260"
                    assert normal["grid"] == normal["gridFrame"], normal
                    page.locator("#tab-bytes").click()
                    byte_width = page.evaluate("() => ({table:document.querySelector('#byte-table-frame').scrollWidth, frame:document.querySelector('#byte-table-frame').clientWidth, page:document.documentElement.scrollWidth})")
                    assert byte_width["table"] > byte_width["frame"] and byte_width["page"] == width, byte_width
                    page.locator("#tab-hand").click()
                if width == 390:
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
