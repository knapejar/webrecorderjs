# WebRecorderJS

A simple API service that captures screenshots of websites with configurable delay after page load. Future versions will support video recording.

## Features

- Capture full-page screenshots of any website
- Configurable delay after page load before capture
- Returns PNG images
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
    "delay": 1000
}
```

- `url` (required): The website URL to capture
- `delay` (optional): Delay in milliseconds after page load before taking the screenshot (default: 0)

**Note:** The service automatically adds `recording=photo` parameter to the URL. This allows websites to detect when they are being recorded and adjust their behavior accordingly.

**Response:**
- Content-Type: `image/png`
- Body: PNG image data

**Example using curl:**
```bash
curl -X POST \
  http://localhost:3000/screenshot \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "delay": 1000
  }' \
  --output screenshot.png
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