/**
 * SAMPADA BANDRE PORTFOLIO — LOCAL FULL-STACK DEV SERVER
 * Runs both static portfolio files AND serverless /api/track & /api/analytics endpoints.
 * Pure Node.js: Zero external dependencies required!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');

// Ensure data directory and visits file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(VISITS_FILE)) {
  fs.writeFileSync(VISITS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Helper: Convert country code to flag emoji
function countryCodeToFlag(code) {
  if (!code || code.length !== 2 || code === 'XX') return '🌐';
  const cps = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...cps);
}

// Helper: Fetch public geo information if testing on localhost
async function getGeoForIP(clientIp) {
  try {
    const isLocal = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
    const queryUrl = isLocal ? 'https://ipapi.co/json/' : `https://ipapi.co/${clientIp}/json/`;

    const res = await fetch(queryUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip || clientIp,
        city: data.city || 'Nagpur',
        region: data.region || 'Maharashtra',
        country: data.country_name || 'India',
        country_code: data.country_code || 'IN',
        latitude: data.latitude || 21.1458,
        longitude: data.longitude || 79.0882
      };
    }
  } catch (err) {
    // Quietly fallback
  }

  return {
    ip: clientIp || '103.112.214.50',
    city: 'Nagpur',
    region: 'Maharashtra',
    country: 'India',
    country_code: 'IN',
    latitude: 21.1458,
    longitude: 79.0882
  };
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-supabase-url, x-supabase-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // -------------------------------------------------------------
  // API ROUTE 1: /api/track (Records a new visit)
  // -------------------------------------------------------------
  if (pathname === '/api/track' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const body = bodyData ? JSON.parse(bodyData) : {};

        // Extract client IP
        const rawIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                      req.headers['x-real-ip'] ||
                      req.socket.remoteAddress || '127.0.0.1';

        // Get Geo info (handles local fallback smartly)
        const geo = await getGeoForIP(rawIp);

        const newVisit = {
          id: 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          created_at: new Date().toISOString(),
          ip: geo.ip,
          city: body.city || geo.city,
          region: body.region || geo.region,
          country: body.country || geo.country,
          country_code: (body.countryCode || geo.country_code).toUpperCase(),
          latitude: body.latitude || geo.latitude,
          longitude: body.longitude || geo.longitude,
          device: body.device || 'Desktop',
          browser: body.browser || 'Chrome',
          os: body.os || 'Windows 11',
          screen: body.screen || '1920x1080',
          page: body.page || '/',
          referrer: body.referrer || req.headers['referer'] || 'Direct',
          user_agent: req.headers['user-agent'] || ''
        };

        // Save visit to local visits.json
        let visits = [];
        try {
          if (fs.existsSync(VISITS_FILE)) {
            visits = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8') || '[]');
          }
        } catch {
          visits = [];
        }

        // Add to front of array
        visits.unshift(newVisit);
        // Keep max 500 records
        if (visits.length > 500) visits = visits.slice(0, 500);

        fs.writeFileSync(VISITS_FILE, JSON.stringify(visits, null, 2), 'utf8');
        console.log(`[Track] Visit logged: ${newVisit.ip} from ${newVisit.city}, ${newVisit.country} (${newVisit.device} - ${newVisit.browser})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Visit logged successfully', visit: newVisit }));
      } catch (err) {
        console.error('Error tracking visit:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 2: /api/analytics (Owner-only stats and visitor log)
  // -------------------------------------------------------------
  if (pathname === '/api/analytics') {
    const password = req.headers['x-admin-password'] ||
                     (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].replace('Bearer ', '').trim() : null) ||
                     parsedUrl.query.password;

    const masterPassword = process.env.ADMIN_PASSWORD || 'sampada@admin2026';

    if (!password || password !== masterPassword) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized: Invalid administrative credentials.' }));
    }

    try {
      let visits = [];
      if (fs.existsSync(VISITS_FILE)) {
        visits = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8') || '[]');
      }

      // Compute aggregated metrics
      const totalViews = visits.length;
      const uniqueIps = new Set();
      const countryMap = {};
      const deviceMap = { Desktop: 0, Mobile: 0, Tablet: 0, Other: 0 };
      const browserMap = {};
      const referrerMap = {};

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      let todayViews = 0;
      let weekViews = 0;

      visits.forEach(v => {
        if (v.ip) uniqueIps.add(v.ip);
        const vDate = new Date(v.created_at);
        if (vDate >= oneDayAgo) todayViews++;
        if (vDate >= sevenDaysAgo) weekViews++;

        const cCode = (v.country_code || 'IN').toUpperCase();
        const cName = v.country || 'India';
        if (!countryMap[cCode]) {
          countryMap[cCode] = { code: cCode, name: cName, count: 0, flag: countryCodeToFlag(cCode) };
        }
        countryMap[cCode].count++;

        const dev = v.device || 'Desktop';
        if (deviceMap[dev] !== undefined) deviceMap[dev]++;
        else deviceMap.Other++;

        const br = v.browser || 'Other';
        browserMap[br] = (browserMap[br] || 0) + 1;

        let ref = v.referrer || 'Direct';
        try {
          if (ref.startsWith('http')) ref = new URL(ref).hostname.replace(/^www\./, '');
        } catch {}
        referrerMap[ref] = (referrerMap[ref] || 0) + 1;
      });

      const countryStats = Object.values(countryMap).sort((a, b) => b.count - a.count);
      const topCountry = countryStats[0] || { name: 'India', count: totalViews, flag: '🇮🇳' };

      const responsePayload = {
        success: true,
        data: {
          metrics: {
            totalViews,
            uniqueVisitors: uniqueIps.size,
            todayViews,
            weekViews,
            topCountry
          },
          countryStats,
          deviceStats: deviceMap,
          browserStats: browserMap,
          referrerStats: referrerMap,
          recentVisits: visits
        }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(responsePayload));
    } catch (err) {
      console.error('Analytics error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // -------------------------------------------------------------
  // STATIC FILE SERVING
  // -------------------------------------------------------------
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // If path has no extension and file exists as .html (cleanUrls)
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`✨ SAMPADA'S PORTFOLIO & TELEMETRY SERVER RUNNING ✨`);
  console.log(`🔗 Local URL: http://localhost:${PORT}/`);
  console.log(`🛡️  Owner Portal: http://localhost:${PORT}/#section-owner`);
  console.log(`🚀 API Endpoints Active: /api/track & /api/analytics`);
  console.log(`======================================================\n`);
});
