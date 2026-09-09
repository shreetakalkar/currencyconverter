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
import { renderTravelComparisonTable } from './modules/travelManager.js';

const state = {
  currencies: [],
  sourceCurrency: 'USD',
  targetCurrency: 'EUR',
  amount: 1000,
  favorites: [],
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
    const data = await fetchTravelBudget(state.travelBase, state.travelAmount);
    renderTravelComparisonTable(dom.travelTableBody, data);
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

  const debouncedTravel = debounce(loadTravelBudget, 250);
  dom.travelBaseAmount.addEventListener('input', debouncedTravel);

  dom.travelBaseCurrency.addEventListener('change', (e) => {
    state.travelBase = e.target.value;
    updateCurrencyBadges();
    loadTravelBudget();
  });

  dom.clearHistoryBtn.addEventListener('click', handleClearHistory);
}

document.addEventListener('DOMContentLoaded', init);
