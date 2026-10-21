/**
 * Vercel Serverless Function: /api/track
 * Logs visitor metadata (IP, Geo-location, Device, Browser, Referrer, Session) to Supabase.
 * Enforces server-side security, metadata sanitation, and graceful error handling.
 */

// Helper to parse incoming request body safely
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

// Server-side User-Agent Parser for Browser, OS, Device category, and Model
function parseUserAgent(ua) {
  if (!ua) {
    return {
      browser: 'Unknown',
      browserVersion: 'Unknown',
      os: 'Unknown',
      device: 'Desktop',
      deviceModel: 'Unknown'
    };
  }

  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  let deviceModel = 'Unknown';

  // Device category detection
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobi|iphone|ipod|android|blackberry|iemobile/i.test(ua)) {
    device = 'Mobile';
  } else {
    device = 'Desktop';
  }

  // Device model (only if reliably exposed)
  if (/iphone/i.test(ua)) {
    deviceModel = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    deviceModel = 'iPad';
  } else if (/macintosh/i.test(ua)) {
    deviceModel = 'Mac';
  } else if (/sm-[a-z0-9]+/i.test(ua)) {
    const match = ua.match(/sm-[a-z0-9]+/i);
    deviceModel = match ? `Samsung ${match[0].toUpperCase()}` : 'Samsung Galaxy';
  } else if (/pixel [0-9a-z ]+/i.test(ua)) {
    const match = ua.match(/pixel [0-9a-z ]+/i);
    deviceModel = match ? match[0] : 'Google Pixel';
  }

  // OS Detection
  if (/windows nt 10\.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.2/i.test(ua)) os = 'Windows 8';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows phone/i.test(ua)) os = 'Windows Phone';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os x ([0-9_]+)/i.test(ua)) {
    const ver = ua.match(/mac os x ([0-9_]+)/i)?.[1]?.replace(/_/g, '.') || '';
    os = ver ? `macOS ${ver}` : 'macOS';
  } else if (/cros/i.test(ua)) os = 'ChromeOS';
  else if (/iphone|ipad|ipod/i.test(ua)) {
    const ver = ua.match(/os ([0-9_]+) like mac os/i)?.[1]?.replace(/_/g, '.') || '';
    os = ver ? `iOS ${ver}` : 'iOS';
  } else if (/android ([0-9.]+)/i.test(ua)) {
    const ver = ua.match(/android ([0-9.]+)/i)?.[1] || '';
    os = ver ? `Android ${ver}` : 'Android';
  } else if (/linux/i.test(ua)) os = 'Linux';

  // Browser Detection & Version
  if (/edg\/([0-9.]+)/i.test(ua)) {
    browser = 'Edge';
    browserVersion = ua.match(/edg\/([0-9.]+)/i)?.[1] || 'Unknown';
  } else if (/opr\/([0-9.]+)|opera/i.test(ua)) {
    browser = 'Opera';
    browserVersion = ua.match(/opr\/([0-9.]+)/i)?.[1] || 'Unknown';
  } else if (/chrome\/([0-9.]+)|crios\/([0-9.]+)/i.test(ua)) {
    browser = 'Chrome';
    browserVersion = (ua.match(/chrome\/([0-9.]+)/i) || ua.match(/crios\/([0-9.]+)/i))?.[1] || 'Unknown';
  } else if (/firefox\/([0-9.]+)|fxios\/([0-9.]+)/i.test(ua)) {
    browser = 'Firefox';
    browserVersion = (ua.match(/firefox\/([0-9.]+)/i) || ua.match(/fxios\/([0-9.]+)/i))?.[1] || 'Unknown';
  } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
    browser = 'Safari';
    browserVersion = ua.match(/version\/([0-9.]+).*safari/i)?.[1] || 'Unknown';
  }

  // Shorten version to major.minor if very long
  if (browserVersion !== 'Unknown') {
    const parts = browserVersion.split('.');
    if (parts.length > 2) {
      browserVersion = parts.slice(0, 2).join('.');
    }
  }

  return { browser, browserVersion, os, device, deviceModel };
}

// Clean and sanitize string inputs
function cleanStr(val, maxLen = 250, fallback = 'Unknown') {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await getRequestBody(req);

    // 1. Skip if marked as owner/admin mode
    if (body.ignore === true || body.isOwner === true) {
      return res.status(200).json({ success: true, message: 'Owner visit excluded from analytics' });
    }

    // 2. Extract public IP address securely on the server
    const forwarded = req.headers['x-forwarded-for'];
    let ip = forwarded
      ? forwarded.split(',')[0].trim()
      : req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';

    // Strip IPv6-mapped IPv4 prefix if present
    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    // 3. Extract Geolocation from Vercel Edge Headers
    const country = req.headers['x-vercel-ip-country']
      ? cleanStr(req.headers['x-vercel-ip-country'], 100, 'Unknown')
      : cleanStr(body.country, 100, 'Unknown');

    const countryCode = (
      req.headers['x-vercel-ip-country'] ||
      body.countryCode ||
      'XX'
    ).toUpperCase().slice(0, 2);

    const region = req.headers['x-vercel-ip-country-region']
      ? cleanStr(req.headers['x-vercel-ip-country-region'], 100, 'Unknown')
      : cleanStr(body.region, 100, 'Unknown');

    let city = 'Unknown';
    if (req.headers['x-vercel-ip-city']) {
      try {
        city = decodeURIComponent(req.headers['x-vercel-ip-city']);
      } catch {
        city = req.headers['x-vercel-ip-city'];
      }
    } else if (body.city) {
      city = cleanStr(body.city, 100, 'Unknown');
    }

    const latitude = parseFloat(req.headers['x-vercel-ip-latitude'] || body.latitude) || null;
    const longitude = parseFloat(req.headers['x-vercel-ip-longitude'] || body.longitude) || null;

    // 4. Parse User Agent & Technical Metadata on Server
    const userAgent = req.headers['user-agent'] || body.userAgent || '';
    const uaInfo = parseUserAgent(userAgent);

    const device = body.device && body.device !== 'Unknown' ? cleanStr(body.device, 50, uaInfo.device) : uaInfo.device;
    const deviceModel = uaInfo.deviceModel;
    const browser = body.browser && body.browser !== 'Unknown' ? cleanStr(body.browser, 100, uaInfo.browser) : uaInfo.browser;
    const browserVersion = uaInfo.browserVersion;
    const os = body.os && body.os !== 'Unknown' ? cleanStr(body.os, 100, uaInfo.os) : uaInfo.os;
    const screen = cleanStr(body.screen, 50, 'Unknown');
    const page = cleanStr(body.page, 200, '/');

    // Referrer parsing
    let rawRef = body.referrer || req.headers['referer'] || 'Direct';
    let referrer = 'Direct';
    if (rawRef && rawRef !== 'Direct') {
      try {
        if (rawRef.startsWith('http://') || rawRef.startsWith('https://')) {
          const parsedRef = new URL(rawRef);
          referrer = parsedRef.hostname.replace(/^www\./, '');
          if (parsedRef.pathname && parsedRef.pathname !== '/') {
            referrer += parsedRef.pathname.slice(0, 50);
          }
        } else {
          referrer = cleanStr(rawRef, 150, 'Direct');
        }
      } catch {
        referrer = cleanStr(rawRef, 150, 'Direct');
      }
    }

    // Session and Visitor Identity
    const sessionId = cleanStr(body.sessionId || body.session_id, 100, null);
    const visitorId = cleanStr(body.visitorId || body.visitor_id, 100, null);
    const isNewVisitor = body.isNewVisitor !== undefined ? Boolean(body.isNewVisitor) : (body.is_new_visitor !== undefined ? Boolean(body.is_new_visitor) : true);

    const visitRecord = {
      ip,
      city,
      region,
      country,
      country_code: countryCode,
      latitude,
      longitude,
      device,
      device_model: deviceModel,
      browser,
      browser_version: browserVersion,
      os,
      screen,
      page,
      referrer,
      session_id: sessionId,
      visitor_id: visitorId,
      is_new_visitor: isNewVisitor,
      user_agent: cleanStr(userAgent, 500, '')
    };

    // 5. Supabase Credentials from Server Environment Variables ONLY
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Do not block public visitors or log error in their browser console
      return res.status(200).json({
        success: true,
        message: 'Tracking captured (Supabase credentials not configured in Vercel environment)',
        visit: visitRecord
      });
    }

    // 6. Write Record to Supabase via REST API
    const supabaseEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/portfolio_visits`;
    const response = await fetch(supabaseEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(visitRecord),
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase insert failure:', errText);
      return res.status(500).json({ error: 'Database record failed' });
    }

    return res.status(200).json({ success: true, message: 'Visit logged successfully' });
  } catch (error) {
    console.error('Track API error:', error);
    // Return 200 so visitor's page is never broken
    return res.status(200).json({ success: false, error: 'Tracking skipped' });
  }
};
