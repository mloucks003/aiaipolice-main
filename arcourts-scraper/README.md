# ARCaseNet Scraper Microservice

Playwright-based scraper for Arkansas court records (caseinfo.arcourts.gov).
Runs headless Chrome to search the ARCaseNet system and returns structured JSON.

## Deploy to Railway

1. Create a new Railway project
2. Connect this directory as a service
3. Railway will auto-detect the Dockerfile
4. Set the PORT env var (Railway does this automatically)

## API Endpoints

- `GET /health` — Health check
- `GET /search/participant?last_name=SMITH&first_name=JOHN` — Search by name
- `GET /search/case?case_number=60CR-25-4821` — Look up specific case

## Local Development

```bash
pip install -r requirements.txt
playwright install chromium
python server.py
```

## Connect to Main App

Set `ARCOURTS_SCRAPER_URL` env var on your Heroku app:
```bash
heroku config:set ARCOURTS_SCRAPER_URL=https://your-railway-url.up.railway.app
```
