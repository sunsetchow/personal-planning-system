from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to the app
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Take screenshot of home page
    page.screenshot(path='/tmp/home_page.png', full_page=True)
    print("✅ Home page screenshot saved to /tmp/home_page.png")

    # Try to navigate to OKR page - look for navigation links
    try:
        # Check if there's an OKR link or button
        okr_link = page.locator('text=/okr/i').first
        if okr_link.is_visible(timeout=2000):
            okr_link.click()
            page.wait_for_load_state('networkidle')
            page.screenshot(path='/tmp/okr_page.png', full_page=True)
            print("✅ OKR page screenshot saved to /tmp/okr_page.png")
    except:
        # Try direct navigation
        page.goto('http://localhost:3000/okr')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='/tmp/okr_page.png', full_page=True)
        print("✅ OKR page screenshot saved to /tmp/okr_page.png")

    # Get viewport and content dimensions
    viewport = page.viewport_size
    print(f"\n📏 Viewport: {viewport}")

    # Get body dimensions
    body_rect = page.evaluate('''() => {
        const body = document.body;
        const html = document.documentElement;
        return {
            scrollWidth: Math.max(body.scrollWidth, html.scrollWidth),
            scrollHeight: Math.max(body.scrollHeight, html.scrollHeight),
            clientWidth: html.clientWidth,
            clientHeight: html.clientHeight,
            bodyPadding: window.getComputedStyle(body).padding,
            bodyMargin: window.getComputedStyle(body).margin
        };
    }''')
    print(f"📐 Body dimensions: {body_rect}")

    # Check main container styles
    containers = page.evaluate('''() => {
        const elements = [];
        const selectors = ['main', '[class*="container"]', '[class*="wrapper"]', '.max-w-'];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                const styles = window.getComputedStyle(el);
                elements.push({
                    selector: sel,
                    className: el.className,
                    maxWidth: styles.maxWidth,
                    width: styles.width,
                    padding: styles.padding,
                    margin: styles.margin
                });
            });
        });
        return elements;
    }''')

    print("\n🎨 Container styles:")
    for container in containers:
        print(f"  {container}")

    browser.close()
