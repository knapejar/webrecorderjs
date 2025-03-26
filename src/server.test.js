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
            });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('image/png');
        
        // Save the screenshot for verification
        const screenshotPath = path.join(__dirname, '../test-screenshot.png');
        fs.writeFileSync(screenshotPath, response.body);
        
        // Verify file exists and has content
        expect(fs.existsSync(screenshotPath)).toBe(true);
        expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
    }, 10000); // Increased timeout for the test
}); 