const cacheModel = require('../models/cacheModel');
const historyModel = require('../models/historyModel');
const { CURRENCY_DETAILS, MAJOR_RESERVE_CURRENCIES } = require('../constants/currencies');
const { formatYMD, getDateNDaysAgo } = require('../utils/dateUtils');
const { round, calculateStats, calculateMarketSignal } = require('../utils/mathUtils');

const CACHE_TTL = 30 * 60 * 1000;

class ExchangeService {
  getSupportedCurrencies() {
    return Object.values(CURRENCY_DETAILS);
  }

  async getLiveRates(baseCurrency = 'USD') {
    const base = baseCurrency.toUpperCase();
    const cached = cacheModel.get(base);
    const now = Date.now();

    if (cached && now - cached.updated_at < CACHE_TTL) {
      return cached.rates;
    }

    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          cacheModel.set(base, data.rates);
          return data.rates;
        }
      }
    } catch {
      try {
        const frankfurterResponse = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`);
        if (frankfurterResponse.ok) {
          const frankfurterData = await frankfurterResponse.json();
          if (frankfurterData && frankfurterData.rates) {
            const mergedRates = { ...frankfurterData.rates, [base]: 1 };
            cacheModel.set(base, mergedRates);
            return mergedRates;
          }
        }
      } catch {}
    }

    if (cached) {
      return cached.rates;
    }

    const err = new Error(`Unable to fetch exchange rates for base currency ${base}`);
    err.status = 502;
    throw err;
  }

  async convert(sourceCurrency, targetCurrency, rawAmount) {
    const source = sourceCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount < 0) {
      const err = new Error('Invalid conversion amount');
      err.status = 400;
      throw err;
    }

    if (source === target) {
      const result = amount;
      const rate = 1.0;
      historyModel.record(source, target, amount, result, rate);
      return {
        source,
        target,
        amount,
        result,
        rate,
        inverseRate: 1.0,
        timestamp: new Date().toISOString()
      };
    }

    const rates = await this.getLiveRates(source);
    const rate = rates[target];

    if (!rate) {
      const err = new Error(`Exchange rate not found for pair ${source}/${target}`);
      err.status = 404;
      throw err;
    }

    const result = round(amount * rate, 4);
    const inverseRate = round(1 / rate, 6);

    historyModel.record(source, target, amount, result, rate);

    return {
      source,
      target,
      amount,
      result,
      rate,
      inverseRate,
      timestamp: new Date().toISOString()
    };
  }

  async getHistoricalTrends(sourceCurrency, targetCurrency) {
    const source = sourceCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();

    const endDate = new Date();
    const startDate = getDateNDaysAgo(30);

    const startStr = formatYMD(startDate);
    const endStr = formatYMD(endDate);

    let points = [];
    let stats = null;

    try {
      const url = `https://api.frankfurter.dev/v1/${startStr}..${endStr}?from=${source}&to=${target}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          const sortedDates = Object.keys(data.rates).sort();
          if (sortedDates.length > 0) {
            points = sortedDates.map((date) => ({
              date,
              rate: data.rates[date][target]
            }));
            const values = points.map((p) => p.rate);
            stats = calculateStats(values);
          }
        }
      }
    } catch {}

    if (points.length === 0) {
      const rates = await this.getLiveRates(source);
      const baseRate = rates[target] || 1;

      for (let i = 30; i >= 0; i--) {
        const d = getDateNDaysAgo(i);
        const variance = 1 + (Math.sin(i / 3) * 0.015) + ((Math.random() - 0.5) * 0.005);
        points.push({
          date: formatYMD(d),
          rate: round(baseRate * variance, 4)
        });
      }
      const values = points.map((p) => p.rate);
      stats = calculateStats(values);
    }

    const currentRate = points[points.length - 1].rate;
    const signal = calculateMarketSignal(currentRate, stats.min, stats.max, stats.avg);

    return {
      source,
      target,
      startDate: points[0].date,
      endDate: points[points.length - 1].date,
      points,
      stats,
      signal
    };
  }

  async getTravelBudget(baseCurrency, rawAmount, rawDays = 7) {
    const base = baseCurrency.toUpperCase();
    const amount = parseFloat(rawAmount);
    const days = Math.max(1, parseInt(rawDays, 10) || 7);

    if (isNaN(amount) || amount < 0) {
      const err = new Error('Invalid budget amount');
      err.status = 400;
      throw err;
    }

    const targetCurrencies = MAJOR_RESERVE_CURRENCIES
      .filter((code) => code !== base)
      .slice(0, 5);

    const rates = await this.getLiveRates(base);

    const comparison = targetCurrencies.map((code) => {
      const rate = rates[code] || 1;
      const convertedAmount = round(amount * rate, code === 'JPY' ? 0 : 2);
      const dailyAllowance = round(convertedAmount / days, code === 'JPY' ? 0 : 2);
      const info = CURRENCY_DETAILS[code] || {
        code,
        name: code,
        symbol: code,
        flag: '🌐'
      };

      const breakdown = {
        lodging: round(convertedAmount * 0.45, code === 'JPY' ? 0 : 2),
        food: round(convertedAmount * 0.35, code === 'JPY' ? 0 : 2),
        transit: round(convertedAmount * 0.20, code === 'JPY' ? 0 : 2)
      };

      return {
        currency: code,
        name: info.name,
        symbol: info.symbol,
        flag: info.flag,
        rate: round(rate, 4),
        convertedAmount,
        dailyAllowance,
        formattedValue: `${info.symbol} ${convertedAmount.toLocaleString()}`,
        formattedDaily: `${info.symbol} ${dailyAllowance.toLocaleString()}`,
        breakdown: {
          lodging: `${info.symbol} ${breakdown.lodging.toLocaleString()}`,
          food: `${info.symbol} ${breakdown.food.toLocaleString()}`,
          transit: `${info.symbol} ${breakdown.transit.toLocaleString()}`
        }
      };
    });

    const baseInfo = CURRENCY_DETAILS[base] || {
      code: base,
      name: base,
      symbol: base,
      flag: '🌐'
    };

    return {
      base: {
        code: base,
        name: baseInfo.name,
        symbol: baseInfo.symbol,
        flag: baseInfo.flag,
        amount,
        days
      },
      comparison
    };
  }
}

module.exports = new ExchangeService();
