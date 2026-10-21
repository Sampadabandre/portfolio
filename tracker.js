/**
 * Sampada Bandre Portfolio — Client-Side Visitor Tracker
 * Lightweight, non-intrusive analytics beacon.
 * Respects owner exclusion and deduplicates rapid reloads.
 */

(function () {
  'use strict';

  // 1. Owner Mode Check: If the owner excluded this device, do not track!
  if (localStorage.getItem('portfolio_owner_mode') === 'true') {
    console.log('[Analytics] Owner mode active on this browser — visit excluded from metrics.');
    return;
  }

  // 2. Session Deduplication Check (count 1 visit per 15 minutes per visitor session)
  const SESSION_KEY = 'portfolio_last_visit_ts';
  const lastVisit = sessionStorage.getItem(SESSION_KEY);
  const now = Date.now();
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  if (lastVisit && now - parseInt(lastVisit, 10) < FIFTEEN_MINUTES) {
    // Already tracked in this 15-minute window
    return;
  }

  // 3. Helper to detect Browser, OS, and Device
  function getClientMeta() {
    const ua = navigator.userAgent || '';
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    let device = 'Desktop';

    // Device Detection
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      device = 'Tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
      device = 'Mobile';
    } else {
      device = 'Desktop';
    }

    // OS Detection
    if (/windows phone/i.test(ua)) os = 'Windows Phone';
    else if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
    else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/cros/i.test(ua)) os = 'ChromeOS';

    // Browser Detection
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
    else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

    return {
      device,
      browser,
      os,
      screen: `${window.screen.width}x${window.screen.height}`,
      page: window.location.pathname || '/',
      referrer: document.referrer || 'Direct',
      userAgent: ua
    };
  }

  // 4. Send tracking beacon
  function dispatchBeacon() {
    const clientMeta = getClientMeta();

    // Primary: Send to /api/track (Vercel serverless handles IP & Geo automatically)
    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientMeta),
      keepalive: true
    })
      .then(response => {
        if (response.ok) {
          sessionStorage.setItem(SESSION_KEY, String(Date.now()));
        } else {
          // If running locally without /api/track or serverless function
          handleLocalFallback(clientMeta);
        }
      })
      .catch(() => {
        // Fallback if /api/track is unreachable (e.g. static local preview)
        handleLocalFallback(clientMeta);
      });
  }

  // 5. Local Fallback (for testing offline or local live-server without Vercel API)
  async function handleLocalFallback(meta) {
    try {
      const customUrl = localStorage.getItem('portfolio_supabase_url');
      const customKey = localStorage.getItem('portfolio_supabase_anon_key');

      if (!customUrl || !customKey) return;

      // Fetch client IP & location via free public geoip
      const geoRes = await fetch('https://ipapi.co/json/');
      const geo = await geoRes.json();

      const record = {
        ip: geo.ip || '127.0.0.1',
        city: geo.city || 'Unknown',
        region: geo.region || 'Unknown',
        country: geo.country_name || 'Unknown',
        country_code: geo.country_code || 'XX',
        latitude: geo.latitude || null,
        longitude: geo.longitude || null,
        device: meta.device,
        browser: meta.browser,
        os: meta.os,
        screen: meta.screen,
        page: meta.page,
        referrer: meta.referrer,
        user_agent: meta.userAgent
      };

      await fetch(`${customUrl.replace(/\/$/, '')}/rest/v1/portfolio_visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': customKey,
          'Authorization': `Bearer ${customKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(record)
      });
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    } catch {
      // Quietly fail locally
    }
  }

  // Execute non-blockingly after page finishes initial render
  if (document.readyState === 'complete') {
    setTimeout(dispatchBeacon, 1200);
  } else {
    window.addEventListener('load', () => setTimeout(dispatchBeacon, 1200));
  }

  // Secret Owner Shortcut: Press Ctrl + Shift + A (or Cmd + Shift + A) to open Owner Dossier
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      if (typeof window.switchSection === 'function') {
        window.switchSection('section-owner');
      } else {
        const ownerSec = document.getElementById('section-owner');
        if (ownerSec) {
          ownerSec.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = 'admin.html';
        }
      }
    }
  });
})();
