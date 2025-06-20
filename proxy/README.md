# VidShare CORS Proxy

A simple CORS proxy server to fetch Dropbox folder HTML without API tokens.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Test the proxy:
```bash
curl "http://localhost:3000/proxy?url=https://www.dropbox.com/scl/fo/..."
```

## Deploy to Netlify

1. Push this `proxy/` folder to a GitHub repository
2. Connect the repo to Netlify
3. Set build command: `npm install`
4. Set publish directory: `.`
5. Deploy!

## Usage in VidShare

Replace the old proxy URL:
```javascript
// Old (unreliable)
const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(folderUrl)}`;

// New (your own proxy)
const proxyUrl = `https://your-proxy.netlify.app/proxy?url=${encodeURIComponent(folderUrl)}`;
```

## Security Features

- Only allows Dropbox URLs
- Proper error handling
- Request logging
- Timeout protection (30s)
- CORS enabled for your frontend
