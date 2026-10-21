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

        let finalCity = body.city || geo.city;
        const lat = parseFloat(body.latitude || geo.latitude);
        const lon = parseFloat(body.longitude || geo.longitude);

        // Accurate GPS coordinate match for Nagpur region (20.5 - 21.8 lat, 78.5 - 79.8 lon)
        if (lat >= 20.5 && lat <= 21.8 && lon >= 78.5 && lon <= 79.8) {
          finalCity = 'Nagpur';
        } else if (finalCity === 'Pune' && !body.latitude) {
          finalCity = 'Pune (ISP Gateway)';
        }

        const newVisit = {
          id: 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          created_at: new Date().toISOString(),
          ip: geo.ip,
          city: finalCity,
          region: body.region || geo.region,
          country: body.country || geo.country,
          country_code: (body.countryCode || geo.country_code).toUpperCase(),
          latitude: lat || null,
          longitude: lon || null,
          device: body.device || 'Desktop',
          device_model: body.deviceModel || 'Unknown',
          browser: body.browser || 'Chrome',
          browser_version: body.browserVersion || 'Unknown',
          os: body.os || 'Windows 11',
          screen: body.screen || '1920x1080',
          page: body.page || '/',
          referrer: body.referrer || req.headers['referer'] || 'Direct',
          session_id: body.sessionId || body.session_id || 'sess-local',
          visitor_id: body.visitorId || body.visitor_id || 'vis-local',
          is_new_visitor: body.isNewVisitor !== undefined ? Boolean(body.isNewVisitor) : true,
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
        console.log(`[Track] Visit logged: ${newVisit.ip} from ${newVisit.city}, ${newVisit.country} (${newVisit.device} - ${newVisit.browser}) - Page: ${newVisit.page}`);

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
      const uniqueVisitorsSet = new Set();
      const uniqueIps = new Set();
      const countryMap = {};
      const cityMap = {};
      const pageMap = {};
      const deviceMap = { Desktop: 0, Mobile: 0, Tablet: 0, Unknown: 0 };
      const browserMap = {};
      const osMap = {};
      const referrerMap = {};

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      let todayViews = 0;
      let weekViews = 0;
      let newVisitorsCount = 0;
      let returningVisitorsCount = 0;

      visits.forEach(v => {
        if (v.visitor_id) uniqueVisitorsSet.add(v.visitor_id);
        else if (v.ip) uniqueVisitorsSet.add(v.ip);

        if (v.ip) uniqueIps.add(v.ip);

        if (v.is_new_visitor === true) newVisitorsCount++;
        else if (v.is_new_visitor === false) returningVisitorsCount++;

        const vDate = new Date(v.created_at);
        if (vDate >= oneDayAgo) todayViews++;
        if (vDate >= sevenDaysAgo) weekViews++;

        const p = v.page || '/';
        pageMap[p] = (pageMap[p] || 0) + 1;

        const cCode = (v.country_code || 'IN').toUpperCase();
        const cName = v.country || 'India';
        if (!countryMap[cCode]) {
          countryMap[cCode] = { code: cCode, name: cName, count: 0, flag: countryCodeToFlag(cCode) };
        }
        countryMap[cCode].count++;

        if (v.city && v.city !== 'Unknown') {
          const cityKey = `${v.city}, ${cName}`;
          cityMap[cityKey] = (cityMap[cityKey] || 0) + 1;
        }

        const dev = v.device || 'Desktop';
        if (deviceMap[dev] !== undefined) deviceMap[dev]++;
        else deviceMap.Unknown++;

        const br = v.browser || 'Other';
        browserMap[br] = (browserMap[br] || 0) + 1;

        const os = v.os || 'Unknown';
        osMap[os] = (osMap[os] || 0) + 1;

        let ref = v.referrer || 'Direct';
        try {
          if (ref.startsWith('http')) ref = new URL(ref).hostname.replace(/^www\./, '');
        } catch {}
        referrerMap[ref] = (referrerMap[ref] || 0) + 1;
      });

      const countryStats = Object.values(countryMap).sort((a, b) => b.count - a.count);
      const topCountry = countryStats[0] || { name: 'India', count: totalViews, flag: '🇮🇳' };

      const topPages = Object.entries(pageMap)
        .map(([page, count]) => ({
          page,
          count,
          percent: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      const cityStats = Object.entries(cityMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const responsePayload = {
        success: true,
        data: {
          metrics: {
            totalViews,
            uniqueVisitors: uniqueVisitorsSet.size,
            uniqueIps: uniqueIps.size,
            todayViews,
            weekViews,
            topCountry,
            newVisitorsCount,
            returningVisitorsCount
          },
          topPages,
          countryStats,
          cityStats,
          deviceStats: deviceMap,
          browserStats: browserMap,
          osStats: osMap,
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
