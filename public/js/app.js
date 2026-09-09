const state = {
  currencies: [],
  sourceCurrency: 'USD',
  targetCurrency: 'EUR',
  amount: 1000,
  favorites: [],
  chartInstance: null,
  isTravelMode: false,
  travelBase: 'USD',
  travelAmount: 2000
};

const dom = {
  sourceCurrency: document.getElementById('sourceCurrency'),
  targetCurrency: document.getElementById('targetCurrency'),
  sourceAmount: document.getElementById('sourceAmount'),
  sourceSymbol: document.getElementById('sourceSymbol'),
  sourceFlag: document.getElementById('sourceFlag'),
  targetFlag: document.getElementById('targetFlag'),
  swapCurrenciesBtn: document.getElementById('swapCurrenciesBtn'),
  favoriteBtn: document.getElementById('favoriteBtn'),
  starIcon: document.getElementById('starIcon'),
  resultSubtext: document.getElementById('resultSubtext'),
  resultAmount: document.getElementById('resultAmount'),
  resultTargetCode: document.getElementById('resultTargetCode'),
  directRateText: document.getElementById('directRateText'),
  inverseRateText: document.getElementById('inverseRateText'),
  lastUpdatedText: document.getElementById('lastUpdatedText'),
  chartPairSubtitle: document.getElementById('chartPairSubtitle'),
  trendChangeBadge: document.getElementById('trendChangeBadge'),
  statHigh: document.getElementById('statHigh'),
  statLow: document.getElementById('statLow'),
  statAvg: document.getElementById('statAvg'),
  chartLoading: document.getElementById('chartLoading'),
  trendChart: document.getElementById('trendChart'),
  travelModeToggle: document.getElementById('travelModeToggle'),
  travelBudgetSection: document.getElementById('travelBudgetSection'),
  travelBaseAmount: document.getElementById('travelBaseAmount'),
  travelBaseCurrency: document.getElementById('travelBaseCurrency'),
  travelBaseFlag: document.getElementById('travelBaseFlag'),
  travelTableBody: document.getElementById('travelTableBody'),
  favoritesCount: document.getElementById('favoritesCount'),
  favoritesList: document.getElementById('favoritesList'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  quickAmountButtons: document.querySelectorAll('.chip-btn')
};

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Request failed');
  }
  return response.json();
}

async function init() {
  await loadCurrencies();
  setupEventListeners();
  await Promise.all([
    performConversion(),
    loadHistoricalTrends(),
    loadFavorites(),
    loadHistory()
  ]);
}

async function loadCurrencies() {
  try {
    const res = await api('/api/currencies');
    state.currencies = res.data;
    populateCurrencySelectors();
  } catch (err) {
    console.error(err);
  }
}

function populateCurrencySelectors() {
  const optionsHtml = state.currencies
    .map((c) => `<option value="${c.code}">${c.code} - ${c.name}</option>`)
    .join('');

  dom.sourceCurrency.innerHTML = optionsHtml;
  dom.targetCurrency.innerHTML = optionsHtml;
  dom.travelBaseCurrency.innerHTML = optionsHtml;

  dom.sourceCurrency.value = state.sourceCurrency;
  dom.targetCurrency.value = state.targetCurrency;
  dom.travelBaseCurrency.value = state.travelBase;

  updateCurrencyBadges();
}

function updateCurrencyBadges() {
  const source = state.currencies.find((c) => c.code === state.sourceCurrency);
  const target = state.currencies.find((c) => c.code === state.targetCurrency);
  const travelBase = state.currencies.find((c) => c.code === state.travelBase);

  if (source) {
    dom.sourceFlag.textContent = source.flag;
    dom.sourceSymbol.textContent = source.symbol;
  }
  if (target) {
    dom.targetFlag.textContent = target.flag;
  }
  if (travelBase) {
    dom.travelBaseFlag.textContent = travelBase.flag;
  }
  updateFavoriteButtonState();
}

async function performConversion() {
  const amountVal = parseFloat(dom.sourceAmount.value);
  state.amount = isNaN(amountVal) ? 0 : amountVal;

  try {
    const res = await api('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: state.sourceCurrency,
        target: state.targetCurrency,
        amount: state.amount
      })
    });

    const data = res.data;
    dom.resultSubtext.textContent = `${formatNumber(data.amount)} ${data.source} =`;
    dom.resultAmount.textContent = formatNumber(data.result);
    dom.resultTargetCode.textContent = data.target;
    dom.directRateText.textContent = `1 ${data.source} = ${data.rate.toFixed(4)} ${data.target}`;
    dom.inverseRateText.textContent = `1 ${data.target} = ${data.inverseRate.toFixed(4)} ${data.source}`;
    dom.lastUpdatedText.textContent = `Live at ${new Date(data.timestamp).toLocaleTimeString()}`;

    loadHistory();
  } catch (err) {
    console.error(err);
  }
}

async function loadHistoricalTrends() {
  dom.chartPairSubtitle.textContent = `Exchange rate trajectory for ${state.sourceCurrency} to ${state.targetCurrency}`;
  dom.chartLoading.classList.remove('hidden');

  try {
    const res = await api(`/api/history/trends?source=${state.sourceCurrency}&target=${state.targetCurrency}`);
    const trends = res.data;

    dom.statHigh.textContent = trends.stats.max.toFixed(4);
    dom.statLow.textContent = trends.stats.min.toFixed(4);
    dom.statAvg.textContent = trends.stats.avg.toFixed(4);

    const change = trends.stats.changePercent;
    const sign = change > 0 ? '+' : '';
    dom.trendChangeBadge.textContent = `${sign}${change}% (30d)`;
    dom.trendChangeBadge.className = 'trend-badge ' + (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral');

    renderChart(trends.points);
  } catch (err) {
    console.error(err);
  } finally {
    dom.chartLoading.classList.add('hidden');
  }
}

function renderChart(points) {
  const labels = points.map((p) => {
    const parts = p.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  });
  const dataValues = points.map((p) => p.rate);

  const ctx = dom.trendChart.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

  if (state.chartInstance) {
    state.chartInstance.destroy();
  }

  state.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `${state.sourceCurrency}/${state.targetCurrency}`,
          data: dataValues,
          borderColor: '#6366f1',
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          pointHitRadius: 10,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#6366f1',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items) => `Date: ${items[0].label}`,
            label: (item) => `Rate: ${parseFloat(item.parsed.y).toFixed(4)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#64748b', maxTicksLimit: 8, font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            color: '#64748b',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (val) => val.toFixed(3)
          }
        }
      }
    }
  });
}

async function loadFavorites() {
  try {
    const res = await api('/api/favorites');
    state.favorites = res.data;
    renderFavorites();
    updateFavoriteButtonState();
  } catch (err) {
    console.error(err);
  }
}

function renderFavorites() {
  dom.favoritesCount.textContent = `${state.favorites.length} Pairs`;

  if (state.favorites.length === 0) {
    dom.favoritesList.innerHTML = `<div class="fav-rate">No favorite pairs saved yet.</div>`;
    return;
  }

  dom.favoritesList.innerHTML = state.favorites
    .map((fav) => {
      const rateDisplay = fav.currentRate ? `1 ${fav.source_currency} = ${fav.currentRate.toFixed(4)} ${fav.target_currency}` : 'Rate updating...';
      return `
        <div class="favorite-card" data-source="${fav.source_currency}" data-target="${fav.target_currency}">
          <div class="fav-info">
            <div class="fav-pair">${fav.source_currency} → ${fav.target_currency}</div>
            <div class="fav-rate">${rateDisplay}</div>
          </div>
          <button class="fav-delete-btn" data-id="${fav.id}" title="Remove favorite">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    })
    .join('');

  dom.favoritesList.querySelectorAll('.favorite-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.fav-delete-btn')) {
        return;
      }
      const s = card.getAttribute('data-source');
      const t = card.getAttribute('data-target');
      selectPair(s, t);
    });
  });

  dom.favoritesList.querySelectorAll('.fav-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      try {
        await api(`/api/favorites/${id}`, { method: 'DELETE' });
        await loadFavorites();
      } catch (err) {
        console.error(err);
      }
    });
  });
}

function isCurrentPairFavorited() {
  return state.favorites.some(
    (f) => f.source_currency === state.sourceCurrency && f.target_currency === state.targetCurrency
  );
}

function updateFavoriteButtonState() {
  const isFav = isCurrentPairFavorited();
  if (isFav) {
    dom.favoriteBtn.classList.add('favorited');
    dom.starIcon.setAttribute('fill', 'currentColor');
  } else {
    dom.favoriteBtn.classList.remove('favorited');
    dom.starIcon.setAttribute('fill', 'none');
  }
}

async function toggleCurrentFavorite() {
  const isFav = isCurrentPairFavorited();
  if (isFav) {
    const existing = state.favorites.find(
      (f) => f.source_currency === state.sourceCurrency && f.target_currency === state.targetCurrency
    );
    if (existing) {
      await api(`/api/favorites/${existing.id}`, { method: 'DELETE' });
    }
  } else {
    await api('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: state.sourceCurrency,
        target: state.targetCurrency
      })
    });
  }
  await loadFavorites();
}

async function loadHistory() {
  try {
    const res = await api('/api/history?limit=8');
    const list = res.data;

    if (list.length === 0) {
      dom.historyList.innerHTML = `<div class="fav-rate">No recent conversions recorded.</div>`;
      return;
    }

    dom.historyList.innerHTML = list
      .map((item) => {
        const timeAgo = formatTimeAgo(item.created_at);
        return `
          <div class="history-item" data-source="${item.source_currency}" data-target="${item.target_currency}" data-amount="${item.amount}">
            <div class="history-main">
              <span class="history-amount-pair">${formatNumber(item.amount)} ${item.source_currency} → ${formatNumber(item.result)} ${item.target_currency}</span>
              <span class="history-rate">Rate: ${item.rate.toFixed(4)}</span>
            </div>
            <span class="history-time">${timeAgo}</span>
          </div>
        `;
      })
      .join('');

    dom.historyList.querySelectorAll('.history-item').forEach((row) => {
      row.addEventListener('click', () => {
        const s = row.getAttribute('data-source');
        const t = row.getAttribute('data-target');
        const amt = row.getAttribute('data-amount');
        dom.sourceAmount.value = amt;
        selectPair(s, t);
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function clearHistory() {
  try {
    await api('/api/history', { method: 'DELETE' });
    loadHistory();
  } catch (err) {
    console.error(err);
  }
}

async function loadTravelBudget() {
  const amountVal = parseFloat(dom.travelBaseAmount.value);
  state.travelAmount = isNaN(amountVal) ? 0 : amountVal;

  try {
    const res = await api(`/api/travel-budget?base=${state.travelBase}&amount=${state.travelAmount}`);
    const data = res.data;
    renderTravelTable(data);
  } catch (err) {
    console.error(err);
  }
}

function renderTravelTable(data) {
  dom.travelTableBody.innerHTML = data.comparison
    .map((item) => {
      const powerBadge = item.rate >= 100
        ? 'High Nominal Unit'
        : item.rate <= 0.8
        ? 'Strong Currency'
        : 'Standard Balance';

      return `
        <tr>
          <td>
            <div class="table-currency-cell">
              <span class="table-flag">${item.flag}</span>
              <div>
                <div class="table-currency-code">${item.currency}</div>
                <div class="fav-rate">${item.symbol}</div>
              </div>
            </div>
          </td>
          <td>${item.name}</td>
          <td class="table-rate-mono">1 ${data.base.code} = ${item.rate.toFixed(4)} ${item.currency}</td>
          <td><span class="budget-highlight">${item.formattedValue}</span></td>
          <td><span class="power-indicator">${powerBadge}</span></td>
        </tr>
      `;
    })
    .join('');
}

function selectPair(source, target) {
  state.sourceCurrency = source;
  state.targetCurrency = target;
  dom.sourceCurrency.value = source;
  dom.targetCurrency.value = target;
  updateCurrencyBadges();
  performConversion();
  loadHistoricalTrends();
}

function swapCurrencies() {
  const temp = state.sourceCurrency;
  state.sourceCurrency = state.targetCurrency;
  state.targetCurrency = temp;

  dom.sourceCurrency.value = state.sourceCurrency;
  dom.targetCurrency.value = state.targetCurrency;

  updateCurrencyBadges();
  performConversion();
  loadHistoricalTrends();
}

function setupEventListeners() {
  let convertTimer = null;
  dom.sourceAmount.addEventListener('input', () => {
    clearTimeout(convertTimer);
    convertTimer = setTimeout(performConversion, 250);
  });

  dom.sourceCurrency.addEventListener('change', (e) => {
    state.sourceCurrency = e.target.value;
    updateCurrencyBadges();
    performConversion();
    loadHistoricalTrends();
  });

  dom.targetCurrency.addEventListener('change', (e) => {
    state.targetCurrency = e.target.value;
    updateCurrencyBadges();
    performConversion();
    loadHistoricalTrends();
  });

  dom.swapCurrenciesBtn.addEventListener('click', swapCurrencies);

  dom.favoriteBtn.addEventListener('click', toggleCurrentFavorite);

  dom.quickAmountButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      dom.sourceAmount.value = btn.getAttribute('data-amt');
      performConversion();
    });
  });

  dom.travelModeToggle.addEventListener('change', (e) => {
    state.isTravelMode = e.target.checked;
    if (state.isTravelMode) {
      dom.travelBudgetSection.classList.remove('hidden');
      loadTravelBudget();
      dom.travelBudgetSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      dom.travelBudgetSection.classList.add('hidden');
    }
  });

  let travelTimer = null;
  dom.travelBaseAmount.addEventListener('input', () => {
    clearTimeout(travelTimer);
    travelTimer = setTimeout(loadTravelBudget, 250);
  });

  dom.travelBaseCurrency.addEventListener('change', (e) => {
    state.travelBase = e.target.value;
    updateCurrencyBadges();
    loadTravelBudget();
  });

  dom.clearHistoryBtn.addEventListener('click', clearHistory);
}

function formatNumber(num) {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
}

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

document.addEventListener('DOMContentLoaded', init);
