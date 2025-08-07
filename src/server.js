const express = require('express');
const puppeteer = require('puppeteer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const sharp = require('sharp');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Global browser instance and queue
let globalBrowser = null;
const requestQueue = [];
let isProcessingQueue = false;

async function initializeBrowser() {
    if (!globalBrowser) {
        console.log('Initializing browser...');
        globalBrowser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor']
        });
        console.log('Browser initialized successfully');
    }
    return globalBrowser;
}

async function processQueue() {
    if (isProcessingQueue || requestQueue.length === 0) {
        return;
    }
    
    isProcessingQueue = true;
    
    while (requestQueue.length > 0) {
        const { url, delay, width, height, resolve, reject } = requestQueue.shift();
        
        try {
            const screenshot = await captureScreenshotWithBrowser(url, delay, width, height);
            resolve(screenshot);
        } catch (error) {
            reject(error);
        }
    }
    
    isProcessingQueue = false;
}

function queueScreenshotRequest(url, delay = 0, width = 940, height = 720) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ url, delay, width, height, resolve, reject });
        processQueue();
    });
}

async function captureScreenshotWithBrowser(url, delay = 0, width = 940, height = 720) {
    const deviceScaleFactor = 4;
    
    // Ensure browser is initialized
    const browser = await initializeBrowser();
    
    // Create a new page for this request
    const page = await browser.newPage();
    
    try {
        // Set viewport size with 4x deviceScaleFactor for zoom
        await page.setViewport({
            width: parseInt(width),
            height: parseInt(height),
            deviceScaleFactor
        });
        
        // Add recording parameter to URL safely
        let urlWithRecording;
        try {
            urlWithRecording = new URL(url);
        } catch (e) {
            throw new Error('Invalid URL provided');
        }
        
        if (!urlWithRecording.searchParams.has('recording')) {
            urlWithRecording.searchParams.set('recording', 'photo');
        }
        
        console.log("urlWithRecording", urlWithRecording.toString());

        await page.goto(urlWithRecording.toString(), { waitUntil: 'networkidle0' });
        
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Capture full-page screenshot as a buffer
        let screenshot = await page.screenshot({
            fullPage: true,
            type: 'png',
            encoding: 'binary'
        });

        // Crop the screenshot if its height exceeds deviceScaleFactor * height
        const maxScreenshotHeight = deviceScaleFactor * height;
        const image = sharp(screenshot);
        const metadata = await image.metadata();
        if (metadata.height > maxScreenshotHeight) {
            screenshot = await image
                .extract({ left: 0, top: 0, width: metadata.width, height: maxScreenshotHeight })
                .toBuffer();
        }
        
        return screenshot;
    } finally {
        // Close the page but keep the browser open
        await page.close();
    }
}

app.post('/screenshot', async (req, res) => {
    try {
        const { url, delay, width, height } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const screenshot = await queueScreenshotRequest(
            url,
            parseInt(delay) || 0,
            parseInt(width) || 940,
            parseInt(height) || 720
        );
        
        res.setHeader('Content-Type', 'image/png');
        res.send(Buffer.from(screenshot));
    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ error: error.message || 'Failed to capture screenshot' });
    }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    if (globalBrowser) {
        await globalBrowser.close();
        console.log('Browser closed');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    if (globalBrowser) {
        await globalBrowser.close();
        console.log('Browser closed');
    }
    process.exit(0);
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    
    // Initialize browser when server starts
    initializeBrowser().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Browser is ready for screenshot requests');
        });
    }).catch(error => {
        console.error('Failed to initialize browser:', error);
        process.exit(1);
    });
}

module.exports = app;