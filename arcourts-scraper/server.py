"""
ARCaseNet Scraper Microservice
Playwright-based scraper for Arkansas court records (caseinfo.arcourts.gov)
Exposes a simple REST API for searching participants and cases.
"""
import asyncio
import json
import logging
import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright, Browser, BrowserContext

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ARCaseNet Scraper", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Global browser instance (reused across requests)
_browser: Optional[Browser] = None
_playwright = None

ARCOURTS_BASE = "https://caseinfo.arcourts.gov/opad"

async def get_browser() -> Browser:
    global _browser, _playwright
    if _browser is None or not _browser.is_connected():
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        logger.info("Browser launched")
    return _browser

async def create_context() -> BrowserContext:
    browser = await get_browser()
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 720}
    )
    return context

@app.get("/health")
async def health():
    return {"status": "ok", "service": "arcourts-scraper"}

@app.get("/search/participant")
async def search_participant(
    last_name: str = Query(..., min_length=2),
    first_name: str = Query("", min_length=0),
    max_results: int = Query(20, ge=1, le=100)
):
    """Search ARCaseNet for a participant by name. Returns case records."""
    context = None
    page = None
    try:
        context = await create_context()
        page = await context.new_page()
        
        # Navigate to search page
        search_url = f"{ARCOURTS_BASE}/search?context=participants&lastName={last_name.upper()}&firstName={first_name.upper()}"
        logger.info(f"Navigating to: {search_url}")
        
        await page.goto(search_url, wait_until="networkidle", timeout=30000)
        
        # Wait for either results table or no-results message
        try:
            await page.wait_for_selector('[data-testid="search-results-table"], .MuiAlert-message, .MuiDataGrid-root', timeout=15000)
        except Exception:
            logger.warning("Timeout waiting for results selector")
        
        # Small delay for data to render
        await asyncio.sleep(2)
        
        # Try to intercept the API response by reading the rendered table
        results = []
        
        # Check for the data grid rows
        rows = await page.query_selector_all('.MuiDataGrid-row')
        logger.info(f"Found {len(rows)} rows in data grid")
        
        if not rows:
            # Try alternative: look for any table rows
            rows = await page.query_selector_all('tr[data-rowindex], div[data-rowindex]')
            logger.info(f"Found {len(rows)} alternative rows")
        
        for row in rows[:max_results]:
            try:
                cells = await row.query_selector_all('.MuiDataGrid-cell')
                if len(cells) >= 4:
                    cell_texts = []
                    for cell in cells:
                        text = await cell.inner_text()
                        cell_texts.append(text.strip())
                    
                    record = {
                        "name": cell_texts[0] if len(cell_texts) > 0 else "",
                        "party_type": cell_texts[1] if len(cell_texts) > 1 else "",
                        "case_number": cell_texts[2] if len(cell_texts) > 2 else "",
                        "case_description": cell_texts[3] if len(cell_texts) > 3 else "",
                        "filing_date": cell_texts[4] if len(cell_texts) > 4 else "",
                        "case_type": cell_texts[5] if len(cell_texts) > 5 else "",
                        "status": cell_texts[6] if len(cell_texts) > 6 else "",
                    }
                    results.append(record)
            except Exception as e:
                logger.warning(f"Error parsing row: {e}")
                continue
        
        # If no grid rows found, try getting page content for debugging
        if not results:
            # Try to get any visible text content
            content = await page.inner_text('body')
            # Check if there's an error or no results message
            if 'no results' in content.lower() or 'no records' in content.lower():
                return {"found": False, "message": "No records found", "count": 0, "results": []}
            
            # Try to capture the network response directly
            logger.info("No grid rows found, attempting network intercept approach")
            
            # Reload with network interception
            api_data = []
            
            async def handle_response(response):
                if "/api/participants/search" in response.url:
                    try:
                        body = await response.json()
                        api_data.append(body)
                        logger.info(f"Intercepted API response: {json.dumps(body)[:500]}")
                    except:
                        pass
            
            page.on("response", handle_response)
            await page.goto(search_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(3)
            
            if api_data:
                # Parse the intercepted API response
                for data in api_data:
                    items = data.get("items", data.get("results", []))
                    if isinstance(items, list):
                        for item in items[:max_results]:
                            results.append({
                                "name": item.get("fullName", item.get("name", "")),
                                "party_type": item.get("partyType", ""),
                                "case_number": item.get("caseId", ""),
                                "case_description": item.get("caseDesc", ""),
                                "filing_date": item.get("caseFilingDate", ""),
                                "case_type": item.get("caseType", ""),
                                "status": item.get("statusDesc", item.get("status", "")),
                            })
                    
                    paging = data.get("paging", {})
                    if paging:
                        return {
                            "found": len(results) > 0,
                            "count": len(results),
                            "total": paging.get("totalRecords", len(results)),
                            "results": results,
                            "source": "arcourts_api"
                        }
        
        return {
            "found": len(results) > 0,
            "count": len(results),
            "results": results,
            "source": "arcourts_scrape"
        }
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if page:
            await page.close()
        if context:
            await context.close()

@app.get("/search/case")
async def search_case(
    case_number: str = Query(..., min_length=3),
):
    """Look up a specific case by case number."""
    context = None
    page = None
    try:
        context = await create_context()
        page = await context.new_page()
        
        # Navigate directly to case page
        case_url = f"{ARCOURTS_BASE}/case/{case_number}"
        logger.info(f"Navigating to case: {case_url}")
        
        await page.goto(case_url, wait_until="networkidle", timeout=30000)
        await asyncio.sleep(2)
        
        # Extract case details from the page
        content = await page.inner_text('body')
        
        return {
            "case_number": case_number,
            "content": content[:5000],
            "source": "arcourts"
        }
        
    except Exception as e:
        logger.error(f"Case lookup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if page:
            await page.close()
        if context:
            await context.close()

@app.on_event("shutdown")
async def shutdown():
    global _browser, _playwright
    if _browser:
        await _browser.close()
    if _playwright:
        await _playwright.stop()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
