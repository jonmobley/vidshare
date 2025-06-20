const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Basic logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'VidShare CORS Proxy is running!',
        endpoints: {
            proxy: '/proxy?url=<URL_TO_FETCH>',
            health: '/'
        },
        example: '/proxy?url=https://www.dropbox.com/scl/fo/...'
    });
});

// Main proxy endpoint
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    
    // Validate URL parameter
    if (!targetUrl) {
        return res.status(400).json({
            error: 'Missing required parameter: url',
            usage: '/proxy?url=<URL_TO_FETCH>'
        });
    }

    // Basic URL validation
    try {
        new URL(targetUrl);
    } catch (error) {
        return res.status(400).json({
            error: 'Invalid URL format',
            provided: targetUrl
        });
    }

    // Optional: Restrict to Dropbox URLs for security
    if (!targetUrl.includes('dropbox.com')) {
        return res.status(403).json({
            error: 'Only Dropbox URLs are allowed',
            provided: targetUrl
        });
    }

    try {
        console.log(`Fetching: ${targetUrl}`);
        
        // Fetch the target URL
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 30000 // 30 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        console.log(`✅ Successfully fetched ${html.length} characters from ${targetUrl}`);
        
        // Return the HTML content
        res.json({
            contents: html,
            url: targetUrl,
            status: response.status,
            contentLength: html.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`❌ Error fetching ${targetUrl}:`, error.message);
        
        res.status(500).json({
            error: 'Failed to fetch URL',
            message: error.message,
            url: targetUrl,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 VidShare CORS Proxy running on http://localhost:${PORT}`);
    console.log(`📡 Usage: http://localhost:${PORT}/proxy?url=<DROPBOX_URL>`);
    console.log(`❤️  Ready to serve your VidShare app!`);
});
