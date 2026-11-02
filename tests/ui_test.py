"""Browser test: python3 tests/ui_test.py [screenshot-dir]

Visits every page, enters a score by hand, plays a whole season through
selection (confirm, announce) and the Final Four, opens the offseason, and
switches to the men's dynasty and back, and checks that nothing errors and
the phone layout doesn't scroll sideways.
"""
import http.server, socketserver, threading, sys, functools, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
if OUT: OUT.mkdir(parents=True, exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
U = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
errors = []

def shot(pg, name):
    if OUT: pg.screenshot(path=str(OUT / f"{name}.png"), full_page=True)

def visit(pg, h, name=None):
    pg.goto(U + h); pg.wait_for_timeout(250)
    t = pg.locator("#app").inner_text()
    assert "Something went wrong" not in t, f"{h}: {t[:300]}"
    if name: shot(pg, name)
    return t

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1360, "height": 900})
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("console", lambda m: m.type == "error" and "ERR_" not in m.text and "fonts.g" not in m.text and errors.append(f"console: {m.text}"))
    pg.on("dialog", lambda d: d.accept())
    pg.goto(U); pg.wait_for_selector(".kpis")
    for h in ["#/home", "#/schedule", "#/standings", "#/rankings", "#/postseason", "#/teams", "#/coaches", "#/conferences", "#/history", "#/records", "#/settings", "#/team/Wisconsin", "#/conference/Big%20Ten"]:
        visit(pg, h, "a-" + h.strip("#/").replace("/", "-").replace("%20", "_"))
    t = visit(pg, "#/teams")
    assert "OFF" in t and "MID" in t and "ATT" not in t
    assert pg.locator("#league-name").inner_text() == "AAU Women's Hockey"

    # Enter a tie by hand: goals by period, totals worked out; a tie needs
    # the 5-minute overtime, then it stands.
    visit(pg, "#/schedule")
    pg.locator(".game[data-game]").first.click(); pg.wait_for_timeout(200)
    for side, vals in (("away", ["1", "0", "1"]), ("home", ["0", "2", "0"])):
        for i, v in enumerate(vals): pg.fill(f'input[data-side="{side}"][data-inn="{i}"]', v)
    pg.dispatch_event('input[data-side="home"][data-inn="2"]', "input")
    assert pg.locator("#m-home-R").inner_text() == "2" and pg.locator("#m-away-R").inner_text() == "2"
    pg.click("#m-save"); pg.wait_for_timeout(150)
    assert "5-minute overtime" in pg.locator("#toast").inner_text()
    pg.click("#m-addinn"); pg.wait_for_timeout(100)
    pg.fill('input[data-side="away"][data-inn="3"]', "1"); pg.fill('input[data-side="home"][data-inn="3"]', "1")
    pg.click("#m-save"); pg.wait_for_timeout(150)
    assert "sudden death" in pg.locator("#toast").inner_text()
    pg.fill('input[data-side="away"][data-inn="3"]', "0"); pg.fill('input[data-side="home"][data-inn="3"]', "0")
    shot(pg, "b-editor")
    pg.click("#m-save"); pg.wait_for_timeout(200)
    assert "saved" in pg.locator("#toast").inner_text()
    pg.locator(".game.final[data-game]").first.click(); pg.wait_for_timeout(200)
    t = pg.locator("dialog").inner_text()
    assert "PIM" in t and "3rd" in t and "tie" in t.lower() and "FINAL/OT" in t.upper() and "Oct." in t, t
    shot(pg, "b-box"); pg.keyboard.press("Escape")
    t = visit(pg, "#/standings")
    assert "Pts" in t

    # Play the season; announce the field by hand.
    for _ in range(40):
        pg.goto(U + "#/home"); pg.wait_for_timeout(150)
        if pg.locator("#h-week").count():
            pg.click("#h-week"); pg.wait_for_timeout(500); continue
        pg.goto(U + "#/postseason"); pg.wait_for_timeout(200)
        if not pg.locator("#ps-all").count(): break
        if pg.locator('[data-pt="field"]').count(): pg.click('[data-pt="field"]'); pg.wait_for_timeout(200)
        if pg.locator("#f-confirm").count():
            shot(pg, "c-selection"); pg.click("#f-confirm"); pg.wait_for_timeout(300)
        if pg.locator("#f-lock").count():
            shot(pg, "c-seeding"); pg.click("#f-lock"); pg.wait_for_timeout(300)
        else:
            pg.click("#ps-all"); pg.wait_for_timeout(1500)
    t = visit(pg, "#/postseason")
    assert "National Champion" in t
    assert pg.locator('[data-pt="supers"]').count() == 0, "no super regionals with 4 regions"
    assert pg.locator('[data-pt="mcws"]').inner_text() == "Frozen Four"
    assert pg.locator('[data-pt="regionals"]').inner_text() == "Regions"
    pg.click('[data-pt="regionals"]'); pg.wait_for_timeout(250)
    t = pg.locator("#app").inner_text()
    assert "Region" in t and "higher seed's rink" in t, t[:500]
    for tab in ["regionals", "participants", "mcws"]:
        pg.click(f'[data-pt="{tab}"]'); pg.wait_for_timeout(250)
        assert "Something went wrong" not in pg.locator("#app").inner_text()
        shot(pg, f"d-{tab}")
    for h in ["#/home", "#/standings", "#/rankings", "#/team/Wisconsin", "#/records", "#/history", "#/coaches", "#/offseason"]:
        visit(pg, h, "e-" + h.strip("#/").replace("/", "-"))
    t = visit(pg, "#/records")
    assert "Most goals in a game" in t and "shootout" not in t.lower()

    # The men's dynasty: its own conferences and save.
    pg.goto(U + "#/home"); pg.wait_for_timeout(200)
    pg.click('[data-side="men"]'); pg.wait_for_selector(".kpis"); pg.wait_for_timeout(300)
    pg.wait_for_timeout(800); assert pg.locator("#league-name").inner_text() == "AAU Men's Hockey", pg.locator("#league-name").inner_text()
    visit(pg, "#/schedule")
    pg.locator(".game[data-game]").first.click(); pg.wait_for_timeout(200)
    pg.click("#m-sim"); pg.wait_for_timeout(100); pg.click("#m-save"); pg.wait_for_timeout(200)
    pg.locator(".game.final[data-game]").first.click(); pg.wait_for_timeout(200)
    t = pg.locator("dialog").inner_text()
    assert "3rd" in t and "PIM" in t, t
    shot(pg, "g-men-box"); pg.keyboard.press("Escape")
    t = visit(pg, "#/team/Cornell", "g-men-team")
    assert "Casey Jones" in t and "Lynah Rink" in t and "Eastern Hockey Conference" in t
    pg.click('[data-side="women"]'); pg.wait_for_selector(".kpis"); pg.wait_for_timeout(300)
    assert pg.locator("#league-name").inner_text() == "AAU Women's Hockey"
    assert "National Champion" in visit(pg, "#/postseason"), "the women's dynasty kept its season"

    pg.set_viewport_size({"width": 390, "height": 800})
    for h in ["#/home", "#/schedule", "#/standings"]:
        visit(pg, h)
        assert not pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1"), f"{h} scrolls sideways on a phone"
    shot(pg, "f-mobile")
    b.close()

srv.shutdown()
if errors:
    print("\n".join(errors)); sys.exit(1)
print("ui test passed")
