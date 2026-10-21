/**
 * Sampada Bandre Portfolio — Client-Side Visitor Tracker (tracker.js)
 * Lightweight, non-intrusive analytics beacon.
 * Tracks visits securely, respects owner exclusion, and deduplicates rapid reloads.
 */

(function () {
  'use strict';

  // 1. Owner Mode Check: If the portfolio owner enabled exclusion on this browser, do not track!
  if (localStorage.getItem('portfolio_owner_mode') === 'true') {
    return;
  }

  // Helper: Generate anonymous RFC4122 v4 UUID
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // 2. Anonymous Persistent Visitor Identity (New vs Returning)
  const VISITOR_STORAGE_KEY = 'portfolio_visitor_id';
  let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
  let isNewVisitor = false;

  if (!visitorId) {
    visitorId = generateUUID();
    try {
      localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
      isNewVisitor = true;
    } catch {
      // LocalStorage restricted or private mode
    }
  }

  // 3. Browsing Session ID (Per browser tab lifecycle)
  const SESSION_STORAGE_KEY = 'portfolio_session_id';
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = generateUUID();
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch {
      // SessionStorage restricted
    }
  }

  // 4. Page Deduplication Check (Avoid duplicate inserts on rapid page refreshes within 30 seconds)
  const currentPath = window.location.pathname || '/';
  const DEDUP_KEY = `portfolio_last_view_${currentPath}`;
  const lastTracked = sessionStorage.getItem(DEDUP_KEY);
  const now = Date.now();

  if (lastTracked && now - parseInt(lastTracked, 10) < 30000) {
    // Already tracked this page in the last 30 seconds
    return;
  }

  // 5. Client Metadata Helper
  function getClientMeta() {
    const ua = navigator.userAgent || '';
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Device category
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      device = 'Tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
      device = 'Mobile';
    } else {
      device = 'Desktop';
    }

    // OS
    if (/windows phone/i.test(ua)) os = 'Windows Phone';
    else if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/cros/i.test(ua)) os = 'ChromeOS';

    // Browser
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
    else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

    return {
      sessionId,
      visitorId,
      isNewVisitor,
      device,
      browser,
      os,
      screen: `${window.screen.width || 0}x${window.screen.height || 0}`,
      page: currentPath,
      referrer: document.referrer || 'Direct',
      userAgent: ua
    };
  }

  // 6. Send Tracking Beacon Non-Blockingly
  const CONFIGURED_VERCEL_BACKEND = 'https://portfolio-9iu2.vercel.app';

  function getTrackEndpoint() {
    if (typeof window !== 'undefined' && window.location.hostname.includes('portfolio-five-sand-53')) {
      return `${CONFIGURED_VERCEL_BACKEND}/api/track`;
    }
    return '/api/track';
  }

  function dispatchBeacon() {
    try {
      const payload = getClientMeta();
      const endpoint = getTrackEndpoint();

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true
      })
        .then(res => {
          if (res.ok) {
            try {
              sessionStorage.setItem(DEDUP_KEY, String(Date.now()));
            } catch {}
          } else if (res.status === 500 && endpoint !== `${CONFIGURED_VERCEL_BACKEND}/api/track`) {
            // If local deployment has no env vars configured, fallback to configured backend
            fetch(`${CONFIGURED_VERCEL_BACKEND}/api/track`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              keepalive: true
            }).catch(() => {});
          }
        })
        .catch(() => {
          // Never block or alert public visitors
        });
    } catch {
      // Quiet fail
    }
  }

  // Trigger dispatch after page load or after short delay
  if (document.readyState === 'complete') {
    setTimeout(dispatchBeacon, 800);
  } else {
    window.addEventListener('load', () => setTimeout(dispatchBeacon, 800));
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
