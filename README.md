# WebRecorderJS

A simple API service that captures screenshots of websites with configurable delay after page load, and provides file upload/management capabilities. Future versions will support video recording.

## Features

- Capture full-page screenshots of any website
- Configurable delay after page load before capture
- Returns PNG images
- File upload and management API
- Fully containerized with Docker
- Automatically adds `recording=photo` parameter to URLs for site detection

## Installation

### Using npm

```bash
npm install
npm start
```

### Using Docker

```bash
docker build -t webrecorderjs .
docker run -p 3000:3000 webrecorderjs
```

## API Usage

### Capture Screenshot

**Endpoint:** `POST /screenshot`

**Request Body:**
```json
{
    "url": "https://example.com",
    "delay": 1000,
    "width": 940,
    "height": 720
}
```

- `url` (required): The website URL to capture
- `delay` (optional): Delay in milliseconds after page load before taking the screenshot (default: 0)
- `width` (optional): Screenshot width (default: 940)
- `height` (optional): Screenshot height (default: 720)

**Note:** The service automatically adds `recording=photo` parameter to the URL. This allows websites to detect when they are being recorded and adjust their behavior accordingly.

**Response:**
- Content-Type: `image/png`
- Body: PNG image data

### File Management

#### List Files
**Endpoint:** `GET /files`

Returns an array of uploaded files.

**Response:**
```json
[
  {
    "filename": "example.txt",
    "size": 1024,
    "uploadDate": "2023-01-01T00:00:00.000Z",
    "path": "/files/example.txt"
  }
]
```

#### Upload File
**Endpoint:** `POST /files`

Upload a file using multipart/form-data.

**Form Data:**
- `file`: File to upload

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "filename": "generated-filename",
    "originalName": "original-filename.txt",
    "size": 1024,
    "uploadDate": "2023-01-01T00:00:00.000Z",
    "path": "/files/generated-filename"
  }
}
```

#### Download File
**Endpoint:** `GET /files/:filename`

Download or serve a previously uploaded file.

**Example using curl:**
```bash
# Capture screenshot
curl -X POST \
  http://localhost:3000/screenshot \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "delay": 1000
  }' \
  --output screenshot.png

# Upload file
curl -X POST \
  http://localhost:3000/files \
  -F "file=@example.txt"

# List files
curl http://localhost:3000/files
```

## Development

### Running Tests

```bash
npm test
```

### Environment Variables

- `PORT`: Server port (default: 3000)

## License

MIT 