"""Screenshot the RoyalCards site hero (above the fold) and a tall scroll capture."""
import os
from playwright.sync_api import sync_playwright

SRC = "file:///root/.claude/uploads/d4e39713-5dd2-4028-9393-acdb2a11d28b/30738e50-royalcards_15.html"
ASSETS = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    page = browser.new_page(viewport={"width": 1480, "height": 920}, device_scale_factor=2)
    page.goto(SRC, wait_until="load", timeout=60000)
    try:
        page.wait_for_load_state("networkidle", timeout=8000)
    except Exception:
        pass
    page.wait_for_timeout(2500)
    # Hero / above-the-fold
    page.screenshot(path=os.path.join(ASSETS, "site_hero.png"))
    # A slightly scrolled capture (categories area) for a second framing option
    page.evaluate("window.scrollTo(0, Math.round(window.innerHeight*0.95))")
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(ASSETS, "site_scroll.png"))
    # Page height for reference
    h = page.evaluate("document.body.scrollHeight")
    print("body scrollHeight:", h)
    browser.close()

for f in ("site_hero.png", "site_scroll.png"):
    fp = os.path.join(ASSETS, f)
    print(f, os.path.getsize(fp) if os.path.exists(fp) else "MISSING")
