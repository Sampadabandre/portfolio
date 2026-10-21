/**
 * SAMPADA BANDRE — INLINE OWNER TELEMETRY ENGINE (owner-telemetry.js)
 * Manages the in-page Owner Portal section (#section-owner), secure server-side
 * authentication, live visitor metrics, IP telemetry, multi-criteria filtering,
 * pagination, and local timezone representation.
 */

const ownerInlineState = {
  authToken: null,
  isDemoMode: false,
  allVisits: [],
  filteredVisits: [],
  activeTimeframe: 'all',
  searchQuery: '',
  filterDevice: '',
  filterVisitorType: '',
  filterCountry: '',
  filterBrowser: '',
  currentPage: 1,
  pageSize: 25,
  refreshInterval: null
};

// Storage Keys
const OWNER_STORAGE_AUTH = 'portfolio_admin_auth';
const OWNER_STORAGE_IGNORE = 'portfolio_owner_mode';

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

  // Ensure fresh site entry always opens on About Me section
  if (window.location.hash === '#section-owner' && !savedToken) {
    try {
      history.replaceState(null, '', window.location.pathname);
    } catch {}
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
  const rememberMe = document.getElementById('ownerInlineRemember')?.checked;
  const password = passwordInput.value.trim();

  if (!password) return;

  // Button loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying...</span>';
  alertBox.style.display = 'none';

  try {
    const result = await verifyOwnerCredentials(password);

    if (result.success) {
      ownerInlineState.authToken = password;
      if (rememberMe) {
        localStorage.setItem(OWNER_STORAGE_AUTH, password);
      } else {
        sessionStorage.setItem(OWNER_STORAGE_AUTH, password);
      }

      revealUnlockedOwnerDossier();
      showPortfolioToast('Welcome, Sampada! Confidential dossier unlocked.');
    } else {
      alertBox.textContent = result.message || 'Invalid Master Password. Access restricted to portfolio owner only.';
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
  try {
    const res = await fetch('/api/analytics?limit=1', {
      headers: {
        'x-admin-password': password
      }
    });

    if (res.ok) {
      return { success: true };
    }

    if (res.status === 401) {
      return { success: false, message: 'Invalid Master Password. Access restricted to portfolio owner only.' };
    }

    const data = await res.json().catch(() => ({}));
    if (res.status === 500 && data.message && data.message.includes('ADMIN_PASSWORD')) {
      const curHost = window.location.hostname;
      return {
        success: false,
        message: `Vercel Setup Notice: ADMIN_PASSWORD is not configured for this Vercel deployment (${curHost}). If you configured environment variables on "portfolio-9iu2", please access your site at https://portfolio-9iu2.vercel.app/ or add ADMIN_PASSWORD to this project's Vercel Environment Variables.`
      };
    }

    // In local development server fallback
    if (res.status === 503) {
      return { success: true };
    }

    return { success: false, message: data.message || 'Authentication failed' };
  } catch (err) {
    return { success: false, message: 'Could not connect to /api/analytics: ' + err.message };
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
      if (isManual) showPortfolioToast('Refreshed simulated telemetry.');
      return;
    }

    const response = await fetch('/api/analytics?limit=1000', {
      headers: {
        'x-admin-password': ownerInlineState.authToken || ''
      }
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        renderOwnerTelemetryData(json.data);
        if (isManual) showPortfolioToast('Telemetry data updated from database.');
        return;
      }
    }

    if (response.status === 401) {
      handleInlineOwnerLogout();
      showPortfolioToast('Session expired. Please re-enter master password.');
      return;
    }

    const errData = await response.json().catch(() => ({}));
    if (response.status === 500) {
      renderEmptyOwnerTable(errData.message || 'Server Misconfigured: Please check Vercel environment variables.');
      return;
    }
    if (response.status === 503 || (errData.error && errData.error.includes('Missing'))) {
      renderEmptyOwnerTable('Database Not Connected: Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Vercel Environment Variables.');
      return;
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

// -----------------------------------------------------------------------------
// 5. RENDERING VISUALS & METRICS
// -----------------------------------------------------------------------------
function renderOwnerTelemetryData(data) {
  const { metrics, topPages, countryStats, deviceStats, browserStats, referrerStats, recentVisits } = data;

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

  // 3. Top Visited Pages breakdown
  renderOwnerTopPages(topPages || [], metrics.totalViews || 1);

  // 4. Hardware & Referrer breakdown
  renderOwnerTech(deviceStats, browserStats, referrerStats);

  // 5. Telemetry Table
  ownerInlineState.allVisits = recentVisits || [];
  populateFilterDropdowns(ownerInlineState.allVisits);
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

  const duration = 600;
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

function renderOwnerTopPages(pages, total) {
  const list = document.getElementById('ownerTopPagesContainer');
  const badge = document.getElementById('ownerPagesBadge');
  if (!list) return;

  if (badge) badge.textContent = `${pages.length} ${pages.length === 1 ? 'Page' : 'Pages'}`;

  if (!pages || pages.length === 0) {
    list.innerHTML = '<div class="owner-empty-hint">No page records yet</div>';
    return;
  }

  list.innerHTML = pages.slice(0, 8).map(p => {
    const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
    const pageLabel = p.page === '/' ? '/ (Home • About)' : p.page;
    return `
      <div class="owner-country-row">
        <i class="fa-regular fa-file-code" style="color: var(--accent-gold); width: 22px; text-align: center;"></i>
        <div class="owner-country-info">
          <div class="owner-country-meta">
            <span class="owner-country-label" style="font-family: var(--font-mono); font-size: 0.78rem;">${escapeHtmlSafe(pageLabel)}</span>
            <span class="owner-country-val">${p.count} ${p.count === 1 ? 'view' : 'views'} (${pct}%)</span>
          </div>
          <div class="owner-progress-track">
            <div class="owner-progress-bar" style="width: ${pct}%; background: var(--accent-terracotta);"></div>
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
// 6. POPULATE DYNAMIC FILTER DROPDOWNS
// -----------------------------------------------------------------------------
function populateFilterDropdowns(visits) {
  const countrySelect = document.getElementById('ownerFilterCountry');
  const browserSelect = document.getElementById('ownerFilterBrowser');

  if (countrySelect) {
    const currentVal = countrySelect.value;
    const countries = new Map();
    visits.forEach(v => {
      const cName = v.country && v.country !== 'Unknown' ? v.country : null;
      if (cName) countries.set(cName, (countries.get(cName) || 0) + 1);
    });

    const sorted = [...countries.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    countrySelect.innerHTML = '<option value="">All Countries</option>' +
      sorted.map(([name, count]) => `<option value="${escapeHtmlSafe(name)}">${escapeHtmlSafe(name)} (${count})</option>`).join('');
    countrySelect.value = currentVal;
  }

  if (browserSelect) {
    const currentVal = browserSelect.value;
    const browsers = new Map();
    visits.forEach(v => {
      const br = v.browser && v.browser !== 'Unknown' ? v.browser : null;
      if (br) browsers.set(br, (browsers.get(br) || 0) + 1);
    });

    const sorted = [...browsers.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    browserSelect.innerHTML = '<option value="">All Browsers</option>' +
      sorted.map(([name, count]) => `<option value="${escapeHtmlSafe(name)}">${escapeHtmlSafe(name)} (${count})</option>`).join('');
    browserSelect.value = currentVal;
  }
}

// -----------------------------------------------------------------------------
// 7. MULTI-CRITERIA FILTERING & PAGINATION
// -----------------------------------------------------------------------------
function handleOwnerTableSearch(query) {
  ownerInlineState.searchQuery = (query || '').toLowerCase().trim();
  ownerInlineState.currentPage = 1;
  applyOwnerTableFilters();
}

function setOwnerTimeframe(timeframe, btnEl) {
  ownerInlineState.activeTimeframe = timeframe;
  document.querySelectorAll('.owner-filter-pills .owner-pill-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  ownerInlineState.currentPage = 1;
  applyOwnerTableFilters();
}

function resetOwnerFilters() {
  ownerInlineState.searchQuery = '';
  ownerInlineState.activeTimeframe = 'all';
  ownerInlineState.filterDevice = '';
  ownerInlineState.filterVisitorType = '';
  ownerInlineState.filterCountry = '';
  ownerInlineState.filterBrowser = '';
  ownerInlineState.currentPage = 1;

  const searchInput = document.getElementById('ownerTableSearch');
  if (searchInput) searchInput.value = '';

  const devSelect = document.getElementById('ownerFilterDevice');
  if (devSelect) devSelect.value = '';

  const typeSelect = document.getElementById('ownerFilterVisitorType');
  if (typeSelect) typeSelect.value = '';

  const countrySelect = document.getElementById('ownerFilterCountry');
  if (countrySelect) countrySelect.value = '';

  const browserSelect = document.getElementById('ownerFilterBrowser');
  if (browserSelect) browserSelect.value = '';

  document.querySelectorAll('.owner-filter-pills .owner-pill-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  applyOwnerTableFilters();
  showPortfolioToast('Filters reset.');
}

function applyOwnerTableFilters() {
  const devSelect = document.getElementById('ownerFilterDevice');
  const typeSelect = document.getElementById('ownerFilterVisitorType');
  const countrySelect = document.getElementById('ownerFilterCountry');
  const browserSelect = document.getElementById('ownerFilterBrowser');

  const selectedDevice = devSelect ? devSelect.value : '';
  const selectedType = typeSelect ? typeSelect.value : '';
  const selectedCountry = countrySelect ? countrySelect.value : '';
  const selectedBrowser = browserSelect ? browserSelect.value : '';

  let list = [...ownerInlineState.allVisits];

  // 1. Timeframe filter
  const now = Date.now();
  if (ownerInlineState.activeTimeframe === 'today') {
    const dayMs = 24 * 60 * 60 * 1000;
    list = list.filter(v => now - new Date(v.created_at).getTime() <= dayMs);
  } else if (ownerInlineState.activeTimeframe === 'week') {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    list = list.filter(v => now - new Date(v.created_at).getTime() <= weekMs);
  } else if (ownerInlineState.activeTimeframe === 'month') {
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    list = list.filter(v => now - new Date(v.created_at).getTime() <= monthMs);
  }

  // 2. Search filter
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
        (v.page && v.page.toLowerCase().includes(q)) ||
        (v.referrer && v.referrer.toLowerCase().includes(q)) ||
        (v.session_id && v.session_id.toLowerCase().includes(q)) ||
        (v.visitor_id && v.visitor_id.toLowerCase().includes(q))
      );
    });
  }

  // 3. Device category filter
  if (selectedDevice) {
    list = list.filter(v => (v.device || 'Desktop').toLowerCase() === selectedDevice.toLowerCase());
  }

  // 4. Visitor type filter (new vs returning)
  if (selectedType === 'new') {
    list = list.filter(v => v.is_new_visitor === true);
  } else if (selectedType === 'returning') {
    list = list.filter(v => v.is_new_visitor === false);
  }

  // 5. Country filter
  if (selectedCountry) {
    list = list.filter(v => (v.country || '').toLowerCase() === selectedCountry.toLowerCase());
  }

  // 6. Browser filter
  if (selectedBrowser) {
    list = list.filter(v => (v.browser || '').toLowerCase() === selectedBrowser.toLowerCase());
  }

  ownerInlineState.filteredVisits = list;

  // Pagination calculation
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / ownerInlineState.pageSize) || 1;

  if (ownerInlineState.currentPage > totalPages) {
    ownerInlineState.currentPage = totalPages;
  }
  if (ownerInlineState.currentPage < 1) {
    ownerInlineState.currentPage = 1;
  }

  const startIdx = (ownerInlineState.currentPage - 1) * ownerInlineState.pageSize;
  const paginatedList = list.slice(startIdx, startIdx + ownerInlineState.pageSize);

  renderOwnerTableRows(paginatedList);
  updatePaginationControls(totalItems, totalPages, startIdx, paginatedList.length);

  const countBadge = document.getElementById('ownerTableCount');
  if (countBadge) {
    countBadge.textContent = `${list.length} of ${ownerInlineState.allVisits.length} visitors`;
  }
}

function updatePaginationControls(totalItems, totalPages, startIdx, pageItemsCount) {
  const infoEl = document.getElementById('ownerPaginationInfo');
  const indicatorEl = document.getElementById('ownerPageIndicator');
  const prevBtn = document.getElementById('ownerPrevPageBtn');
  const nextBtn = document.getElementById('ownerNextPageBtn');

  if (infoEl) {
    if (totalItems === 0) {
      infoEl.textContent = 'Showing 0 - 0 of 0 visitors';
    } else {
      const from = startIdx + 1;
      const to = startIdx + pageItemsCount;
      infoEl.textContent = `Showing ${from} - ${to} of ${totalItems.toLocaleString()} visitors`;
    }
  }

  if (indicatorEl) {
    indicatorEl.textContent = `Page ${ownerInlineState.currentPage} of ${totalPages}`;
  }

  if (prevBtn) {
    prevBtn.disabled = ownerInlineState.currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = ownerInlineState.currentPage >= totalPages;
  }
}

function navigateOwnerPage(direction) {
  const totalPages = Math.ceil(ownerInlineState.filteredVisits.length / ownerInlineState.pageSize) || 1;
  const newPage = ownerInlineState.currentPage + direction;

  if (newPage >= 1 && newPage <= totalPages) {
    ownerInlineState.currentPage = newPage;
    applyOwnerTableFilters();
  }
}

function changeOwnerPageSize(newSize) {
  ownerInlineState.pageSize = parseInt(newSize, 10) || 25;
  ownerInlineState.currentPage = 1;
  applyOwnerTableFilters();
}

function renderOwnerTableRows(visits) {
  const tbody = document.getElementById('ownerTelemetryTableBody');
  if (!tbody) return;

  if (!visits || visits.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="owner-empty-hint" style="padding: 2.5rem 1rem; text-align: center;">
          <i class="fa-solid fa-radar" style="font-size:2rem;margin-bottom:0.8rem;display:block;color:var(--accent-gold);"></i>
          <strong style="color:var(--text-primary);display:block;margin-bottom:0.4rem;font-size:1rem;">No Visitor Records Match Criteria</strong>
          <span style="display:block;max-width:440px;margin:0 auto 1.2rem;color:var(--text-secondary);font-size:0.86rem;line-height:1.5;">
            Try adjusting your search query, date filter, or reset your dropdown selections.
          </span>
          <button type="button" class="owner-action-button" onclick="resetOwnerFilters()" style="background:var(--accent-gold);color:#fff;border:none;padding:0.5rem 1.1rem;font-weight:600;border-radius:6px;cursor:pointer;">
            <i class="fa-solid fa-rotate-left"></i> Reset All Filters
          </button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visits.map((v, idx) => {
    const flag = getCountryFlagEmoji(v.country_code);
    const timeRel = formatRelTime(v.created_at);
    // Display in viewer's local browser timezone
    const localFullDate = new Date(v.created_at).toLocaleString();
    const city = v.city && v.city !== 'Unknown' ? v.city : 'Unknown City';
    const country = v.country && v.country !== 'Unknown' ? v.country : 'Unknown Country';
    const ipSafe = escapeHtmlSafe(v.ip || '127.0.0.1');
    const pageSafe = escapeHtmlSafe(v.page || '/');
    const isNew = v.is_new_visitor !== false;
    const badgeHtml = isNew
      ? '<span class="owner-badge-new" title="First time visitor">New</span>'
      : '<span class="owner-badge-returning" title="Returning visitor">Returning</span>';

    // Global index in filteredVisits array for modal
    const globalIdx = (ownerInlineState.currentPage - 1) * ownerInlineState.pageSize + idx;

    return `
      <tr>
        <td>${badgeHtml}</td>
        <td><span class="owner-col-time" title="${localFullDate}">${timeRel}</span></td>
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
          <span class="owner-page-cell" title="${pageSafe}">${pageSafe}</span>
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
          <button type="button" class="owner-detail-btn" onclick="openTelemetryModal(${globalIdx})" title="View full telemetry payload">
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
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="owner-empty-hint" style="padding: 2.5rem 1rem; text-align: center;">
          <i class="fa-solid fa-database" style="font-size:2rem;margin-bottom:0.8rem;display:block;color:var(--accent-gold);"></i>
          <strong style="color:var(--text-primary);display:block;margin-bottom:0.4rem;font-size:1rem;">Visitor Database Status</strong>
          <span style="display:block;max-width:480px;margin:0 auto 1.2rem;color:var(--text-secondary);font-size:0.86rem;line-height:1.5;">
            ${escapeHtmlSafe(msg)}
          </span>
          <button type="button" class="owner-action-button" onclick="toggleDatabaseConfigModal()" style="background:var(--accent-gold);color:#fff;border:none;padding:0.6rem 1.3rem;font-weight:600;border-radius:8px;box-shadow:var(--shadow-sm);cursor:pointer;">
            <i class="fa-solid fa-sliders"></i> Open Database Setup Guide
          </button>
        </td>
      </tr>
    `;
  }
}

// -----------------------------------------------------------------------------
// 8. INSPECTOR MODAL
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
  const localDateStr = createdDate.toLocaleString();
  const utcDateStr = createdDate.toUTCString();

  const isNew = visit.is_new_visitor !== false;
  const visitorTypeLabel = isNew ? 'New Visitor (First Visit)' : 'Returning Visitor';
  const deviceModelSafe = visit.device_model && visit.device_model !== 'Unknown' ? visit.device_model : 'Unknown';

  body.innerHTML = `
    <div class="telemetry-grid-details">
      <div class="telemetry-detail-item">
        <span class="detail-label">Visitor IP</span>
        <span class="detail-value" style="color: var(--accent-gold); font-weight: 700;">${escapeHtmlSafe(visit.ip || 'Unknown')}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Geographic Location</span>
        <span class="detail-value">${flag} ${escapeHtmlSafe(visit.city || 'Unknown')}, ${escapeHtmlSafe(visit.region || 'Unknown')}, ${escapeHtmlSafe(visit.country || 'Unknown')}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Local Time (${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'})</span>
        <span class="detail-value">${localDateStr}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">UTC Timestamp</span>
        <span class="detail-value">${utcDateStr}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Visitor Type & Session</span>
        <span class="detail-value">${visitorTypeLabel}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Page Path Visited</span>
        <span class="detail-value" style="color: var(--accent-terracotta);">${escapeHtmlSafe(visit.page || '/')}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Hardware & Device Model</span>
        <span class="detail-value">${escapeHtmlSafe(visit.device || 'Desktop')} (Model: ${escapeHtmlSafe(deviceModelSafe)})</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Operating System</span>
        <span class="detail-value">${escapeHtmlSafe(visit.os || 'Unknown')}</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Browser & Screen</span>
        <span class="detail-value">${escapeHtmlSafe(visit.browser || 'Unknown')} ${escapeHtmlSafe(visit.browser_version || '')} (${escapeHtmlSafe(visit.screen || 'Unknown')})</span>
      </div>

      <div class="telemetry-detail-item">
        <span class="detail-label">Referral Origin</span>
        <span class="detail-value">${escapeHtmlSafe(visit.referrer || 'Direct')}</span>
      </div>

      <div class="telemetry-detail-item" style="grid-column: span 2;">
        <span class="detail-label">Session & Visitor Tokens</span>
        <span class="detail-value" style="font-size: 0.76rem; word-break: break-all;">Session: ${escapeHtmlSafe(visit.session_id || 'N/A')} • Visitor ID: ${escapeHtmlSafe(visit.visitor_id || 'N/A')}</span>
      </div>

      <div class="telemetry-detail-item" style="grid-column: span 2;">
        <span class="detail-label">Approximate GPS Coordinates</span>
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
// 9. CSV EXPORT
// -----------------------------------------------------------------------------
function exportInlineVisitsToCSV() {
  const visits = ownerInlineState.allVisits;
  if (!visits || visits.length === 0) {
    showPortfolioToast('No visitor records to export.');
    return;
  }

  const headers = [
    'Timestamp (UTC)',
    'IP Address',
    'Visitor Type',
    'Country',
    'Country Code',
    'City',
    'Region',
    'Page',
    'Device',
    'Device Model',
    'OS',
    'Browser',
    'Browser Version',
    'Screen',
    'Referrer',
    'Session ID',
    'Visitor ID',
    'Latitude',
    'Longitude'
  ];

  const rows = visits.map(v => [
    v.created_at || '',
    v.ip || '',
    v.is_new_visitor === false ? 'Returning' : 'New',
    `"${(v.country || '').replace(/"/g, '""')}"`,
    v.country_code || '',
    `"${(v.city || '').replace(/"/g, '""')}"`,
    `"${(v.region || '').replace(/"/g, '""')}"`,
    `"${(v.page || '/').replace(/"/g, '""')}"`,
    v.device || '',
    `"${(v.device_model || 'Unknown').replace(/"/g, '""')}"`,
    `"${(v.os || '').replace(/"/g, '""')}"`,
    `"${(v.browser || '').replace(/"/g, '""')}"`,
    `"${(v.browser_version || '').replace(/"/g, '""')}"`,
    v.screen || '',
    `"${(v.referrer || '').replace(/"/g, '""')}"`,
    v.session_id || '',
    v.visitor_id || '',
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
// 10. INLINE DEMO PREVIEW
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
      id: 'demo-1',
      created_at: new Date(now - 4 * 60 * 1000).toISOString(),
      ip: '103.112.214.50',
      city: 'Nagpur',
      region: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      latitude: 21.1458,
      longitude: 79.0882,
      device: 'Desktop',
      device_model: 'Mac',
      os: 'macOS 14.4',
      browser: 'Chrome',
      browser_version: '124.0',
      screen: '1920x1080',
      page: '/',
      referrer: 'https://www.linkedin.com/in/sampada-bandre/',
      session_id: 'sess-demo-1',
      visitor_id: 'vis-demo-1',
      is_new_visitor: true
    },
    {
      id: 'demo-2',
      created_at: new Date(now - 25 * 60 * 1000).toISOString(),
      ip: '152.58.12.91',
      city: 'Pune',
      region: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      latitude: 18.5204,
      longitude: 73.8567,
      device: 'Desktop',
      device_model: 'PC',
      os: 'Windows 11',
      browser: 'Edge',
      browser_version: '124.0',
      screen: '2560x1440',
      page: '/#projects',
      referrer: 'https://github.com/Sampadabandre',
      session_id: 'sess-demo-2',
      visitor_id: 'vis-demo-2',
      is_new_visitor: false
    },
    {
      id: 'demo-3',
      created_at: new Date(now - 68 * 60 * 1000).toISOString(),
      ip: '172.56.21.104',
      city: 'San Francisco',
      region: 'California',
      country: 'United States',
      country_code: 'US',
      latitude: 37.7749,
      longitude: -122.4194,
      device: 'Mobile',
      device_model: 'iPhone',
      os: 'iOS 17.4',
      browser: 'Safari',
      browser_version: '17.4',
      screen: '393x852',
      page: '/',
      referrer: 'Direct',
      session_id: 'sess-demo-3',
      visitor_id: 'vis-demo-3',
      is_new_visitor: true
    },
    {
      id: 'demo-4',
      created_at: new Date(now - 145 * 60 * 1000).toISOString(),
      ip: '185.199.108.153',
      city: 'London',
      region: 'England',
      country: 'United Kingdom',
      country_code: 'GB',
      latitude: 51.5074,
      longitude: -0.1278,
      device: 'Desktop',
      device_model: 'Mac',
      os: 'macOS 14.2',
      browser: 'Safari',
      browser_version: '17.2',
      screen: '1728x1117',
      page: '/#patent',
      referrer: 'https://www.google.com/',
      session_id: 'sess-demo-4',
      visitor_id: 'vis-demo-4',
      is_new_visitor: true
    },
    {
      id: 'demo-5',
      created_at: new Date(now - 310 * 60 * 1000).toISOString(),
      ip: '103.24.120.4',
      city: 'Bengaluru',
      region: 'Karnataka',
      country: 'India',
      country_code: 'IN',
      latitude: 12.9716,
      longitude: 77.5946,
      device: 'Desktop',
      device_model: 'PC',
      os: 'Linux',
      browser: 'Firefox',
      browser_version: '125.0',
      screen: '1920x1080',
      page: '/#skills',
      referrer: 'Direct',
      session_id: 'sess-demo-5',
      visitor_id: 'vis-demo-5',
      is_new_visitor: false
    },
    {
      id: 'demo-6',
      created_at: new Date(now - 550 * 60 * 1000).toISOString(),
      ip: '141.101.90.12',
      city: 'Munich',
      region: 'Bavaria',
      country: 'Germany',
      country_code: 'DE',
      latitude: 48.1351,
      longitude: 11.5820,
      device: 'Tablet',
      device_model: 'iPad',
      os: 'iOS 17.3',
      browser: 'Safari',
      browser_version: '17.3',
      screen: '820x1180',
      page: '/',
      referrer: 'https://www.linkedin.com/',
      session_id: 'sess-demo-6',
      visitor_id: 'vis-demo-6',
      is_new_visitor: true
    },
    {
      id: 'demo-7',
      created_at: new Date(now - 1100 * 60 * 1000).toISOString(),
      ip: '202.131.110.15',
      city: 'Mumbai',
      region: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      latitude: 19.0760,
      longitude: 72.8777,
      device: 'Mobile',
      device_model: 'Samsung Galaxy',
      os: 'Android 14',
      browser: 'Chrome',
      browser_version: '124.0',
      screen: '412x915',
      page: '/#education',
      referrer: 'Direct',
      session_id: 'sess-demo-7',
      visitor_id: 'vis-demo-7',
      is_new_visitor: false
    }
  ];

  const processed = calculateTelemetryMetrics(demoVisits);
  renderOwnerTelemetryData(processed);
}

function calculateTelemetryMetrics(visits) {
  const totalViews = visits.length;
  const uniqueVisitorsSet = new Set();
  const countryMap = {};
  const cityMap = {};
  const pageMap = {};
  const deviceMap = { Desktop: 0, Mobile: 0, Tablet: 0, Unknown: 0 };
  const browserMap = {};
  const referrerMap = {};

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let todayViews = 0;
  let weekViews = 0;

  visits.forEach(v => {
    if (v.visitor_id) uniqueVisitorsSet.add(v.visitor_id);
    else if (v.ip) uniqueVisitorsSet.add(v.ip);

    const vDate = new Date(v.created_at);
    if (vDate >= oneDayAgo) todayViews++;
    if (vDate >= sevenDaysAgo) weekViews++;

    const p = v.page || '/';
    pageMap[p] = (pageMap[p] || 0) + 1;

    const cCode = (v.country_code || 'XX').toUpperCase();
    const cName = v.country || 'Unknown';
    if (!countryMap[cCode]) {
      countryMap[cCode] = { code: cCode, name: cName, count: 0, flag: getCountryFlagEmoji(cCode) };
    }
    countryMap[cCode].count++;

    const dev = v.device || 'Desktop';
    if (deviceMap[dev] !== undefined) deviceMap[dev]++;
    else deviceMap.Unknown++;

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

  const topPages = Object.entries(pageMap)
    .map(([page, count]) => ({ page, count, percent: Math.round((count / totalViews) * 100) }))
    .sort((a, b) => b.count - a.count);

  return {
    metrics: {
      totalViews,
      uniqueVisitors: uniqueVisitorsSet.size,
      todayViews,
      weekViews,
      topCountry
    },
    topPages,
    countryStats,
    cityStats: Object.entries(cityMap).map(([name, count]) => ({ name, count })),
    deviceStats: deviceMap,
    browserStats: browserMap,
    referrerStats: referrerMap,
    recentVisits: visits
  };
}

// -----------------------------------------------------------------------------
// 11. UTILITIES
// -----------------------------------------------------------------------------
function getCountryFlagEmoji(cc) {
  if (!cc || cc.length !== 2 || cc === 'XX') return '🌐';
  const code = cc.toLowerCase();
  return `<img src="https://flagcdn.com/20x15/${code}.png" class="owner-flag-img" alt="${cc.toUpperCase()}" style="vertical-align: middle; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); display: inline-block;">`;
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

// -----------------------------------------------------------------------------
// 12. TEST & LOG CURRENT VISIT DIRECTLY
// -----------------------------------------------------------------------------
async function logTestVisitNow() {
  showPortfolioToast('Sending live test visit to /api/track...');
  try {
    const meta = {
      isTest: true,
      screen: `${window.screen.width}x${window.screen.height}`,
      page: window.location.pathname || '/',
      referrer: 'Direct (Owner Manual Test)',
      userAgent: navigator.userAgent
    };

    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta)
    });

    if (res.ok) {
      showPortfolioToast('✅ Live visit captured! Refreshing table...');
      setTimeout(() => refreshInlineAnalytics(true), 600);
    } else {
      showPortfolioToast('Server error recording visit.');
    }
  } catch (err) {
    console.error('Test visit error:', err);
    showPortfolioToast('Could not reach /api/track: ' + err.message);
  }
}

// -----------------------------------------------------------------------------
// 13. DATABASE CONFIGURATION MODAL & HELPERS
// -----------------------------------------------------------------------------
function toggleDatabaseConfigModal() {
  const modal = document.getElementById('configModal');
  if (!modal) return;
  const isHidden = modal.style.display === 'none' || !modal.style.display;
  modal.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    const notice = document.getElementById('cfgStatusNotice');
    if (notice) notice.style.display = 'none';
  }
}

const SUPABASE_SCHEMA_TEXT = `-- ==========================================================
-- SAMPADA BANDRE PORTFOLIO — VISITOR TRACKING DATABASE SCHEMA
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.portfolio_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  ip TEXT NOT NULL DEFAULT 'Unknown',
  city TEXT DEFAULT 'Unknown',
  region TEXT DEFAULT 'Unknown',
  country TEXT DEFAULT 'Unknown',
  country_code TEXT DEFAULT 'XX',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  device TEXT DEFAULT 'Desktop',
  device_model TEXT DEFAULT 'Unknown',
  browser TEXT DEFAULT 'Unknown',
  browser_version TEXT DEFAULT 'Unknown',
  os TEXT DEFAULT 'Unknown',
  screen TEXT DEFAULT 'Unknown',
  page TEXT DEFAULT '/',
  referrer TEXT DEFAULT 'Direct',
  session_id TEXT,
  visitor_id TEXT,
  is_new_visitor BOOLEAN DEFAULT true,
  user_agent TEXT
);

ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS device_model TEXT DEFAULT 'Unknown';
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS browser_version TEXT DEFAULT 'Unknown';
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS is_new_visitor BOOLEAN DEFAULT true;
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS page TEXT DEFAULT '/';

CREATE INDEX IF NOT EXISTS idx_portfolio_visits_created_at ON public.portfolio_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_ip ON public.portfolio_visits (ip);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_country ON public.portfolio_visits (country_code);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_visitor_id ON public.portfolio_visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_session_id ON public.portfolio_visits (session_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_page ON public.portfolio_visits (page);

ALTER TABLE public.portfolio_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert visits" ON public.portfolio_visits;
CREATE POLICY "Allow anonymous insert visits"
  ON public.portfolio_visits
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select for service_role only" ON public.portfolio_visits;
CREATE POLICY "Allow select for service_role only"
  ON public.portfolio_visits
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Allow delete for service_role only" ON public.portfolio_visits;
CREATE POLICY "Allow delete for service_role only"
  ON public.portfolio_visits
  FOR DELETE
  TO service_role
  USING (true);
`;

function copySqlSchemaToClipboard() {
  copyOwnerText(SUPABASE_SCHEMA_TEXT, '✅ SQL Schema copied to clipboard! Paste it into Supabase SQL Editor.');
}

async function testDatabaseConnection() {
  const btn = document.getElementById('cfgTestBtn');
  const notice = document.getElementById('cfgStatusNotice');
  if (!btn || !notice) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';
  notice.style.display = 'none';

  try {
    const res = await fetch('/api/analytics?limit=1', {
      headers: {
        'x-admin-password': ownerInlineState.authToken || ''
      }
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      notice.style.display = 'block';
      notice.style.background = 'rgba(45, 106, 79, 0.12)';
      notice.style.color = 'var(--accent-forest)';
      notice.style.border = '1px solid rgba(45, 106, 79, 0.3)';
      notice.innerHTML = '<i class="fa-solid fa-circle-check"></i> <strong>Success!</strong> Backend connected to database successfully. Real visitor tracking is active.';
    } else {
      notice.style.display = 'block';
      notice.style.background = 'rgba(201, 42, 42, 0.1)';
      notice.style.color = 'var(--stamp-red)';
      notice.style.border = '1px solid rgba(201, 42, 42, 0.3)';
      notice.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Notice:</strong> ${escapeHtmlSafe(data.message || data.error || 'Connection failed. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured in Vercel.')}`;
    }
  } catch (err) {
    notice.style.display = 'block';
    notice.style.background = 'rgba(201, 42, 42, 0.1)';
    notice.style.color = 'var(--stamp-red)';
    notice.style.border = '1px solid rgba(201, 42, 42, 0.3)';
    notice.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Error:</strong> ${escapeHtmlSafe(err.message)}`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-plug"></i> Test Connection';
  }
}
