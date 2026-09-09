import { formatNumber, debounce } from './modules/utils.js';
import {
  fetchCurrencies,
  convertCurrency,
  fetchHistoricalTrends,
  fetchFavorites,
  addFavorite,
  removeFavorite,
  fetchHistory,
  clearHistory,
  fetchTravelBudget
} from './modules/api.js';
import { updateTrendChart } from './modules/chartManager.js';
import { renderFavorites, updateFavoriteStarButton } from './modules/favoritesManager.js';
import { renderHistory } from './modules/historyManager.js';
import { renderTravelComparisonTable, exportTravelBudgetCsv, buildTravelSummaryText } from './modules/travelManager.js';

const state = {
  currencies: [],
  sourceCurrency: 'USD',
  targetCurrency: 'EUR',
  amount: 1000,
  favorites: [],
  isTravelMode: false,
  travelBase: 'USD',
  travelAmount: 2000,
  travelDays: 7,
  lastTravelData: null
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
  marketRatingBadge: document.getElementById('marketRatingBadge'),
  marketAdviceText: document.getElementById('marketAdviceText'),
  marketMeterFill: document.getElementById('marketMeterFill'),
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
  durationChips: document.querySelectorAll('.duration-chip'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  copyBudgetBtn: document.getElementById('copyBudgetBtn'),
  copyShareLinkBtn: document.getElementById('copyShareLinkBtn'),
  shareBtnText: document.getElementById('shareBtnText'),
  favoritesCount: document.getElementById('favoritesCount'),
  favoritesList: document.getElementById('favoritesList'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  quickAmountButtons: document.querySelectorAll('.chip-btn')
};

async function init() {
  readUrlParameters();
  await loadCurrencies();
  setupEventListeners();
  await Promise.all([
    performConversion(),
    loadHistoricalTrends(),
    loadFavorites(),
    loadHistory()
  ]);

  if (state.isTravelMode) {
    dom.travelModeToggle.checked = true;
    dom.travelBudgetSection.classList.remove('hidden');
    loadTravelBudget();
  }
}

function readUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('src')) state.sourceCurrency = params.get('src').toUpperCase();
  if (params.has('tgt')) state.targetCurrency = params.get('tgt').toUpperCase();
  if (params.has('amt')) {
    const parsed = parseFloat(params.get('amt'));
    if (!isNaN(parsed) && parsed >= 0) {
      state.amount = parsed;
      dom.sourceAmount.value = parsed;
    }
  }
  if (params.has('travel') && params.get('travel') === '1') {
    state.isTravelMode = true;
  }
  if (params.has('days')) {
    const days = parseInt(params.get('days'), 10);
    if (days > 0) state.travelDays = days;
  }
}

function syncUrlParameters() {
  const params = new URLSearchParams();
  params.set('src', state.sourceCurrency);
  params.set('tgt', state.targetCurrency);
  params.set('amt', state.amount);
  if (state.isTravelMode) {
    params.set('travel', '1');
    params.set('days', state.travelDays);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

async function loadCurrencies() {
  try {
    state.currencies = await fetchCurrencies();
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
  updateFavoriteState();
}

async function performConversion() {
  const amountVal = parseFloat(dom.sourceAmount.value);
  state.amount = isNaN(amountVal) ? 0 : amountVal;

  try {
    const data = await convertCurrency(state.sourceCurrency, state.targetCurrency, state.amount);

    dom.resultSubtext.textContent = `${formatNumber(data.amount)} ${data.source} =`;
    dom.resultAmount.textContent = formatNumber(data.result);
    dom.resultTargetCode.textContent = data.target;
    dom.directRateText.textContent = `1 ${data.source} = ${data.rate.toFixed(4)} ${data.target}`;
    dom.inverseRateText.textContent = `1 ${data.target} = ${data.inverseRate.toFixed(4)} ${data.source}`;
    dom.lastUpdatedText.textContent = `Live at ${new Date(data.timestamp).toLocaleTimeString()}`;

    syncUrlParameters();
    loadHistory();
  } catch (err) {
    console.error(err);
  }
}

async function loadHistoricalTrends() {
  dom.chartPairSubtitle.textContent = `Exchange rate trajectory for ${state.sourceCurrency} to ${state.targetCurrency}`;
  dom.chartLoading.classList.remove('hidden');

  try {
    const trends = await fetchHistoricalTrends(state.sourceCurrency, state.targetCurrency);

    dom.statHigh.textContent = trends.stats.max.toFixed(4);
    dom.statLow.textContent = trends.stats.min.toFixed(4);
    dom.statAvg.textContent = trends.stats.avg.toFixed(4);

    const change = trends.stats.changePercent;
    const sign = change > 0 ? '+' : '';
    dom.trendChangeBadge.textContent = `${sign}${change}% (30d)`;
    dom.trendChangeBadge.className = 'trend-badge ' + (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral');

    if (trends.signal) {
      dom.marketRatingBadge.textContent = `${trends.signal.rating} (${trends.signal.volatility} Volatility)`;
      dom.marketRatingBadge.className = `market-signal-badge ${trends.signal.status}`;
      dom.marketAdviceText.textContent = trends.signal.advice;
      dom.marketMeterFill.style.width = `${trends.signal.score}%`;
      dom.marketMeterFill.className = `meter-fill ${trends.signal.status}`;
    }

    updateTrendChart(dom.trendChart, trends.points, state.sourceCurrency, state.targetCurrency);
  } catch (err) {
    console.error(err);
  } finally {
    dom.chartLoading.classList.add('hidden');
  }
}

async function loadFavorites() {
  try {
    state.favorites = await fetchFavorites();
    renderFavorites(
      dom.favoritesList,
      dom.favoritesCount,
      state.favorites,
      selectPair,
      handleDeleteFavorite
    );
    updateFavoriteState();
  } catch (err) {
    console.error(err);
  }
}

function isCurrentPairFavorited() {
  return state.favorites.some(
    (f) => f.source_currency === state.sourceCurrency && f.target_currency === state.targetCurrency
  );
}

function updateFavoriteState() {
  const isFav = isCurrentPairFavorited();
  updateFavoriteStarButton(dom.favoriteBtn, dom.starIcon, isFav);
}

async function toggleCurrentFavorite() {
  const isFav = isCurrentPairFavorited();
  if (isFav) {
    const existing = state.favorites.find(
      (f) => f.source_currency === state.sourceCurrency && f.target_currency === state.targetCurrency
    );
    if (existing) {
      await removeFavorite(existing.id);
    }
  } else {
    await addFavorite(state.sourceCurrency, state.targetCurrency);
  }
  await loadFavorites();
}

async function handleDeleteFavorite(id) {
  try {
    await removeFavorite(id);
    await loadFavorites();
  } catch (err) {
    console.error(err);
  }
}

async function loadHistory() {
  try {
    const list = await fetchHistory(8);
    renderHistory(dom.historyList, list, (source, target, amt) => {
      dom.sourceAmount.value = amt;
      selectPair(source, target);
    });
  } catch (err) {
    console.error(err);
  }
}

async function handleClearHistory() {
  try {
    await clearHistory();
    await loadHistory();
  } catch (err) {
    console.error(err);
  }
}

async function loadTravelBudget() {
  const amountVal = parseFloat(dom.travelBaseAmount.value);
  state.travelAmount = isNaN(amountVal) ? 0 : amountVal;

  try {
    const data = await fetchTravelBudget(state.travelBase, state.travelAmount, state.travelDays);
    state.lastTravelData = data;
    renderTravelComparisonTable(dom.travelTableBody, data);
    syncUrlParameters();
  } catch (err) {
    console.error(err);
  }
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

function copyShareableLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    dom.shareBtnText.textContent = 'Copied!';
    setTimeout(() => {
      dom.shareBtnText.textContent = 'Share Link';
    }, 2000);
  });
}

function copyTravelSummary() {
  if (!state.lastTravelData) return;
  const text = buildTravelSummaryText(state.lastTravelData);
  navigator.clipboard.writeText(text).then(() => {
    const btnSpan = dom.copyBudgetBtn.querySelector('span');
    const prev = btnSpan.textContent;
    btnSpan.textContent = 'Copied!';
    setTimeout(() => {
      btnSpan.textContent = prev;
    }, 2000);
  });
}

function setupEventListeners() {
  const debouncedConvert = debounce(performConversion, 250);
  dom.sourceAmount.addEventListener('input', debouncedConvert);

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
  dom.copyShareLinkBtn.addEventListener('click', copyShareableLink);

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
    syncUrlParameters();
  });

  const debouncedTravel = debounce(loadTravelBudget, 250);
  dom.travelBaseAmount.addEventListener('input', debouncedTravel);

  dom.travelBaseCurrency.addEventListener('change', (e) => {
    state.travelBase = e.target.value;
    updateCurrencyBadges();
    loadTravelBudget();
  });

  dom.durationChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      dom.durationChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.travelDays = parseInt(chip.getAttribute('data-days'), 10);
      loadTravelBudget();
    });
  });

  dom.exportCsvBtn.addEventListener('click', () => {
    if (state.lastTravelData) {
      exportTravelBudgetCsv(state.lastTravelData);
    }
  });

  dom.copyBudgetBtn.addEventListener('click', copyTravelSummary);
  dom.clearHistoryBtn.addEventListener('click', handleClearHistory);
}

document.addEventListener('DOMContentLoaded', init);
