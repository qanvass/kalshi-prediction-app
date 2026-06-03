const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const KALSHI_API_HOST = 'external-api.kalshi.com';

const server = http.createServer((req, res) => {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, KALSHI-ACCESS-KEY, KALSHI-ACCESS-TIMESTAMP, KALSHI-ACCESS-SIGNATURE');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Route SportsGameOdds requests
    if (parsedUrl.pathname.startsWith('/api/sports')) {
        const handleSports = require('./api/sports.js');
        handleSports(req, res);
        return;
    }

    // Proxy API requests (Kalshi)
    if (parsedUrl.pathname.startsWith('/api/')) {
        // Strip /api prefix and append /trade-api/v2
        const targetPath = parsedUrl.pathname.replace(/^\/api/, '/trade-api/v2') + (parsedUrl.search || '');
        
        console.log(`[PROXY] ${req.method} ${req.url} -> https://${KALSHI_API_HOST}${targetPath}`);

        const proxyReq = https.request({
            host: KALSHI_API_HOST,
            path: targetPath,
            method: req.method,
            headers: {
                ...req.headers,
                host: KALSHI_API_HOST, // Crucial for SSL/SNI matching
            }
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error('[PROXY ERROR]', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
        });

        req.pipe(proxyReq);
        return;
    }

    // Serve KALSHI PREDICT html files
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html' || 
        parsedUrl.pathname === '/KALSHI%20PREDICT.html' || parsedUrl.pathname === '/KALSHI PREDICT.html' || 
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v2.html' || parsedUrl.pathname === '/KALSHI PREDICT v2.html' || 
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v3.html' || parsedUrl.pathname === '/KALSHI PREDICT v3.html' || 
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v4.html' || parsedUrl.pathname === '/KALSHI PREDICT v4.html' ||
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v5.html' || parsedUrl.pathname === '/KALSHI PREDICT v5.html' ||
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v6.html' || parsedUrl.pathname === '/KALSHI PREDICT v6.html' ||
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v7.html' || parsedUrl.pathname === '/KALSHI PREDICT v7.html' ||
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v8.html' || parsedUrl.pathname === '/KALSHI PREDICT v8.html' ||
        parsedUrl.pathname === '/KALSHI%20PREDICT%20v9.html' || parsedUrl.pathname === '/KALSHI PREDICT v9.html') {
        
        let fileToServe = 'index.html';
        if (parsedUrl.pathname.includes('v2')) fileToServe = 'KALSHI PREDICT v2.html';
        else if (parsedUrl.pathname.includes('v3')) fileToServe = 'KALSHI PREDICT v3.html';
        else if (parsedUrl.pathname.includes('v4')) fileToServe = 'KALSHI PREDICT v4.html';
        else if (parsedUrl.pathname.includes('v5')) fileToServe = 'KALSHI PREDICT v5.html';
        else if (parsedUrl.pathname.includes('v6')) fileToServe = 'KALSHI PREDICT v6.html';
        else if (parsedUrl.pathname.includes('v7')) fileToServe = 'KALSHI PREDICT v7.html';
        else if (parsedUrl.pathname.includes('v8')) fileToServe = 'KALSHI PREDICT v8.html';
        else if (parsedUrl.pathname.includes('v9')) fileToServe = 'KALSHI PREDICT v9.html';

        const filePath = path.join(__dirname, fileToServe);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Error loading ${fileToServe}`);
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`[SERVER] Kalshi Live API Proxy Server listening on http://localhost:${PORT}`);
});
