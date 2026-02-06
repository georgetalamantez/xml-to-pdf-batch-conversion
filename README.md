# XML to PDF Batch Conversion

A complete toolkit for batch converting XML/HTML book files to PDF format and importing them into a Mendeley library.

## Overview

This project provides automated tools to:
1. **Convert** large collections of XML/HTML files to PDF format using Playwright
2. **Analyze** conversion results and identify missing or failed conversions
3. **Import** PDFs to Mendeley library via API
4. **Track** progress with detailed logging and statistics

### Project Stats (Last Run)
- **Total files**: 445 (443 XML, 2 HTML)
- **Successfully converted**: 442 files (99.3% success rate)
- **Output size**: 523.95 MB
- **Status**: Conversion complete, Mendeley import pending

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Scripts](#scripts)
6. [Mendeley Setup](#mendeley-setup)
7. [Troubleshooting](#troubleshooting)
8. [Project Structure](#project-structure)
9. [FAQ](#faq)

---

## Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   - Download: https://nodejs.org/
   - Verify installation: `node --version`

2. **Python** (v3.8 or higher)
   - Download: https://www.python.org/downloads/
   - Verify installation: `python --version`

3. **npm** (comes with Node.js, v9.0.0 or higher)
   - Verify installation: `npm --version`

4. **Git** (optional, for version control)
   - Download: https://git-scm.com/

### System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2-5GB free space for PDF outputs
- **Internet Connection**: Required for Mendeley API access

---

## Installation

### Step 1: Clone or Download This Project

If using Git:
```bash
git clone <repository-url>
cd xml-to-pdf-batch-conversion
```

Or download and extract the ZIP file to your desired location.

### Step 2: Install Node.js Dependencies

```bash
# Install Playwright and dependencies
npm install

# Install Playwright browsers (Chromium)
npx playwright install chromium
```

**Windows PowerShell users**: If you encounter execution policy errors, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 3: Install Python Dependencies

```bash
# Install Python packages
pip install -r requirements.txt
```

**Alternative**: If you're using a virtual environment (recommended):
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Configuration

### Step 1: Create Environment File

Copy the template and create your own `.env` file:

```bash
# Windows PowerShell
copy .env.template .env

# macOS/Linux/Git Bash
cp .env.template .env
```

### Step 2: Configure File Paths

Edit `.env` and update the paths to match your system:

```env
# Source directory containing XML/HTML files
SOURCE_DIR=C:\\Users\\YourUsername\\Documents\\your-books-folder

# Output directory for converted PDFs
OUTPUT_DIR=C:\\Users\\YourUsername\\Documents\\your-books-pdfs
```

**Important**: 
- Use double backslashes (`\\`) for Windows paths
- Or use forward slashes (`/`) which work on all platforms
- Ensure directories exist or will be created

### Step 3: Configure Mendeley Credentials

See [Mendeley Setup](#mendeley-setup) section below for detailed instructions.

---

## Usage

### 1. Convert XML/HTML to PDF

Run the conversion script:

```bash
npm run convert
```

**What happens**:
- Scans source directory for `.xml`, `.html`, `.htm` files
- Launches headless Chromium browser
- Converts each file to PDF with proper formatting
- Saves PDFs to output directory
- Generates conversion log with statistics

**Options** (edit `scripts/convert_to_pdf.js` or use environment variables):
- `BATCH_SIZE`: Number of files to process before browser refresh (default: 50)
- `PAGE_LOAD_TIMEOUT`: Max time to wait for page load in ms (default: 30000)
- `DELAY_BETWEEN_CONVERSIONS`: Delay between conversions in ms (default: 500)

**Expected output**:
```
=== XML/HTML to PDF Batch Converter ===

✓ Output directory ready: C:\Users\...\pdfs
Found 445 files to convert

Launching Chromium browser...

--- Processing Batch 1 (50 files) ---
✓ book1.xml -> PDF (1.23 MB)
Progress: 0.2% (1/445)
✓ book2.xml -> PDF (2.45 MB)
Progress: 0.4% (2/445)
...

=== Conversion Complete ===
Total files: 445
Successful: 442
Failed: 3
Success rate: 99.33%
Duration: 1234.56 seconds
```

### 2. Analyze Conversion Results

Check which files were successfully converted:

```bash
npm run analyze
```

**What happens**:
- Compares source files with generated PDFs
- Identifies missing conversions
- Selects test PDFs for validation
- Generates `mendeley_import_data.json`

**Expected output**:
```
Total PDFs: 442
Total source files: 445
Missing conversions: 3

Files not converted to PDF:
  - large_file.xml
  - corrupted_file.html
  - timeout_file.xml

Test PDFs selected for Mendeley validation:
  1. book001.pdf
  2. book002.pdf
  3. book003.pdf

Data saved to: C:\...\scratch\mendeley_import_data.json
```

### 3. Import to Mendeley

**Recommended**: Use the separate **Mendeley Upload Server** project for imports.

The conversion project focuses solely on XML/HTML → PDF conversion. For importing PDFs to Mendeley, use the companion `mendeley_upload_server` project located at:

```
C:\Users\Owner\.gemini\antigravity\scratch\mendeley_upload_server
```

**Why use the upload server?**
- Web-based UI for monitoring progress
- Background processing with FastAPI
- Real-time logging and status updates
- Better error handling and recovery
- Can process entire directories or single files

**Quick start with upload server**:
```bash
cd C:\Users\Owner\.gemini\antigravity\scratch\mendeley_upload_server
python -m uvicorn main:app --reload
```

Then open http://localhost:8000/static/index.html and point it to your PDFs folder:
```
C:\Users\Owner\Documents\jan-books-2026-pdfs
```

See the `mendeley_upload_server/README.md` for complete documentation.


---

## Scripts

### `scripts/convert_to_pdf.js`

**Main conversion script** using Playwright.

**Features**:
- Batch processing to manage memory
- Configurable timeouts and delays
- Progress tracking
- Error handling and logging
- Statistics generation

**Direct usage**:
```bash
node scripts/convert_to_pdf.js
```

### `scripts/analyze_pdfs.py`

**Analyzes conversion results**.

**Features**:
- Compares source files vs PDFs
- Identifies missing conversions
- Prepares test data for Mendeley import
- Generates JSON output for programmatic access

**Direct usage**:
```bash
python scripts/analyze_pdfs.py
```

### Mendeley Import

**For importing PDFs to Mendeley**, use the separate `mendeley_upload_server` project:

**Location**: `C:\Users\Owner\.gemini\antigravity\scratch\mendeley_upload_server`

**Features**:
- Web-based UI with real-time progress
- FastAPI backend with background processing
- OAuth2 authentication
- Document creation and file upload
- Rate limiting protection
- Comprehensive logging

**Quick start**:
```bash
cd C:\Users\Owner\.gemini\antigravity\scratch\mendeley_upload_server
python -m uvicorn main:app --reload
# Open http://localhost:8000/static/index.html
```

---

## Mendeley Import Setup

**Note**: Mendeley import is handled by the separate `mendeley_upload_server` project.

This conversion project focuses solely on XML/HTML → PDF conversion. For complete Mendeley integration setup, see:

```
C:\Users\Owner\.gemini\antigravity\scratch\mendeley_upload_server\README.md
```

### Quick Overview

1. **Create Mendeley Developer Application** at https://dev.mendeley.com/myapps.html
2. **Configure credentials** in `mendeley_upload_server/.env`
3. **Run the upload server** and use the web UI to import PDFs

For detailed instructions, consult the upload server's documentation.

### Step 2: Get Refresh Token

**Option A: Using the debug script**

1. Update `.env` with your Client ID and Secret
2. Run the debug script:
   ```bash
   python scripts/debug_mendeley.py
   ```
3. Open the generated URL in your browser
4. Authorize the application
5. Copy the authorization code from the redirect URL
6. Exchange code for refresh token (see script output)

**Option B: Manual OAuth flow**

1. Build authorization URL:
   ```
   https://api.mendeley.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:8585/callback&response_type=code&scope=all
   ```

2. Open URL in browser and authorize

3. Get authorization code from redirect URL:
   ```
   http://localhost:8585/callback?code=AUTHORIZATION_CODE
   ```

4. Exchange for tokens using curl or Postman:
   ```bash
   curl -X POST https://api.mendeley.com/oauth/token \
     -d "grant_type=authorization_code" \
     -d "code=AUTHORIZATION_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:8585/callback"
   ```

5. Save the `refresh_token` from response

### Step 3: Update Environment File

Add credentials to `.env`:

```env
MENDELEY_CLIENT_ID=your_client_id_here
MENDELEY_CLIENT_SECRET=your_client_secret_here
MENDELEY_REFRESH_TOKEN=your_refresh_token_here
```

### Step 4: Update Import Script

Edit `scripts/import_pdfs.py` to use environment variables:

```python
import os
from dotenv import load_dotenv

load_dotenv()

MENDELEY_CLIENT_ID = os.getenv('MENDELEY_CLIENT_ID')
MENDELEY_CLIENT_SECRET = os.getenv('MENDELEY_CLIENT_SECRET')
MENDELEY_REFRESH_TOKEN = os.getenv('MENDELEY_REFRESH_TOKEN')
```

**Note**: You'll need to install `python-dotenv`:
```bash
pip install python-dotenv
```

---

## Troubleshooting

### Conversion Issues

#### Error: "Timeout waiting for page load"

**Cause**: Large files or slow rendering
**Solution**:
- Increase `PAGE_LOAD_TIMEOUT` in `.env`
- Reduce `BATCH_SIZE` for large files
- Check if file is corrupted

#### Error: "Failed to launch browser"

**Cause**: Playwright browsers not installed
**Solution**:
```bash
npx playwright install chromium
```

#### PDFs are blank or incomplete

**Cause**: JavaScript or CSS not fully loaded
**Solution**:
- Increase `PAGE_LOAD_TIMEOUT`
- Check source file validity
- Try converting manually with browser

### Mendeley Import Issues

#### Error: "Authentication Failed"

**Cause**: Invalid or expired credentials
**Solution**:
- Verify Client ID and Secret
- Regenerate refresh token
- Check redirect URI matches app settings

#### Error: "Rate limited"

**Cause**: Too many API requests
**Solution**:
- Script handles this automatically with retries
- Increase `DELAY_BETWEEN_CONVERSIONS`
- Check Mendeley API limits

#### Files import but don't appear in library

**Cause**: Sync delay or filter settings
**Solution**:
- Wait a few minutes for sync
- Refresh Mendeley application
- Check library filters (show "All Documents")

### Python Issues

#### "Module not found" errors

**Solution**:
```bash
pip install -r requirements.txt
```

#### Virtual environment not activating

**Windows PowerShell**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
venv\Scripts\activate
```

### General Issues

#### Out of memory errors

**Solution**:
- Reduce `BATCH_SIZE`
- Close other applications
- Process files in multiple runs

#### Disk space errors

**Solution**:
- Check available space (need 2-5GB)
- Clean up temporary files
- Change output directory

---

## Project Structure

```
xml-to-pdf-batch-conversion/
├── scripts/
│   ├── convert_to_pdf.js     # Main conversion script
│   └── analyze_pdfs.py       # Conversion analysis
├── docs/
│   └── (additional documentation)
├── package.json              # Node.js dependencies
├── requirements.txt          # Python dependencies
├── .env.template             # Environment configuration template
├── .env                      # Your environment config (create this)
├── .gitignore                # Git ignore rules
├── README.md                 # This file
└── QUICKSTART.md             # Quick start guide

Related Projects:
├── ../mendeley_upload_server/  # Separate: Web-based Mendeley import server
```

---

## FAQ

### Q: How long does conversion take?

**A**: Approximately 2-3 seconds per file on average. For 445 files, expect 20-30 minutes.

### Q: Can I pause and resume conversion?

**A**: Yes. The script skips already-converted files (checks if PDF exists). Just re-run the script.

### Q: What file formats are supported?

**A**: `.xml`, `.html`, and `.htm` files. The script can be extended for other formats.

### Q: Are original files deleted?

**A**: **No**. Original files are never modified or deleted. PDFs are saved to a separate directory.

### Q: Can I customize PDF layout?

**A**: Yes. Edit the `page.pdf()` options in `convert_to_pdf.js`:
```javascript
await page.pdf({
    path: fileInfo.output,
    format: 'A4',        // Change to 'Letter', 'Legal', etc.
    printBackground: true,
    margin: {
        top: '20mm',     // Adjust margins
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
    },
});
```

### Q: How do I handle failed conversions?

**A**: 
1. Check `conversion-log.json` for error details
2. Try converting failed files individually
3. Check if files are corrupted
4. Increase timeout for large files

### Q: Can I run this on a server?

**A**: Yes. Install all dependencies and run headlessly. Ensure Chromium browser can run in your server environment.

### Q: Is this safe for my Mendeley library?

**A**: Yes. The script only creates new documents and uploads files. It doesn't modify or delete existing library items.

### Q: How do I track what's been imported?

**A**: The import script logs each successful import. You can also check your Mendeley library directly.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## License

MIT License - feel free to use and modify for your needs.

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [FAQ](#faq)
3. Check Playwright docs: https://playwright.dev/
4. Check Mendeley API docs: https://dev.mendeley.com/

---

## Acknowledgments

- Built with [Playwright](https://playwright.dev/) for browser automation
- Uses [Mendeley API](https://dev.mendeley.com/) for library integration
- Python [Requests](https://requests.readthedocs.io/) library for HTTP

---

## Version History

### v1.0.0 (2026-02-05)
- Initial release
- Batch XML/HTML to PDF conversion
- Mendeley API integration
- Progress tracking and logging
- Comprehensive documentation
