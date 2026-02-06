# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies (One-Time Setup)

```bash
# Install Node.js dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Install Python dependencies
pip install -r requirements.txt
```

## 2. Configure Paths

Create `.env` file from template:
```bash
copy .env.template .env
```

Edit `.env` and set your paths:
```env
SOURCE_DIR=C:\\Users\\Owner\\Documents\\jan-books-2026
OUTPUT_DIR=C:\\Users\\Owner\\Documents\\jan-books-2026-pdfs
```

## 3. Run Conversion

```bash
npm run convert
```

Wait for completion (20-30 minutes for 445 files).

## 4. Check Results

```bash
npm run analyze
```

## 5. Import to Mendeley (Optional)

Use the separate **Mendeley Upload Server** project:

```bash
cd C:\Users\Owner\.gemini\antigravity\scratch\mendeley_upload_server
python -m uvicorn main:app --reload
```

Open http://localhost:8000/static/index.html

Point to: `C:\Users\Owner\Documents\jan-books-2026-pdfs`

See `mendeley_upload_server/README.md` for setup details.

---

## Troubleshooting

**Browser won't launch?**
```bash
npx playwright install chromium
```

**Missing Python modules?**
```bash
pip install requests
```

**Need help?** See [README.md](./README.md) for detailed documentation.
