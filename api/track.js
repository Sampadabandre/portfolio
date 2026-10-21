/**
 * Vercel Serverless Function: /api/track
 * Logs visitor metadata (IP, Geo-location, Device, Browser, Referrer) to Supabase.
 */

// Helper to parse incoming request body
async function getRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await getRequestBody(req);

    // Skip if marked as owner/admin ignore from client
    if (body.ignore === true || body.isOwner === true) {
      return res.status(200).json({ success: true, message: 'Owner visit ignored' });
    }

    // Extract real client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';

    // Extract Vercel Edge Geolocation Headers (provided natively by Vercel for free)
    // Fallback to client-provided geo info if testing on localhost
    const country = req.headers['x-vercel-ip-country'] || body.country || 'Unknown';
    const countryCode = (req.headers['x-vercel-ip-country'] || body.countryCode || 'XX').toUpperCase();
    const region = req.headers['x-vercel-ip-country-region'] || body.region || 'Unknown';
    const city = req.headers['x-vercel-ip-city']
      ? decodeURIComponent(req.headers['x-vercel-ip-city'])
      : body.city || 'Unknown';
    const latitude = parseFloat(req.headers['x-vercel-ip-latitude'] || body.latitude) || null;
    const longitude = parseFloat(req.headers['x-vercel-ip-longitude'] || body.longitude) || null;

    // Technical metadata
    const userAgent = req.headers['user-agent'] || body.userAgent || '';
    const device = body.device || 'Desktop';
    const browser = body.browser || 'Unknown';
    const os = body.os || 'Unknown';
    const screen = body.screen || 'Unknown';
    const page = body.page || '/';
    const referrer = body.referrer || req.headers['referer'] || 'Direct';

    const visitRecord = {
      ip,
      city,
      region,
      country,
      country_code: countryCode,
      latitude,
      longitude,
      device,
      browser,
      os,
      screen,
      page,
      referrer,
      user_agent: userAgent
    };

    // Supabase Credentials from Environment Variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase URL or Key not set in environment variables.');
      return res.status(200).json({
        success: true,
        message: 'Tracking captured (Supabase credentials not configured in Vercel environment)',
        visit: visitRecord
      });
    }

    // Insert record into Supabase via REST API
    const supabaseEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/portfolio_visits`;
    const response = await fetch(supabaseEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(visitRecord)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase insert error:', errText);
      return res.status(500).json({ error: 'Failed to record visit to database', details: errText });
    }

    return res.status(200).json({ success: true, message: 'Visit recorded successfully' });
  } catch (error) {
    console.error('Track API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
