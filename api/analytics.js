/**
 * Vercel Serverless Function: /api/analytics
 * Owner-Only Protected Endpoint: Fetches visitor metrics, IP logs, geo-intelligence, and page stats.
 * Strictly enforces server-side authentication and secret isolation.
 */

const crypto = require('crypto');

// Timing-safe password comparison
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Convert 2-letter country code to flag emoji
function countryCodeToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2 || countryCode === 'XX') return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-password'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Owner Authentication Verification
  const providedPassword =
    req.headers['x-admin-password'] ||
    (req.headers['authorization']?.startsWith('Bearer ')
      ? req.headers['authorization'].replace('Bearer ', '').trim()
      : null) ||
    req.query.password;

  const envAdminPassword = process.env.ADMIN_PASSWORD;

  if (!envAdminPassword) {
    return res.status(500).json({
      error: 'Server Misconfigured',
      message: 'ADMIN_PASSWORD environment variable is not configured in Vercel. Please add ADMIN_PASSWORD in your Vercel Project Settings -> Environment Variables.'
    });
  }

  if (!providedPassword || !safeCompare(providedPassword, envAdminPassword)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid administrative password. Access restricted to portfolio owner only.'
    });
  }

  // 2. Validate Supabase Configuration
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({
      error: 'Database Credentials Missing',
      message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in Vercel Environment Variables. See supabase_schema.sql for database setup instructions.'
    });
  }

  try {
    // 3. Fetch visitor records from Supabase
    const limit = Math.min(parseInt(req.query.limit || '1000', 10), 2000);
    const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/portfolio_visits?select=*&order=created_at.desc&limit=${limit}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: 'Database query failed',
        message: 'Could not fetch records from Supabase. Ensure table "portfolio_visits" exists with correct schema.',
        details: errText
      });
    }

    const visits = await response.json();

    // 4. Compute Analytics & Telemetry Metrics
    const totalViews = visits.length;
    const uniqueVisitorsSet = new Set();
    const uniqueIpsSet = new Set();
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

    visits.forEach((v) => {
      // Unique tracking (visitor_id preferred, fallback to IP)
      if (v.visitor_id) {
        uniqueVisitorsSet.add(v.visitor_id);
      } else if (v.ip) {
        uniqueVisitorsSet.add(v.ip);
      }
      if (v.ip) uniqueIpsSet.add(v.ip);

      if (v.is_new_visitor === true) newVisitorsCount++;
      else if (v.is_new_visitor === false) returningVisitorsCount++;

      // Timeframe counts
      const visitDate = new Date(v.created_at);
      if (visitDate >= oneDayAgo) todayViews++;
      if (visitDate >= sevenDaysAgo) weekViews++;

      // Page breakdown
      const pageKey = v.page || '/';
      pageMap[pageKey] = (pageMap[pageKey] || 0) + 1;

      // Country breakdown
      const cCode = (v.country_code || 'XX').toUpperCase();
      const cName = v.country && v.country !== 'Unknown' ? v.country : 'Unknown Country';
      if (!countryMap[cCode]) {
        countryMap[cCode] = { code: cCode, name: cName, count: 0, flag: countryCodeToFlag(cCode) };
      }
      countryMap[cCode].count++;

      // City breakdown
      if (v.city && v.city !== 'Unknown') {
        const cityKey = `${v.city}, ${cName}`;
        cityMap[cityKey] = (cityMap[cityKey] || 0) + 1;
      }

      // Device category breakdown
      const dev = v.device || 'Desktop';
      if (deviceMap[dev] !== undefined) deviceMap[dev]++;
      else deviceMap.Unknown++;

      // Browser breakdown
      const br = v.browser || 'Unknown';
      browserMap[br] = (browserMap[br] || 0) + 1;

      // OS breakdown
      const os = v.os || 'Unknown';
      osMap[os] = (osMap[os] || 0) + 1;

      // Referrer breakdown
      let ref = v.referrer || 'Direct';
      try {
        if (ref.startsWith('http')) {
          const url = new URL(ref);
          ref = url.hostname.replace(/^www\./, '');
        }
      } catch {
        // keep ref as is
      }
      referrerMap[ref] = (referrerMap[ref] || 0) + 1;
    });

    // Sort Top Pages
    const topPages = Object.entries(pageMap)
      .map(([page, count]) => ({
        page,
        count,
        percent: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Sort Countries
    const countryStats = Object.values(countryMap)
      .map(c => ({
        ...c,
        percent: totalViews > 0 ? Math.round((c.count / totalViews) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const topCountry = countryStats.length > 0 ? countryStats[0] : { name: 'None yet', count: 0, flag: '🌐', percent: 0 };

    // Sort Cities
    const cityStats = Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalViews,
          uniqueVisitors: uniqueVisitorsSet.size,
          uniqueIps: uniqueIpsSet.size,
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
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
