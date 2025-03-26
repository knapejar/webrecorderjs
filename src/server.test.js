const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = require('./server');

describe('Screenshot API', () => {
    it('should capture screenshot of charts.test.esgrovia.cz after 1 second delay with recording parameter', async () => {
        const response = await request(app)
            .post('/screenshot')
            .send({
                url: 'https://charts.test.esgrovia.cz/',
                delay: 1000
            })
            .expect('Content-Type', /^image\/png/)
            .expect(200);

        // Save the screenshot for verification
        const screenshotPath = path.join(__dirname, '../test-screenshot.png');
        fs.writeFileSync(screenshotPath, response.body);
        
        // Verify file exists and has content
        expect(fs.existsSync(screenshotPath)).toBe(true);
        const stats = fs.statSync(screenshotPath);
        expect(stats.size).toBeGreaterThan(1000); // PNG files should be larger than 1KB

        // Verify PNG format by checking the file signature
        const fileBuffer = fs.readFileSync(screenshotPath);
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
        expect(fileBuffer.slice(0, 4)).toEqual(pngSignature);
    }, 10000);

    it('should handle custom width and height parameters', async () => {
        const response = await request(app)
            .post('/screenshot')
            .send({
                url: 'https://charts.test.esgrovia.cz/',
                width: 800,
                height: 600
            })
            .expect('Content-Type', /^image\/png/)
            .expect(200);

        // Save and verify file size
        const screenshotPath = path.join(__dirname, '../test-screenshot-custom.png');
        fs.writeFileSync(screenshotPath, response.body);
        const stats = fs.statSync(screenshotPath);
        expect(stats.size).toBeGreaterThan(1000);

        // Verify PNG format
        const fileBuffer = fs.readFileSync(screenshotPath);
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
        expect(fileBuffer.slice(0, 4)).toEqual(pngSignature);
    }, 10000);

    it('should handle URLs with existing query parameters', async () => {
        const response = await request(app)
            .post('/screenshot')
            .send({
                url: 'https://charts.test.esgrovia.cz/?existing=param',
                delay: 1000
            })
            .expect('Content-Type', /^image\/png/)
            .expect(200);

        // Save and verify file size
        const screenshotPath = path.join(__dirname, '../test-screenshot-params.png');
        fs.writeFileSync(screenshotPath, response.body);
        const stats = fs.statSync(screenshotPath);
        expect(stats.size).toBeGreaterThan(1000);

        // Verify PNG format
        const fileBuffer = fs.readFileSync(screenshotPath);
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
        expect(fileBuffer.slice(0, 4)).toEqual(pngSignature);
    }, 10000);
}); 