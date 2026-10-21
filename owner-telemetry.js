/**
 * SAMPADA BANDRE — INLINE OWNER TELEMETRY ENGINE (owner-telemetry.js)
 * Seamlessly manages the in-page Owner Portal section, secure authentication,
 * live visitor metrics, IP telemetry, and geo-intelligence.
 */

const ownerInlineState = {
  authToken: null,
  isDemoMode: false,
  allVisits: [],
  filteredVisits: [],
  activeTimeframe: 'all',
  searchQuery: '',
  refreshInterval: null
};

// Storage Keys
const OWNER_STORAGE_AUTH = 'portfolio_admin_auth';
const OWNER_STORAGE_IGNORE = 'portfolio_owner_mode';
const OWNER_STORAGE_URL = 'portfolio_supabase_url';
const OWNER_STORAGE_KEY = 'portfolio_supabase_key';

// -----------------------------------------------------------------------------
// 1. INITIALIZATION ON DOM READY
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Restore owner exclusion switch status
  const isIgnored = localStorage.getItem(OWNER_STORAGE_IGNORE) === 'true';
  const switchEl = document.getElementById('ownerInlineIgnoreSwitch');
  if (switchEl) switchEl.checked = isIgnored;

  // Check existing session
  const savedToken = sessionStorage.getItem(OWNER_STORAGE_AUTH) || localStorage.getItem(OWNER_STORAGE_AUTH);
  if (savedToken) {
    ownerInlineState.authToken = savedToken;
    revealUnlockedOwnerDossier();
  }

  // If hash is #section-owner, activate section
  if (window.location.hash === '#section-owner') {
    setTimeout(() => {
      if (typeof window.switchSection === 'function') {
        window.switchSection('section-owner');
      }
    }, 150);
  }
});

// -----------------------------------------------------------------------------
// 2. AUTHENTICATION & LOCK CONTROLS
// -----------------------------------------------------------------------------
function toggleInlinePasswordVisibility() {
  const input = document.getElementById('ownerInlinePassword');
  const icon = document.getElementById('ownerInlineEyeIcon');
  if (!input || !icon) return;

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

async function handleInlineOwnerLogin(event) {
  event.preventDefault();
  const passwordInput = document.getElementById('ownerInlinePassword');
  const alertBox = document.getElementById('ownerInlineAlert');
  const submitBtn = document.getElementById('ownerInlineLoginBtn');
  const rememberMe = document.getElementById('ownerInlineRemember').checked;
  const password = passwordInput.value.trim();

  if (!password) return;

  // Button loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying...</span>';
  alertBox.style.display = 'none';

  try {
    const isValid = await verifyOwnerCredentials(password);

    if (isValid) {
      ownerInlineState.authToken = password;
      if (rememberMe) {
        localStorage.setItem(OWNER_STORAGE_AUTH, password);
      } else {
        sessionStorage.setItem(OWNER_STORAGE_AUTH, password);
      }

      revealUnlockedOwnerDossier();
      showPortfolioToast('Welcome, Sampada! Confidential dossier unlocked.');
    } else {
      alertBox.textContent = 'Invalid Master Password. Access restricted to portfolio owner only.';
      alertBox.style.display = 'flex';
      passwordInput.focus();
    }
  } catch (err) {
    console.error('Owner auth error:', err);
    alertBox.textContent = 'Authentication error: ' + (err.message || 'Check connection');
    alertBox.style.display = 'flex';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> <span>Unlock Private Dossier</span>';
  }
}

async function verifyOwnerCredentials(password) {
  // Test against /api/analytics
  try {
    const customUrl = localStorage.getItem(OWNER_STORAGE_URL) || '';
    const customKey = localStorage.getItem(OWNER_STORAGE_KEY) || '';

    const res = await fetch('/api/analytics?limit=1', {
      headers: {
        'x-admin-password': password,
        'x-supabase-url': customUrl,
        'x-supabase-key': customKey
      }
    });

    if (res.ok) return true;
    if (res.status === 401) return false;

    // Default password fallback for local development
    if (password === 'sampada@admin2026') return true;

    // Direct Supabase test if URL is saved
    if (customUrl && customKey) {
      const sbRes = await fetch(`${customUrl.replace(/\/$/, '')}/rest/v1/portfolio_visits?select=id&limit=1`, {
        headers: {
          'apikey': customKey,
          'Authorization': `Bearer ${customKey}`
        }
      });
      return sbRes.ok;
    }

    return false;
  } catch {
    if (password === 'sampada@admin2026') return true;
    return false;
  }
}

function revealUnlockedOwnerDossier() {
  const locked = document.getElementById('ownerLockedContainer');
  const unlocked = document.getElementById('ownerUnlockedContainer');

  if (locked) locked.style.display = 'none';
  if (unlocked) unlocked.style.display = 'block';

  // Automatically enable owner exclusion on this device if not yet set
  if (localStorage.getItem(OWNER_STORAGE_IGNORE) === null) {
    localStorage.setItem(OWNER_STORAGE_IGNORE, 'true');
    const switchEl = document.getElementById('ownerInlineIgnoreSwitch');
    if (switchEl) switchEl.checked = true;
  }

  refreshInlineAnalytics();

  // Auto refresh every 45s
  if (ownerInlineState.refreshInterval) clearInterval(ownerInlineState.refreshInterval);
  ownerInlineState.refreshInterval = setInterval(() => refreshInlineAnalytics(false), 45000);
}

function handleInlineOwnerLogout() {
  sessionStorage.removeItem(OWNER_STORAGE_AUTH);
  localStorage.removeItem(OWNER_STORAGE_AUTH);
  ownerInlineState.authToken = null;
  ownerInlineState.isDemoMode = false;
  if (ownerInlineState.refreshInterval) clearInterval(ownerInlineState.refreshInterval);

  const locked = document.getElementById('ownerLockedContainer');
  const unlocked = document.getElementById('ownerUnlockedContainer');
  const passwordInput = document.getElementById('ownerInlinePassword');
  const demoNotice = document.getElementById('ownerInlineDemoNotice');

  if (locked) locked.style.display = 'block';
  if (unlocked) unlocked.style.display = 'none';
  if (passwordInput) passwordInput.value = '';
  if (demoNotice) demoNotice.style.display = 'none';

  showPortfolioToast('Owner dossier locked securely.');
}

// -----------------------------------------------------------------------------
// 3. OWNER EXCLUSION SWITCH
// -----------------------------------------------------------------------------
function toggleInlineOwnerIgnore(checked) {
  localStorage.setItem(OWNER_STORAGE_IGNORE, String(checked));
  if (checked) {
    showPortfolioToast('Owner Mode ON: Visits from this device are excluded from telemetry.');
  } else {
    showPortfolioToast('Owner Mode OFF: Visits from this device will be counted.');
  }
}

// -----------------------------------------------------------------------------
// 4. TELEMETRY DATA FETCHING & PROCESSING
// -----------------------------------------------------------------------------
async function refreshInlineAnalytics(isManual = false) {
  const refreshIcon = document.getElementById('ownerRefreshIcon');
  if (refreshIcon && isManual) refreshIcon.classList.add('fa-spin');

  try {
    if (ownerInlineState.isDemoMode) {
      loadInlineDemoData();
      if (isManual) showPortfolioToast('Refreshed demo telemetry.');
      return;
    }

    const customUrl = localStorage.getItem(OWNER_STORAGE_URL) || '';
    const customKey = localStorage.getItem(OWNER_STORAGE_KEY) || '';

    const response = await fetch('/api/analytics?limit=500', {
      headers: {
        'x-admin-password': ownerInlineState.authToken || '',
        'x-supabase-url': customUrl,
        'x-supabase-key': customKey
      }
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        renderOwnerTelemetryData(json.data);
        if (isManual) showPortfolioToast('Telemetry data updated.');
        return;
      }
    }

    // Direct Supabase fallback
    if (customUrl && customKey) {
      const direct = await fetchDirectVisits(customUrl, customKey);
      if (direct) {
        renderOwnerTelemetryData(direct);
        if (isManual) showPortfolioToast('Direct database telemetry synced.');
        return;
      }
    }

    // If no visits recorded yet
    renderEmptyOwnerTable('No visitor records found yet in database.');
  } catch (err) {
    console.error('Refresh error:', err);
    if (isManual) showPortfolioToast('Connection error: ' + err.message);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  }
}

async function fetchDirectVisits(url, key) {
  try {
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/portfolio_visits?select=*&order=created_at.desc&limit=500`;
    const res = await fetch(endpoint, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (!res.ok) return null;
    const visits = await res.json();
    return calculateTelemetryMetrics(visits);
  } catch {
    return null;
  }
}

function calculateTelemetryMetrics(visits) {
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

    const cCode = (v.country_code || 'XX').toUpperCase();
    const cName = v.country || 'Unknown';
    if (!countryMap[cCode]) {
      countryMap[cCode] = { code: cCode, name: cName, count: 0, flag: getCountryFlagEmoji(cCode) };
    }
    countryMap[cCode].count++;

    const dev = v.device || 'Desktop';
    if (deviceMap[dev] !== undefined) deviceMap[dev]++;
    else deviceMap.Other++;

    const br = v.browser || 'Other';
    browserMap[br] = (browserMap[br] || 0) + 1;

    let ref = v.referrer || 'Direct';
    try {
      if (ref.startsWith('http')) {
        ref = new URL(ref).hostname.replace(/^www\./, '');
      }
    } catch {}
    referrerMap[ref] = (referrerMap[ref] || 0) + 1;
  });

  const countryStats = Object.values(countryMap).sort((a, b) => b.count - a.count);
  const topCountry = countryStats[0] || { name: 'None yet', count: 0, flag: '🌐' };

  return {
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
  };
}

// -----------------------------------------------------------------------------
// 5. RENDERING VISUALS & METRICS
// -----------------------------------------------------------------------------
function renderOwnerTelemetryData(data) {
  const { metrics, countryStats, deviceStats, browserStats, referrerStats, recentVisits } = data;

  // 1. KPI cards
  animateInlineNumber('ownerKpiTotalViews', metrics.totalViews || 0);
  animateInlineNumber('ownerKpiUnique', metrics.uniqueVisitors || 0);
  animateInlineNumber('ownerKpiToday', metrics.todayViews || 0);
  const weekSub = document.getElementById('ownerKpiWeekSub');
  if (weekSub) weekSub.textContent = `${metrics.weekViews || 0} this week`;

  if (metrics.topCountry) {
    const topCountryEl = document.getElementById('ownerKpiTopCountry');
    const topFlagEl = document.getElementById('ownerKpiTopFlag');
    const topSubEl = document.getElementById('ownerKpiTopSub');

    if (topCountryEl) topCountryEl.textContent = metrics.topCountry.name || 'Detecting...';
    if (topFlagEl) topFlagEl.textContent = metrics.topCountry.flag || getCountryFlagEmoji(metrics.topCountry.code);
    if (topSubEl) topSubEl.textContent = `${metrics.topCountry.count || 0} visits from this region`;
  }

  // 2. Geographic breakdown
  renderOwnerCountries(countryStats || [], metrics.totalViews || 1);

  // 3. Hardware & Referrer breakdown
  renderOwnerTech(deviceStats, browserStats, referrerStats);

  // 4. Telemetry Table
  ownerInlineState.allVisits = recentVisits || [];
  applyOwnerTableFilters();
}

function animateInlineNumber(id, targetVal) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent.replace(/,/g, ''), 10) || 0;
  if (start === targetVal) {
    el.textContent = targetVal.toLocaleString();
    return;
  }

  const duration = 650;
  const startTime = performance.now();

  function step(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const curr = Math.floor(start + (targetVal - start) * ease);
    el.textContent = curr.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = targetVal.toLocaleString();
    }
  }
  requestAnimationFrame(step);
}

function renderOwnerCountries(countries, total) {
  const list = document.getElementById('ownerCountryListContainer');
  const badge = document.getElementById('ownerCountryBadge');
  if (!list) return;

  if (badge) badge.textContent = `${countries.length} ${countries.length === 1 ? 'Country' : 'Countries'}`;

  if (!countries || countries.length === 0) {
    list.innerHTML = '<div class="owner-empty-hint">No country records yet</div>';
    return;
  }

  list.innerHTML = countries.map(c => {
    const flag = c.flag || getCountryFlagEmoji(c.code);
    const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
    return `
      <div class="owner-country-row">
        <span class="owner-country-flag">${flag}</span>
        <div class="owner-country-info">
          <div class="owner-country-meta">
            <span class="owner-country-label">${escapeHtmlSafe(c.name)}</span>
            <span class="owner-country-val">${c.count} ${c.count === 1 ? 'view' : 'views'} (${pct}%)</span>
          </div>
          <div class="owner-progress-track">
            <div class="owner-progress-bar" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderOwnerTech(deviceStats, browserStats, referrerStats) {
  // Devices
  const devContainer = document.getElementById('ownerDeviceTagsContainer');
  if (devContainer && deviceStats) {
    devContainer.innerHTML = `
      <span class="owner-device-tag"><i class="fa-solid fa-laptop"></i> Desktop <strong>${deviceStats.Desktop || 0}</strong></span>
      <span class="owner-device-tag"><i class="fa-solid fa-mobile-screen"></i> Mobile <strong>${deviceStats.Mobile || 0}</strong></span>
      <span class="owner-device-tag"><i class="fa-solid fa-tablet-screen-button"></i> Tablet <strong>${deviceStats.Tablet || 0}</strong></span>
    `;
  }

  // Browsers
  const browserContainer = document.getElementById('ownerBrowserChipsContainer');
  if (browserContainer && browserStats) {
    const entries = Object.entries(browserStats).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      browserContainer.innerHTML = '<span class="owner-empty-hint" style="padding:0;">No browser data</span>';
    } else {
      browserContainer.innerHTML = entries.map(([name, count]) => `
        <span class="owner-tech-chip">
          <i class="${getBrowserFaIcon(name)}"></i>
          <span>${escapeHtmlSafe(name)}</span>
          <strong>${count}</strong>
        </span>
      `).join('');
    }
  }

  // Referrers
  const refContainer = document.getElementById('ownerReferrerChipsContainer');
  if (refContainer && referrerStats) {
    const entries = Object.entries(referrerStats).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      refContainer.innerHTML = '<span class="owner-empty-hint" style="padding:0;">Direct visits</span>';
    } else {
      refContainer.innerHTML = entries.map(([name, count]) => `
        <span class="owner-tech-chip">
          <i class="${getReferrerFaIcon(name)}"></i>
          <span>${escapeHtmlSafe(name)}</span>
          <strong>${count}</strong>
        </span>
      `).join('');
    }
  }
}

// -----------------------------------------------------------------------------
// 6. TELEMETRY TABLE, SEARCH & FILTER
// -----------------------------------------------------------------------------
function handleOwnerTableSearch(query) {
  ownerInlineState.searchQuery = (query || '').toLowerCase().trim();
  applyOwnerTableFilters();
}

function setOwnerTimeframe(timeframe, btnEl) {
  ownerInlineState.activeTimeframe = timeframe;
  document.querySelectorAll('.owner-filter-pills .owner-pill-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  applyOwnerTableFilters();
}

function applyOwnerTableFilters() {
  let list = [...ownerInlineState.allVisits];

  // Timeframe filter
  const now = Date.now();
  if (ownerInlineState.activeTimeframe === 'today') {
    const dayMs = 24 * 60 * 60 * 1000;
    list = list.filter(v => now - new Date(v.created_at).getTime() <= dayMs);
  } else if (ownerInlineState.activeTimeframe === 'week') {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    list = list.filter(v => now - new Date(v.created_at).getTime() <= weekMs);
  }

  // Search filter
  const q = ownerInlineState.searchQuery;
  if (q) {
    list = list.filter(v => {
      return (
        (v.ip && v.ip.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.region && v.region.toLowerCase().includes(q)) ||
        (v.country && v.country.toLowerCase().includes(q)) ||
        (v.browser && v.browser.toLowerCase().includes(q)) ||
        (v.os && v.os.toLowerCase().includes(q)) ||
        (v.referrer && v.referrer.toLowerCase().includes(q))
      );
    });
  }

  ownerInlineState.filteredVisits = list;
  renderOwnerTableRows(list);

  const countBadge = document.getElementById('ownerTableCount');
  if (countBadge) {
    countBadge.textContent = `${list.length} of ${ownerInlineState.allVisits.length} visitors`;
  }
}

function renderOwnerTableRows(visits) {
  const tbody = document.getElementById('ownerTelemetryTableBody');
  if (!tbody) return;

  if (!visits || visits.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="owner-empty-hint">
          <i class="fa-solid fa-radar" style="font-size:1.4rem;margin-bottom:0.4rem;display:block;opacity:0.6;"></i>
          No matching visitor logs found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visits.map((v, idx) => {
    const flag = getCountryFlagEmoji(v.country_code);
    const timeRel = formatRelTime(v.created_at);
    const exactDate = new Date(v.created_at).toLocaleString();
    const city = v.city && v.city !== 'Unknown' ? v.city : 'Unknown City';
    const country = v.country && v.country !== 'Unknown' ? v.country : 'Unknown Country';
    const ipSafe = escapeHtmlSafe(v.ip || '127.0.0.1');

    return `
      <tr>
        <td><span class="owner-row-pulse"></span></td>
        <td><span class="owner-col-time" title="${exactDate}">${timeRel}</span></td>
        <td>
          <span class="owner-ip-tag">
            <span>${ipSafe}</span>
            <button type="button" class="owner-copy-icon" onclick="copyOwnerText('${ipSafe}', 'IP copied!')" title="Copy IP">
              <i class="fa-regular fa-copy"></i>
            </button>
          </span>
        </td>
        <td>
          <div class="owner-location-cell">
            <span class="owner-loc-flag">${flag}</span>
            <div class="owner-loc-names">
              <span class="owner-loc-city">${escapeHtmlSafe(city)}</span>
              <span class="owner-loc-country">${escapeHtmlSafe(country)}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="owner-device-cell">
            <i class="${getOSFaIcon(v.os)}"></i>
            <span>${escapeHtmlSafe(v.os || 'Unknown OS')}</span>
            <span class="owner-cell-dot">•</span>
            <span>${escapeHtmlSafe(v.device || 'Desktop')}</span>
          </div>
        </td>
        <td>
          <span class="owner-browser-cell">
            <i class="${getBrowserFaIcon(v.browser)}"></i>
            ${escapeHtmlSafe(v.browser || 'Unknown')}
          </span>
        </td>
        <td>
          <span class="owner-ref-cell" title="${escapeHtmlSafe(v.referrer || 'Direct')}">
            ${escapeHtmlSafe(formatReferrer(v.referrer))}
          </span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="owner-detail-btn" onclick="openTelemetryModal(${idx})" title="View full telemetry payload">
            <i class="fa-solid fa-circle-info"></i>
            <span>Inspect</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderEmptyOwnerTable(msg) {
  const tbody = document.getElementById('ownerTelemetryTableBody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" class="owner-empty-hint">${escapeHtmlSafe(msg)}</td></tr>`;
  }
}

// -----------------------------------------------------------------------------
// 7. INSPECTOR MODAL
// -----------------------------------------------------------------------------
function openTelemetryModal(index) {
  const visit = ownerInlineState.filteredVisits[index];
  if (!visit) return;

  const modal = document.getElementById('telemetryDetailModal');
  const body = document.getElementById('telemetryModalBody');
  const mapsBtn = document.getElementById('telemetryMapsBtn');
  if (!modal || !body) return;

  const flag = getCountryFlagEmoji(visit.country_code);
  const createdDate = new Date(visit.created_at);

  body.innerHTML = `
    <div class="telemetry-grid-details">
      <div class="telemetry-detail-item">
        <span class="detail-label">Visitor IP</span>
        <span class="detail-value" style="color: var(--accent-gold); font-weight: 700;">${escapeHtmlSafe(visit.ip || 'Unknown')}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Geographic Location</span>
        <span class="detail-value">${flag} ${escapeHtmlSafe(visit.city || 'Unknown')}, ${escapeHtmlSafe(visit.country || 'Unknown')}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Recorded At</span>
        <span class="detail-value">${createdDate.toLocaleString()}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Hardware & Platform</span>
        <span class="detail-value">${escapeHtmlSafe(visit.device || 'Desktop')} • ${escapeHtmlSafe(visit.os || 'Unknown')}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Browser & Screen</span>
        <span class="detail-value">${escapeHtmlSafe(visit.browser || 'Unknown')} (${escapeHtmlSafe(visit.screen || 'Unknown')})</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Referral Origin</span>
        <span class="detail-value">${escapeHtmlSafe(visit.referrer || 'Direct')}</span>
      </div>

      <div class="telemetry-detail-item" style="grid-column: span 2;">
        <span class="detail-label">GPS Coordinates</span>
        <span class="detail-value">Latitude: ${visit.latitude || 'N/A'}, Longitude: ${visit.longitude || 'N/A'}</span>
      </div>
    </div>

    <span class="detail-label" style="display:block;margin:1rem 0 0.35rem;">Raw Telemetry Payload:</span>
    <pre class="telemetry-raw-box">${escapeHtmlSafe(JSON.stringify(visit, null, 2))}</pre>
  `;

  if (visit.latitude && visit.longitude && mapsBtn) {
    mapsBtn.href = `https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`;
    mapsBtn.style.display = 'inline-flex';
  } else if (mapsBtn) {
    mapsBtn.style.display = 'none';
  }

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeTelemetryModal() {
  const modal = document.getElementById('telemetryDetailModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// -----------------------------------------------------------------------------
// 8. CSV EXPORT
// -----------------------------------------------------------------------------
function exportInlineVisitsToCSV() {
  const visits = ownerInlineState.allVisits;
  if (!visits || visits.length === 0) {
    showPortfolioToast('No visitor records to export.');
    return;
  }

  const headers = ['Timestamp', 'IP Address', 'Country', 'Country Code', 'City', 'Region', 'Device', 'OS', 'Browser', 'Screen', 'Referrer', 'Latitude', 'Longitude'];
  const rows = visits.map(v => [
    v.created_at || '',
    v.ip || '',
    `"${(v.country || '').replace(/"/g, '""')}"`,
    v.country_code || '',
    `"${(v.city || '').replace(/"/g, '""')}"`,
    `"${(v.region || '').replace(/"/g, '""')}"`,
    v.device || '',
    v.os || '',
    v.browser || '',
    v.screen || '',
    `"${(v.referrer || '').replace(/"/g, '""')}"`,
    v.latitude || '',
    v.longitude || ''
  ]);

  const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encoded = encodeURI(csv);
  const a = document.createElement('a');
  a.setAttribute('href', encoded);
  const dStr = new Date().toISOString().slice(0, 10);
  a.setAttribute('download', `sampada_visitor_telemetry_${dStr}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showPortfolioToast('Visitor telemetry CSV exported!');
}

// -----------------------------------------------------------------------------
// 9. INLINE DEMO PREVIEW
// -----------------------------------------------------------------------------
function activateInlineDemoMode() {
  ownerInlineState.isDemoMode = true;
  const notice = document.getElementById('ownerInlineDemoNotice');
  if (notice) notice.style.display = 'flex';

  revealUnlockedOwnerDossier();
  loadInlineDemoData();
  showPortfolioToast('Demo mode active: viewing simulated telemetry data.');
}

function loadInlineDemoData() {
  const now = Date.now();
  const demoVisits = [
    {
      created_at: new Date(now - 4 * 60 * 1000).toISOString(),
      ip: '103.112.214.50',
      city: 'Nagpur',
      region: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      latitude: 21.1458,
      longitude: 79.0882,
      device: 'Desktop',
      os: 'Windows 11',
      browser: 'Chrome 124',
      screen: '1920x1080',
      page: '/',
      referrer: 'https://www.linkedin.com/in/sampada-bandre/'
    },
    {
      created_at: new Date(now - 25 * 60 * 1000).toISOString(),
      ip: '152.58.12.91',
      city: 'Pune',
      region: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      latitude: 18.5204,
      longitude: 73.8567,
      device: 'Desktop',
      os: 'macOS',
      browser: 'Safari',
      screen: '2560x1440',
      page: '/#projects',
      referrer: 'https://github.com/Sampadabandre'
    },
    {
      created_at: new Date(now - 68 * 60 * 1000).toISOString(),
      ip: '172.56.21.104',
      city: 'San Francisco',
      region: 'California',
      country: 'United States',
      country_code: 'US',
      latitude: 37.7749,
      longitude: -122.4194,
      device: 'Desktop',
      os: 'macOS',
      browser: 'Chrome 124',
      screen: '1728x1117',
      page: '/',
      referrer: 'Direct'
    },
    {
      created_at: new Date(now - 145 * 60 * 1000).toISOString(),
      ip: '185.199.108.153',
      city: 'London',
      region: 'England',
      country: 'United Kingdom',
      country_code: 'GB',
      latitude: 51.5074,
      longitude: -0.1278,
      device: 'Mobile',
      os: 'iOS 17',
      browser: 'Safari',
      screen: '393x852',
      page: '/',
      referrer: 'https://www.google.com/'
    },
    {
      created_at: new Date(now - 310 * 60 * 1000).toISOString(),
      ip: '103.24.120.4',
      city: 'Bengaluru',
      region: 'Karnataka',
      country: 'India',
      country_code: 'IN',
      latitude: 12.9716,
      longitude: 77.5946,
      device: 'Desktop',
      os: 'Linux',
      browser: 'Firefox',
      screen: '1920x1080',
      page: '/#patent',
      referrer: 'Direct'
    },
    {
      created_at: new Date(now - 550 * 60 * 1000).toISOString(),
      ip: '141.101.90.12',
      city: 'Munich',
      region: 'Bavaria',
      country: 'Germany',
      country_code: 'DE',
      latitude: 48.1351,
      longitude: 11.5820,
      device: 'Tablet',
      os: 'iOS 17',
      browser: 'Safari',
      screen: '820x1180',
      page: '/',
      referrer: 'https://www.linkedin.com/'
    },
    {
      created_at: new Date(now - 1100 * 60 * 1000).toISOString(),
      ip: '202.131.110.15',
      city: 'Mumbai',
      region: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      latitude: 19.0760,
      longitude: 72.8777,
      device: 'Mobile',
      os: 'Android 14',
      browser: 'Chrome Mobile',
      screen: '412x915',
      page: '/',
      referrer: 'Direct'
    }
  ];

  const processed = calculateTelemetryMetrics(demoVisits);
  renderOwnerTelemetryData(processed);
}

// -----------------------------------------------------------------------------
// 10. UTILITIES
// -----------------------------------------------------------------------------
function getCountryFlagEmoji(cc) {
  if (!cc || cc.length !== 2 || cc === 'XX') return '🌐';
  const cps = cc.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...cps);
}

function formatRelTime(dateStr) {
  const d = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1m ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 7200) return '1h ago';
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatReferrer(ref) {
  if (!ref || ref === 'Direct') return 'Direct';
  try {
    if (ref.startsWith('http')) return new URL(ref).hostname.replace(/^www\./, '');
  } catch {}
  return ref;
}

function getOSFaIcon(os) {
  if (!os) return 'fa-solid fa-desktop';
  const l = os.toLowerCase();
  if (l.includes('win')) return 'fa-brands fa-windows';
  if (l.includes('mac') || l.includes('ios')) return 'fa-brands fa-apple';
  if (l.includes('android')) return 'fa-brands fa-android';
  if (l.includes('linux')) return 'fa-brands fa-linux';
  return 'fa-solid fa-desktop';
}

function getBrowserFaIcon(br) {
  if (!br) return 'fa-solid fa-globe';
  const l = br.toLowerCase();
  if (l.includes('chrome')) return 'fa-brands fa-chrome';
  if (l.includes('safari')) return 'fa-brands fa-safari';
  if (l.includes('firefox')) return 'fa-brands fa-firefox-browser';
  if (l.includes('edge')) return 'fa-brands fa-edge';
  if (l.includes('opera')) return 'fa-brands fa-opera';
  return 'fa-solid fa-globe';
}

function getReferrerFaIcon(ref) {
  if (!ref) return 'fa-solid fa-arrow-right-to-bracket';
  const l = ref.toLowerCase();
  if (l.includes('linkedin')) return 'fa-brands fa-linkedin';
  if (l.includes('github')) return 'fa-brands fa-github';
  if (l.includes('google')) return 'fa-brands fa-google';
  if (l.includes('twitter') || l.includes('x.com')) return 'fa-brands fa-x-twitter';
  return 'fa-solid fa-arrow-right-to-bracket';
}

function copyOwnerText(text, msg = 'Copied!') {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showPortfolioToast(msg));
  } else {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showPortfolioToast(msg);
  }
}

function showPortfolioToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function escapeHtmlSafe(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
