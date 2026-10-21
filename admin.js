/**
 * SAMPADA BANDRE — OWNER ANALYTICS ENGINE (admin.js)
 * Real-time visitor metrics, IP telemetry, geo-intelligence,
 * and secure owner-only authentication.
 */

// Global State
const adminState = {
  authToken: null,
  isDemoMode: false,
  allVisits: [],
  filteredVisits: [],
  activeTimeframe: 'all',
  searchQuery: '',
  refreshTimer: null
};

// Storage Keys
const STORAGE_KEY_AUTH = 'portfolio_admin_auth';
const STORAGE_KEY_SUPABASE_URL = 'portfolio_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = 'portfolio_supabase_key';
const STORAGE_KEY_OWNER_IGNORE = 'portfolio_owner_mode';

// -----------------------------------------------------------------------------
// 1. INITIALIZATION & SESSION RESTORE
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Restore Owner Ignore switch status
  const isOwnerIgnored = localStorage.getItem(STORAGE_KEY_OWNER_IGNORE) === 'true';
  const switchEl = document.getElementById('ownerIgnoreSwitch');
  if (switchEl) switchEl.checked = isOwnerIgnored;

  // Populate config inputs from storage if available
  const savedUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL);
  const savedKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY);
  if (savedUrl && document.getElementById('cfgSupabaseUrl')) {
    document.getElementById('cfgSupabaseUrl').value = savedUrl;
  }
  if (savedKey && document.getElementById('cfgSupabaseKey')) {
    document.getElementById('cfgSupabaseKey').value = savedKey;
  }

  // Check saved session
  const savedAuth = sessionStorage.getItem(STORAGE_KEY_AUTH) || localStorage.getItem(STORAGE_KEY_AUTH);
  if (savedAuth) {
    adminState.authToken = savedAuth;
    unlockDashboard();
  }
});

// -----------------------------------------------------------------------------
// 2. AUTHENTICATION & LOCK CONTROLS
// -----------------------------------------------------------------------------
function togglePasswordVisibility() {
  const input = document.getElementById('adminPasswordInput');
  const icon = document.getElementById('passwordEyeIcon');
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

async function handleAdminLogin(event) {
  event.preventDefault();
  const passwordInput = document.getElementById('adminPasswordInput');
  const alertBox = document.getElementById('authAlert');
  const loginBtn = document.getElementById('loginBtn');
  const rememberMe = document.getElementById('rememberMeCheckbox').checked;
  const password = passwordInput.value.trim();

  if (!password) return;

  // Loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<div class="loader-spinner" style="width:16px;height:16px;margin:0 6px 0 0;display:inline-block;vertical-align:middle;"></div> Verifying...';
  alertBox.style.display = 'none';

  try {
    const verified = await testCredentials(password);

    if (verified) {
      adminState.authToken = password;
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_AUTH, password);
      } else {
        sessionStorage.setItem(STORAGE_KEY_AUTH, password);
      }
      unlockDashboard();
      showToast('Welcome back, Sampada! Console unlocked.');
    } else {
      alertBox.textContent = 'Invalid Master Password. Access restricted to portfolio owner only.';
      alertBox.style.display = 'flex';
      passwordInput.focus();
    }
  } catch (err) {
    console.error('Login error:', err);
    alertBox.textContent = 'Verification error: ' + (err.message || 'Check connection');
    alertBox.style.display = 'flex';
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Unlock Analytics Console</span> <i class="fa-solid fa-arrow-right"></i>';
  }
}

async function testCredentials(password) {
  // Test against /api/analytics
  try {
    const res = await fetch('/api/analytics?limit=1', {
      headers: {
        'x-admin-password': password
      }
    });

    if (res.ok) return true;
    if (res.status === 401) return false;

    // In local dev server, allow master password check
    const data = await res.json().catch(() => ({}));
    if (res.status === 503) {
      return true; // Password was valid, but Supabase connection not yet configured
    }

    return false;
  } catch {
    return false;
  }
}

function unlockDashboard() {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';

  // Automatically enable owner exclusion on this device
  if (localStorage.getItem(STORAGE_KEY_OWNER_IGNORE) === null) {
    localStorage.setItem(STORAGE_KEY_OWNER_IGNORE, 'true');
    const switchEl = document.getElementById('ownerIgnoreSwitch');
    if (switchEl) switchEl.checked = true;
  }

  refreshAnalytics();

  // Auto refresh every 45 seconds
  if (adminState.refreshTimer) clearInterval(adminState.refreshTimer);
  adminState.refreshTimer = setInterval(() => refreshAnalytics(false), 45000);
}

function handleLogout() {
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
  localStorage.removeItem(STORAGE_KEY_AUTH);
  adminState.authToken = null;
  adminState.isDemoMode = false;
  if (adminState.refreshTimer) clearInterval(adminState.refreshTimer);

  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('authSection').style.display = 'flex';
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('demoBanner').style.display = 'none';
  showToast('Console locked securely.');
}

// -----------------------------------------------------------------------------
// 3. OWNER VISIT EXCLUSION TOGGLE
// -----------------------------------------------------------------------------
function toggleOwnerIgnore(checked) {
  localStorage.setItem(STORAGE_KEY_OWNER_IGNORE, String(checked));
  if (checked) {
    showToast('Owner Mode ON: Visits from this browser are now excluded from stats.');
  } else {
    showToast('Owner Mode OFF: Visits from this browser will be counted.');
  }
}

// -----------------------------------------------------------------------------
// 4. DATA FETCHING & TELEMETRY STREAM
// -----------------------------------------------------------------------------
async function refreshAnalytics(isManual = false) {
  const refreshIcon = document.getElementById('refreshIcon');
  if (refreshIcon && isManual) refreshIcon.classList.add('fa-spin');

  try {
    if (adminState.isDemoMode) {
      loadDemoData();
      if (isManual) showToast('Refreshed demo telemetry.');
      return;
    }

    // Query /api/analytics
    const response = await fetch('/api/analytics?limit=1000', {
      headers: {
        'x-admin-password': adminState.authToken || ''
      }
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        processAnalyticsData(json.data);
        if (isManual) showToast('Telemetry data updated.');
        return;
      }
    }

    // Direct Supabase fallback if API serverless function is not active (e.g. running on local preview)
    if (customUrl && customKey) {
      const directData = await fetchDirectFromSupabase(customUrl, customKey);
      if (directData) {
        processAnalyticsData(directData);
        if (isManual) showToast('Direct database telemetry synced.');
        return;
      }
    }

    // If no data or configuration yet, prompt user or offer demo
    renderEmptyTelemetryState('No visitors recorded yet or database credentials need configuration in Settings.');
  } catch (err) {
    console.error('Refresh error:', err);
    if (isManual) showToast('Could not reach backend: ' + err.message);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  }
}

async function fetchDirectFromSupabase(url, key) {
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
    return calculateLocalMetrics(visits);
  } catch {
    return null;
  }
}

function calculateLocalMetrics(visits) {
  const totalViews = visits.length;
  const uniqueIps = new Set();
  const countryMap = {};
  const cityMap = {};
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
      countryMap[cCode] = { code: cCode, name: cName, count: 0, flag: getCountryFlag(cCode) };
    }
    countryMap[cCode].count++;

    if (v.city && v.city !== 'Unknown') {
      const k = `${v.city}, ${cName}`;
      cityMap[k] = (cityMap[k] || 0) + 1;
    }

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
// 5. RENDER ANALYTICS & UI DATA
// -----------------------------------------------------------------------------
function processAnalyticsData(data) {
  const { metrics, countryStats, deviceStats, browserStats, referrerStats, recentVisits } = data;

  // 1. KPI Cards
  animateNumber('metricTotalViews', metrics.totalViews || 0);
  animateNumber('metricUniqueVisitors', metrics.uniqueVisitors || 0);
  animateNumber('metricTodayViews', metrics.todayViews || 0);
  document.getElementById('metricWeekViews').textContent = `${metrics.weekViews || 0} this week`;

  if (metrics.topCountry) {
    document.getElementById('metricTopCountry').textContent = metrics.topCountry.name || 'Detecting...';
    document.getElementById('metricTopFlag').textContent = metrics.topCountry.flag || getCountryFlag(metrics.topCountry.code);
    document.getElementById('metricTopCity').textContent = `${metrics.topCountry.count || 0} visits from this region`;
  }

  // 2. Country Breakdown
  renderCountryBreakdown(countryStats || [], metrics.totalViews || 1);

  // 3. Tech breakdown (Devices, Browsers, Referrers)
  renderTechBreakdown(deviceStats, browserStats, referrerStats);

  // 4. Telemetry Table
  adminState.allVisits = recentVisits || [];
  applyFiltersAndRenderTable();
}

function animateNumber(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = parseInt(el.textContent.replace(/,/g, ''), 10) || 0;
  if (start === targetValue) {
    el.textContent = targetValue.toLocaleString();
    return;
  }

  const duration = 800;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (targetValue - start) * easeProgress);
    el.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = targetValue.toLocaleString();
    }
  }
  requestAnimationFrame(update);
}

function renderCountryBreakdown(countries, totalViews) {
  const container = document.getElementById('countryStatsList');
  const badge = document.getElementById('countryCountBadge');
  if (!container) return;

  if (badge) badge.textContent = `${countries.length} ${countries.length === 1 ? 'Country' : 'Countries'}`;

  if (!countries || countries.length === 0) {
    container.innerHTML = '<div class="empty-state">No country records yet</div>';
    return;
  }

  container.innerHTML = countries.map(c => {
    const flag = c.flag || getCountryFlag(c.code);
    const pct = totalViews > 0 ? Math.round((c.count / totalViews) * 100) : 0;
    return `
      <div class="country-item">
        <span class="country-flag-icon">${flag}</span>
        <div class="country-info-box">
          <div class="country-meta-row">
            <span class="country-name">${escapeHtml(c.name)}</span>
            <span class="country-views">${c.count} ${c.count === 1 ? 'view' : 'views'} (${pct}%)</span>
          </div>
          <div class="country-progress-track">
            <div class="country-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTechBreakdown(deviceStats, browserStats, referrerStats) {
  // Device Bars
  const devContainer = document.getElementById('deviceBarsContainer');
  if (devContainer && deviceStats) {
    devContainer.innerHTML = `
      <div class="device-metric-pill">
        <div class="device-pill-top">
          <span><i class="fa-solid fa-laptop"></i> Desktop</span>
        </div>
        <span class="device-pill-val">${deviceStats.Desktop || 0}</span>
      </div>
      <div class="device-metric-pill">
        <div class="device-pill-top">
          <span><i class="fa-solid fa-mobile-screen"></i> Mobile</span>
        </div>
        <span class="device-pill-val">${deviceStats.Mobile || 0}</span>
      </div>
      <div class="device-metric-pill">
        <div class="device-pill-top">
          <span><i class="fa-solid fa-tablet-screen-button"></i> Tablet</span>
        </div>
        <span class="device-pill-val">${deviceStats.Tablet || 0}</span>
      </div>
    `;
  }

  // Browser Chips
  const browserContainer = document.getElementById('browserChipsContainer');
  if (browserContainer && browserStats) {
    const entries = Object.entries(browserStats).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      browserContainer.innerHTML = '<span class="empty-state" style="padding:0.4rem;">No browser data</span>';
    } else {
      browserContainer.innerHTML = entries.map(([name, count]) => `
        <span class="tech-chip">
          <i class="${getBrowserIcon(name)}"></i>
          <span>${escapeHtml(name)}</span>
          <strong>${count}</strong>
        </span>
      `).join('');
    }
  }

  // Referrer Chips
  const refContainer = document.getElementById('referrerChipsContainer');
  if (refContainer && referrerStats) {
    const entries = Object.entries(referrerStats).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      refContainer.innerHTML = '<span class="empty-state" style="padding:0.4rem;">No referrer data</span>';
    } else {
      refContainer.innerHTML = entries.map(([source, count]) => `
        <span class="tech-chip">
          <i class="${getReferrerIcon(source)}"></i>
          <span>${escapeHtml(source)}</span>
          <strong>${count}</strong>
        </span>
      `).join('');
    }
  }
}

// -----------------------------------------------------------------------------
// 6. TELEMETRY TABLE, FILTERING & SEARCH
// -----------------------------------------------------------------------------
function handleTableSearch(query) {
  adminState.searchQuery = (query || '').toLowerCase().trim();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = adminState.searchQuery ? 'block' : 'none';
  applyFiltersAndRenderTable();
}

function clearTableSearch() {
  const input = document.getElementById('tableSearchInput');
  if (input) input.value = '';
  handleTableSearch('');
}

function setTimeframeFilter(filter, buttonEl) {
  adminState.activeTimeframe = filter;
  document.querySelectorAll('.timeframe-filter-group .filter-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');
  applyFiltersAndRenderTable();
}

function applyFiltersAndRenderTable() {
  let list = [...adminState.allVisits];

  // Timeframe filter
  const now = Date.now();
  if (adminState.activeTimeframe === 'today') {
    const oneDay = 24 * 60 * 60 * 1000;
    list = list.filter(v => now - new Date(v.created_at).getTime() <= oneDay);
  } else if (adminState.activeTimeframe === 'week') {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    list = list.filter(v => now - new Date(v.created_at).getTime() <= sevenDays);
  }

  // Search filter
  const q = adminState.searchQuery;
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

  adminState.filteredVisits = list;
  renderTableRows(list);

  const counterEl = document.getElementById('tableFilterCount');
  if (counterEl) {
    counterEl.textContent = `Showing ${list.length} of ${adminState.allVisits.length} visitors`;
  }
}

function renderTableRows(visits) {
  const tbody = document.getElementById('telemetryTableBody');
  if (!tbody) return;

  if (!visits || visits.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <i class="fa-solid fa-radar" style="font-size:1.6rem;margin-bottom:0.6rem;display:block;color:var(--text-dim);"></i>
          No matching visitor logs found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visits.map((v, index) => {
    const flag = getCountryFlag(v.country_code);
    const timeFormatted = formatRelativeTime(v.created_at);
    const exactDate = new Date(v.created_at).toLocaleString();
    const cityText = v.city && v.city !== 'Unknown' ? v.city : 'Unknown City';
    const countryText = v.country && v.country !== 'Unknown' ? v.country : 'Unknown Country';
    const osIcon = getOSIcon(v.os);
    const ipSafe = escapeHtml(v.ip || '127.0.0.1');

    return `
      <tr>
        <td>
          <span class="cell-status-dot" title="Active Log"></span>
        </td>
        <td>
          <span class="cell-timestamp" title="${exactDate}">${timeFormatted}</span>
        </td>
        <td>
          <span class="ip-badge">
            <i class="fa-solid fa-network-wired" style="font-size:0.75rem;"></i>
            <span>${ipSafe}</span>
            <button class="copy-ip-btn" onclick="copyToClipboard('${ipSafe}', 'IP copied!')" title="Copy IP">
              <i class="fa-regular fa-copy"></i>
            </button>
          </span>
        </td>
        <td>
          <div class="cell-location">
            <span class="cell-flag">${flag}</span>
            <div class="cell-loc-text">
              <span class="cell-loc-city">${escapeHtml(cityText)}</span>
              <span class="cell-loc-country">${escapeHtml(countryText)}${v.region && v.region !== 'Unknown' ? ` (${escapeHtml(v.region)})` : ''}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="cell-device">
            <i class="${osIcon}"></i>
            <span>${escapeHtml(v.os || 'Unknown OS')}</span>
            <span style="color:var(--text-dim);">•</span>
            <span>${escapeHtml(v.device || 'Desktop')}</span>
          </div>
        </td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.84rem;">
            <i class="${getBrowserIcon(v.browser)}"></i>
            ${escapeHtml(v.browser || 'Unknown')}
          </span>
        </td>
        <td>
          <span class="cell-referrer" title="${escapeHtml(v.referrer || 'Direct')}">
            ${escapeHtml(cleanReferrer(v.referrer))}
          </span>
        </td>
        <td style="text-align: right;">
          <button class="inspect-btn" onclick="openInspectorModal(${index})" title="Inspect full metadata">
            <i class="fa-solid fa-circle-info"></i>
            <span>Details</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderEmptyTelemetryState(message) {
  const tbody = document.getElementById('telemetryTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <i class="fa-solid fa-satellite-dish" style="font-size:2rem;margin-bottom:0.8rem;display:block;color:var(--accent-indigo);"></i>
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
  }
}

// -----------------------------------------------------------------------------
// 7. INSPECTOR MODAL & DEEP DIVE
// -----------------------------------------------------------------------------
function openInspectorModal(index) {
  const visit = adminState.filteredVisits[index];
  if (!visit) return;

  const modal = document.getElementById('inspectorModal');
  const body = document.getElementById('inspectorModalBody');
  const mapsBtn = document.getElementById('inspectorMapsBtn');

  const flag = getCountryFlag(visit.country_code);
  const createdDate = new Date(visit.created_at);

  body.innerHTML = `
    <div class="inspector-grid">
      <div class="inspector-item">
        <span class="inspector-label">Visitor IP Address</span>
        <span class="inspector-val" style="color: #38bdf8; font-weight: 600;">${escapeHtml(visit.ip || 'Unknown')}</span>
      </div>

      <div class="inspector-item">
        <span class="inspector-label">Geographic Location</span>
        <span class="inspector-val">${flag} ${escapeHtml(visit.city || 'Unknown')}, ${escapeHtml(visit.country || 'Unknown')}</span>
      </div>

      <div class="inspector-item">
        <span class="inspector-label">Exact Timestamp</span>
        <span class="inspector-val">${createdDate.toLocaleString()}</span>
      </div>

      <div class="inspector-item">
        <span class="inspector-label">Device & Operating System</span>
        <span class="inspector-val">${escapeHtml(visit.device || 'Desktop')} • ${escapeHtml(visit.os || 'Unknown')}</span>
      </div>

      <div class="inspector-item">
        <span class="inspector-label">Browser & Screen</span>
        <span class="inspector-val">${escapeHtml(visit.browser || 'Unknown')} (${escapeHtml(visit.screen || 'Unknown')})</span>
      </div>

      <div class="inspector-item">
        <span class="inspector-label">Landing Page & Source</span>
        <span class="inspector-val">${escapeHtml(visit.page || '/')} • From: ${escapeHtml(visit.referrer || 'Direct')}</span>
      </div>

      <div class="inspector-item" style="grid-column: span 2;">
        <span class="inspector-label">GPS Coordinates</span>
        <span class="inspector-val">Lat: ${visit.latitude || 'N/A'}, Lon: ${visit.longitude || 'N/A'}</span>
      </div>
    </div>

    <span class="inspector-label" style="margin-bottom: 0.4rem;">Raw Telemetry Payload:</span>
    <pre class="inspector-raw-code">${escapeHtml(JSON.stringify(visit, null, 2))}</pre>
  `;

  if (visit.latitude && visit.longitude) {
    mapsBtn.href = `https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`;
    mapsBtn.style.display = 'inline-flex';
  } else {
    mapsBtn.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function closeInspectorModal() {
  const modal = document.getElementById('inspectorModal');
  if (modal) modal.style.display = 'none';
}

// -----------------------------------------------------------------------------
// 8. DATABASE CONFIGURATION MODAL
// -----------------------------------------------------------------------------
function toggleDatabaseConfigModal() {
  const modal = document.getElementById('configModal');
  if (!modal) return;
  const isShown = modal.style.display === 'flex';
  modal.style.display = isShown ? 'none' : 'flex';
}

function saveDatabaseConfig() {
  const url = document.getElementById('cfgSupabaseUrl').value.trim();
  const key = document.getElementById('cfgSupabaseKey').value.trim();
  const pwd = document.getElementById('cfgAdminPassword').value.trim();

  if (url) localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url);
  if (key) localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, key);
  if (pwd) {
    adminState.authToken = pwd;
    localStorage.setItem(STORAGE_KEY_AUTH, pwd);
  }

  toggleDatabaseConfigModal();
  showToast('Database settings saved securely!');
  adminState.isDemoMode = false;
  document.getElementById('demoBanner').style.display = 'none';
  unlockDashboard();
}

// -----------------------------------------------------------------------------
// 9. EXPORT VISITOR LOG AS CSV
// -----------------------------------------------------------------------------
function exportVisitsToCSV() {
  const visits = adminState.allVisits;
  if (!visits || visits.length === 0) {
    showToast('No visit data available to export.');
    return;
  }

  const headers = [
    'Timestamp (UTC)',
    'IP Address',
    'Country',
    'Country Code',
    'Region',
    'City',
    'Latitude',
    'Longitude',
    'Device',
    'Operating System',
    'Browser',
    'Screen',
    'Page',
    'Referrer'
  ];

  const rows = visits.map(v => [
    v.created_at || '',
    v.ip || '',
    `"${(v.country || '').replace(/"/g, '""')}"`,
    v.country_code || '',
    `"${(v.region || '').replace(/"/g, '""')}"`,
    `"${(v.city || '').replace(/"/g, '""')}"`,
    v.latitude || '',
    v.longitude || '',
    v.device || '',
    v.os || '',
    v.browser || '',
    v.screen || '',
    v.page || '',
    `"${(v.referrer || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const nowStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `sampada_portfolio_telemetry_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Visitor CSV log exported successfully!');
}

// -----------------------------------------------------------------------------
// 10. PREVIEW DEMO TELEMETRY (SIMULATED DATA)
// -----------------------------------------------------------------------------
function activateDemoMode() {
  adminState.isDemoMode = true;
  document.getElementById('demoBanner').style.display = 'flex';
  unlockDashboard();
  loadDemoData();
  showToast('Demo preview mode activated!');
}

function loadDemoData() {
  const now = Date.now();
  const demoVisits = [
    {
      created_at: new Date(now - 3 * 60 * 1000).toISOString(),
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
      created_at: new Date(now - 22 * 60 * 1000).toISOString(),
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
      created_at: new Date(now - 75 * 60 * 1000).toISOString(),
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
      created_at: new Date(now - 140 * 60 * 1000).toISOString(),
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
      created_at: new Date(now - 320 * 60 * 1000).toISOString(),
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
      page: '/#research',
      referrer: 'Direct'
    },
    {
      created_at: new Date(now - 560 * 60 * 1000).toISOString(),
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
      created_at: new Date(now - 1200 * 60 * 1000).toISOString(),
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

  const processed = calculateLocalMetrics(demoVisits);
  processAnalyticsData(processed);
}

// -----------------------------------------------------------------------------
// 11. UTILITY HELPERS
// -----------------------------------------------------------------------------
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2 || countryCode === 'XX') return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1m ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 7200) return '1h ago';
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function cleanReferrer(ref) {
  if (!ref || ref === 'Direct') return 'Direct / Bookmark';
  try {
    if (ref.startsWith('http')) {
      const u = new URL(ref);
      return u.hostname.replace(/^www\./, '');
    }
  } catch {}
  return ref;
}

function getOSIcon(os) {
  if (!os) return 'fa-solid fa-desktop';
  const l = os.toLowerCase();
  if (l.includes('win')) return 'fa-brands fa-windows';
  if (l.includes('mac') || l.includes('ios')) return 'fa-brands fa-apple';
  if (l.includes('android')) return 'fa-brands fa-android';
  if (l.includes('linux')) return 'fa-brands fa-linux';
  return 'fa-solid fa-desktop';
}

function getBrowserIcon(browser) {
  if (!browser) return 'fa-solid fa-globe';
  const l = browser.toLowerCase();
  if (l.includes('chrome')) return 'fa-brands fa-chrome';
  if (l.includes('safari')) return 'fa-brands fa-safari';
  if (l.includes('firefox')) return 'fa-brands fa-firefox-browser';
  if (l.includes('edge')) return 'fa-brands fa-edge';
  if (l.includes('opera')) return 'fa-brands fa-opera';
  return 'fa-solid fa-globe';
}

function getReferrerIcon(ref) {
  if (!ref) return 'fa-solid fa-arrow-right-to-bracket';
  const l = ref.toLowerCase();
  if (l.includes('linkedin')) return 'fa-brands fa-linkedin';
  if (l.includes('github')) return 'fa-brands fa-github';
  if (l.includes('google')) return 'fa-brands fa-google';
  if (l.includes('twitter') || l.includes('x.com')) return 'fa-brands fa-x-twitter';
  return 'fa-solid fa-arrow-right-to-bracket';
}

function copyToClipboard(text, message = 'Copied to clipboard!') {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(message));
  } else {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast(message);
  }
}

function showToast(msg) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
