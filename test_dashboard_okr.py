from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    print("🔍 Testing Dashboard OKR UI layout...")

    # Navigate to dashboard/okrs
    page.goto('http://localhost:3000/dashboard/okrs')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Check current URL
    current_url = page.url
    print(f"📍 Current URL: {current_url}")

    # Take screenshot
    page.screenshot(path='/tmp/dashboard_okr.png', full_page=True)
    print("✅ Screenshot saved to /tmp/dashboard_okr.png")

    # Analyze layout
    analysis = page.evaluate('''() => {
        const body = document.body;
        const main = document.querySelector('main');
        const contentDiv = document.querySelector('[class*="space-y"]');

        const getFullStyles = (el, label) => {
            if (!el) return { label, exists: false };
            const styles = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                label,
                exists: true,
                tag: el.tagName,
                className: el.className,
                width: rect.width,
                maxWidth: styles.maxWidth,
                margin: styles.margin,
                marginLeft: styles.marginLeft,
                marginRight: styles.marginRight,
                padding: styles.padding,
                paddingLeft: styles.paddingLeft,
                paddingRight: styles.paddingRight
            };
        };

        return {
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            body: getFullStyles(body, 'body'),
            main: getFullStyles(main, 'main'),
            content: getFullStyles(contentDiv, 'content div'),
            allContainers: Array.from(document.querySelectorAll('div')).map(div => ({
                className: div.className,
                maxWidth: window.getComputedStyle(div).maxWidth,
                width: div.getBoundingClientRect().width
            })).filter(d => d.maxWidth && d.maxWidth !== 'none')
        };
    }''')

    print("\n📊 Layout Analysis:")
    print(f"\nViewport: {analysis['viewport']['width']}x{analysis['viewport']['height']}")

    for key in ['body', 'main', 'content']:
        item = analysis[key]
        if item['exists']:
            print(f"\n{item['label'].upper()}:")
            print(f"  Tag: {item['tag']}")
            print(f"  Class: {item['className']}")
            print(f"  Width: {item['width']}px")
            print(f"  Max-width: {item['maxWidth']}")
            print(f"  Margin: {item['margin']}")
            print(f"  Padding: {item['padding']}")
        else:
            print(f"\n{item['label'].upper()}: Not found")

    print(f"\n🎯 Containers with max-width: {len(analysis['allContainers'])}")
    if len(analysis['allContainers']) > 0:
        print("First 3 containers:")
        for container in analysis['allContainers'][:3]:
            print(f"  - {container['className'][:50]}: max-width={container['maxWidth']}, width={container['width']}px")

    browser.close()
