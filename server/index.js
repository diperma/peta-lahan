/**
 * Backend Proxy Server for Bhumi Scraper
 * Proxies WMS requests to bhumi.atrbpn.go.id to avoid CORS.
 */
import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3001;

const BHUMI_WMS_BASE = 'https://bhumi.atrbpn.go.id/expapi/bhumigeos/umum/wms';
const PETA_GUDANG_BASE = 'https://peta-gudang.vercel.app/api/map/markers';

// Allow requests from Vite dev server and GitHub Pages
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    /\.github\.io$/,
  ],
}));

// Keep-alive agent — high concurrency to avoid queuing tile requests
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,        // allow many concurrent connections (Leaflet fires dozens at once)
  maxFreeSockets: 10,
  timeout: 15000,        // 15s socket idle timeout
});

/**
 * Proxy a WMS request to Bhumi using Node's https module.
 * Streams directly to the client and aborts if the client disconnects.
 */
function proxyWmsRequest(req, res) {
  const queryString = new URLSearchParams(req.query).toString();
  const targetUrl = `${BHUMI_WMS_BASE}?${queryString}`;
  const url = new URL(targetUrl);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'GET',
    agent: agent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/png, image/*, application/json, */*',
      'Referer': 'https://bhumi.atrbpn.go.id/',
      'Origin': 'https://bhumi.atrbpn.go.id',
    },
    timeout: 15000,       // 15s per request max
  };

  const proxyReq = https.request(options, (proxyRes) => {
    // Forward status and content type
    res.status(proxyRes.statusCode);
    if (proxyRes.headers['content-type']) {
      res.set('Content-Type', proxyRes.headers['content-type']);
    }
    res.set('Cache-Control', 'public, max-age=3600');

    // Stream response directly
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', detail: error.message });
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: 'Upstream timeout' });
    }
  });

  // CRITICAL: Abort the upstream request if the browser cancels (e.g. user pans/zooms away)
  req.on('close', () => {
    if (!proxyReq.destroyed) {
      proxyReq.destroy();
    }
  });

  proxyReq.end();
}

/**
 * Proxy a request to Peta Gudang API using Node's https module.
 */
function proxyPetaGudangRequest(req, res) {
  const queryString = new URLSearchParams(req.query).toString();
  const targetUrl = `${PETA_GUDANG_BASE}?${queryString}`;
  const url = new URL(targetUrl);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'GET',
    agent: agent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, */*',
    },
    timeout: 15000,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    if (proxyRes.headers['content-type']) {
      res.set('Content-Type', proxyRes.headers['content-type']);
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', detail: error.message });
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: 'Upstream timeout' });
    }
  });

  req.on('close', () => {
    if (!proxyReq.destroyed) {
      proxyReq.destroy();
    }
  });

  proxyReq.end();
}

// --- Routes ---
app.get('/api/wms/tiles', proxyWmsRequest);
app.get('/api/wms/featureinfo', proxyWmsRequest);
app.get('/api/wms/legend', proxyWmsRequest);
app.get('/api/peta-gudang/markers', proxyPetaGudangRequest);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
export default app;

// Only listen locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Bhumi WMS proxy running on http://localhost:${PORT}`);
  });
}
