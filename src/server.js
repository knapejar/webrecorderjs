const express = require('express');
const puppeteer = require('puppeteer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

async function captureScreenshot(url, delay = 0) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Add recording parameter to URL
        const urlWithRecording = new URL(url);
        urlWithRecording.searchParams.set('recording', 'photo');
        
        await page.goto(urlWithRecording.toString(), { waitUntil: 'networkidle0' });
        
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const screenshot = await page.screenshot({
            fullPage: true,
            type: 'png'
        });
        
        return screenshot;
    } finally {
        await browser.close();
    }
}

app.post('/screenshot', async (req, res) => {
    try {
        const { url, delay } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const screenshot = await captureScreenshot(url, parseInt(delay) || 0);
        
        res.setHeader('Content-Type', 'image/png');
        res.send(screenshot);
    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ error: 'Failed to capture screenshot' });
    }
});

// Only start the server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app; 