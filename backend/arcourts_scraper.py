"""
ARCaseNet Scraper - runs Playwright headless Chrome to search Arkansas court records.
Used by the background check system in officer_radio_dispatcher.py.
"""
import asyncio
import json
import logging
from typing import Optional
from playwright.async_api import async_playwright, Browser

logger = logging.getLogger(__name__)

_browser: Optional[Browser] = None
_playwright = None

ARCOURTS_BASE = "https://caseinfo.arcourts.gov/opad"


async def get_browser() -> Browser:
    global _browser, _playwright
    if _browser is None or not _browser.is_connected():
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-software-rasterizer",
                "--disable-extensions",
                "--no-zygote",
                "--disable-setuid-sandbox",
                "--js-flags=--max-old-space-size=256",
            ]
        )
        logger.info("Playwright browser launched for ARCaseNet")
    return _browser


async def search_participant(last_name: str, first_name: str = "", max_results: int = 20) -> dict:
    """Search ARCaseNet for a participant by name."""
    global _browser, _playwright
    context = None
    page = None
    try:
        browser = await get_browser()
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()

        # Intercept the API response
        api_data = []

        async def handle_response(response):
            if "/api/participants/search" in response.url:
                try:
                    body = await response.json()
                    api_data.append(body)
                except:
                    pass

        page.on("response", handle_response)

        search_url = f"{ARCOURTS_BASE}/search?context=participants&lastName={last_name.upper()}&firstName={first_name.upper()}"
        logger.info(f"ARCaseNet search: {last_name}, {first_name}")

        await page.goto(search_url, wait_until="networkidle", timeout=30000)
        await asyncio.sleep(3)

        results = []

        # First try: intercepted API data
        if api_data:
            for data in api_data:
                items = data.get("items", data.get("results", []))
                paging = data.get("paging", {})
                if isinstance(items, list):
                    for item in items[:max_results]:
                        results.append({
                            "name": item.get("fullName", ""),
                            "party_type": item.get("partyType", ""),
                            "case_number": item.get("caseId", ""),
                            "case_description": item.get("caseDesc", ""),
                            "filing_date": item.get("caseFilingDate", ""),
                            "case_type": item.get("caseType", ""),
                            "status": item.get("statusDesc", ""),
                        })
                if results:
                    return {
                        "found": True,
                        "count": len(results),
                        "total": paging.get("totalRecords", len(results)),
                        "results": results,
                        "source": "arcasenet_api"
                    }

        # Fallback: scrape the rendered data grid
        rows = await page.query_selector_all('.MuiDataGrid-row')
        for row in rows[:max_results]:
            try:
                cells = await row.query_selector_all('.MuiDataGrid-cell')
                if len(cells) >= 4:
                    texts = [await c.inner_text() for c in cells]
                    results.append({
                        "name": texts[0].strip() if len(texts) > 0 else "",
                        "party_type": texts[1].strip() if len(texts) > 1 else "",
                        "case_number": texts[2].strip() if len(texts) > 2 else "",
                        "case_description": texts[3].strip() if len(texts) > 3 else "",
                        "filing_date": texts[4].strip() if len(texts) > 4 else "",
                        "case_type": texts[5].strip() if len(texts) > 5 else "",
                        "status": texts[6].strip() if len(texts) > 6 else "",
                    })
            except:
                continue

        if not results:
            return {"found": False, "count": 0, "results": [], "message": "No ARCaseNet records found"}

        return {"found": True, "count": len(results), "results": results, "source": "arcasenet_scrape"}

    except Exception as e:
        logger.error(f"ARCaseNet scraper error: {e}")
        # Reset browser on crash so next call gets a fresh one
        _browser = None
        _playwright = None
        return {"found": False, "count": 0, "results": [], "message": str(e)}
    finally:
        if page:
            await page.close()
        if context:
            await context.close()
