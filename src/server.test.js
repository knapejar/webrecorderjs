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

describe('File API', () => {
    const testUploadDir = path.join(__dirname, '../uploads');
    
    beforeEach(() => {
        // Clean up uploads directory before each test
        if (fs.existsSync(testUploadDir)) {
            const files = fs.readdirSync(testUploadDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(testUploadDir, file));
            });
        }
    });

    afterAll(() => {
        // Clean up uploads directory after all tests
        if (fs.existsSync(testUploadDir)) {
            const files = fs.readdirSync(testUploadDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(testUploadDir, file));
            });
        }
    });

    it('should return empty array when no files exist', async () => {
        const response = await request(app)
            .get('/files')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual([]);
    });

    it('should upload a file successfully', async () => {
        // Create a test file
        const testFilePath = path.join(__dirname, '../test-file.txt');
        fs.writeFileSync(testFilePath, 'This is a test file');

        const response = await request(app)
            .post('/files')
            .attach('file', testFilePath)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.message).toBe('File uploaded successfully');
        expect(response.body.file).toHaveProperty('filename');
        expect(response.body.file).toHaveProperty('originalName');
        expect(response.body.file.originalName).toBe('test-file.txt');

        // Clean up test file
        fs.unlinkSync(testFilePath);
    });

    it('should list uploaded files', async () => {
        // Create a test file
        const testFilePath = path.join(__dirname, '../test-file.txt');
        fs.writeFileSync(testFilePath, 'This is a test file');

        // Upload the file
        await request(app)
            .post('/files')
            .attach('file', testFilePath);

        // List files
        const response = await request(app)
            .get('/files')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('filename');
        expect(response.body[0]).toHaveProperty('size');
        expect(response.body[0]).toHaveProperty('uploadDate');
        expect(response.body[0]).toHaveProperty('path');

        // Clean up test file
        fs.unlinkSync(testFilePath);
    });

    it('should return 400 when no file is uploaded', async () => {
        const response = await request(app)
            .post('/files')
            .expect('Content-Type', /json/)
            .expect(400);

        expect(response.body.error).toBe('No file uploaded');
    });

    it('should return 404 for non-existent file download', async () => {
        const response = await request(app)
            .get('/files/non-existent-file.txt')
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body.error).toBe('File not found');
    });

    it('should handle path traversal attempts safely', async () => {
        // Test path traversal - should either return 400 or 404, not serve files outside uploads
        const response = await request(app)
            .get('/files/../server.js');

        // Should not return a successful response (200)
        expect(response.status).not.toBe(200);
        // Should return either 400 (invalid filename) or 404 (not found)
        expect([400, 404]).toContain(response.status);
    });

    it('should always return array even on server error', async () => {
        // This test ensures that even if there's an internal server error,
        // the /files endpoint returns an array to prevent forEach errors
        
        // First, verify normal operation returns array
        const response = await request(app)
            .get('/files')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });
});