const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * XML/HTML to PDF Batch Converter
 * 
 * Converts XML and HTML files to PDF format using Playwright's Chromium browser.
 * Designed for batch processing large collections of book files.
 */

// Configuration
const CONFIG = {
    sourceDir: process.env.SOURCE_DIR || 'C:\\Users\\Owner\\Documents\\jan-books-2026',
    outputDir: process.env.OUTPUT_DIR || 'C:\\Users\\Owner\\Documents\\jan-books-2026-pdfs',
    extensions: ['.xml', '.html', '.htm'],
    batchSize: 50, // Process in batches to avoid memory issues
    pageLoadTimeout: 30000, // 30 seconds per page
    delayBetweenConversions: 500, // 500ms delay between files
};

// Statistics tracking
const stats = {
    total: 0,
    successful: 0,
    failed: 0,
    startTime: null,
    endTime: null,
    errors: [],
};

/**
 * Create output directory if it doesn't exist
 */
async function ensureOutputDir() {
    try {
        await fs.mkdir(CONFIG.outputDir, { recursive: true });
        console.log(`✓ Output directory ready: ${CONFIG.outputDir}`);
    } catch (error) {
        console.error(`Failed to create output directory: ${error.message}`);
        throw error;
    }
}

/**
 * Get list of files to convert
 */
async function getFilesToConvert() {
    const files = await fs.readdir(CONFIG.sourceDir);
    const toConvert = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return CONFIG.extensions.includes(ext);
    });
    
    console.log(`Found ${toConvert.length} files to convert`);
    return toConvert.map(file => ({
        source: path.join(CONFIG.sourceDir, file),
        output: path.join(CONFIG.outputDir, file.replace(path.extname(file), '.pdf')),
        name: file,
    }));
}

/**
 * Convert a single file to PDF
 */
async function convertFileToPdf(browser, fileInfo) {
    const page = await browser.newPage();
    
    try {
        // Load the file
        const fileUrl = `file:///${fileInfo.source.replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { 
            waitUntil: 'networkidle',
            timeout: CONFIG.pageLoadTimeout 
        });
        
        // Generate PDF
        await page.pdf({
            path: fileInfo.output,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm',
            },
        });
        
        const outputStats = await fs.stat(fileInfo.output);
        console.log(`✓ ${fileInfo.name} -> PDF (${(outputStats.size / 1024 / 1024).toFixed(2)} MB)`);
        
        stats.successful++;
        return { success: true, file: fileInfo.name };
        
    } catch (error) {
        console.error(`✗ Failed to convert ${fileInfo.name}: ${error.message}`);
        stats.failed++;
        stats.errors.push({
            file: fileInfo.name,
            error: error.message,
        });
        return { success: false, file: fileInfo.name, error: error.message };
        
    } finally {
        await page.close();
    }
}

/**
 * Process files in batches
 */
async function processBatch(browser, files, batchIndex) {
    console.log(`\n--- Processing Batch ${batchIndex + 1} (${files.length} files) ---`);
    
    const results = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await convertFileToPdf(browser, file);
        results.push(result);
        
        // Progress indicator
        const progress = ((stats.successful + stats.failed) / stats.total * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${stats.successful + stats.failed}/${stats.total})`);
        
        // Delay between conversions to avoid overload
        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenConversions));
        }
    }
    
    return results;
}

/**
 * Save conversion log
 */
async function saveConversionLog() {
    const duration = (stats.endTime - stats.startTime) / 1000;
    const log = {
        timestamp: new Date().toISOString(),
        duration_seconds: duration,
        statistics: {
            total: stats.total,
            successful: stats.successful,
            failed: stats.failed,
            success_rate: ((stats.successful / stats.total) * 100).toFixed(2) + '%',
        },
        config: CONFIG,
        errors: stats.errors,
    };
    
    const logPath = path.join(CONFIG.outputDir, 'conversion-log.json');
    await fs.writeFile(logPath, JSON.stringify(log, null, 2));
    console.log(`\n✓ Conversion log saved: ${logPath}`);
}

/**
 * Main execution
 */
async function main() {
    console.log('=== XML/HTML to PDF Batch Converter ===\n');
    
    stats.startTime = Date.now();
    
    // Ensure output directory exists
    await ensureOutputDir();
    
    // Get files to convert
    const files = await getFilesToConvert();
    stats.total = files.length;
    
    if (stats.total === 0) {
        console.log('No files found to convert.');
        return;
    }
    
    // Launch browser
    console.log('\nLaunching Chromium browser...');
    const browser = await chromium.launch({
        headless: true,
    });
    
    try {
        // Process files in batches
        const batches = [];
        for (let i = 0; i < files.length; i += CONFIG.batchSize) {
            batches.push(files.slice(i, i + CONFIG.batchSize));
        }
        
        console.log(`\nProcessing ${files.length} files in ${batches.length} batches\n`);
        
        for (let i = 0; i < batches.length; i++) {
            await processBatch(browser, batches[i], i);
        }
        
    } finally {
        await browser.close();
    }
    
    stats.endTime = Date.now();
    
    // Save log
    await saveConversionLog();
    
    // Print summary
    const duration = (stats.endTime - stats.startTime) / 1000;
    console.log('\n=== Conversion Complete ===');
    console.log(`Total files: ${stats.total}`);
    console.log(`Successful: ${stats.successful}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Success rate: ${((stats.successful / stats.total) * 100).toFixed(2)}%`);
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Average: ${(duration / stats.total).toFixed(2)} seconds per file`);
    
    if (stats.failed > 0) {
        console.log('\n⚠ Failed files:');
        stats.errors.forEach(err => {
            console.log(`  - ${err.file}: ${err.error}`);
        });
    }
}

// Run the converter
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { convertFileToPdf, main };
