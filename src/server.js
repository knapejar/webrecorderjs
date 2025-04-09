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

async function captureScreenshot(url, delay = 0, width = 940, height = 720) {
    const deviceScaleFactor = 4;
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor']
    });
    
    try {
        const page = await browser.newPage();
        
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
        await browser.close();
    }
}

app.post('/screenshot', async (req, res) => {
    try {
        const { url, delay, width, height } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const screenshot = await captureScreenshot(
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

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;