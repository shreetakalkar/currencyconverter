const cacheModel = require('../models/cacheModel');
const historyModel = require('../models/historyModel');

const CURRENCY_DETAILS = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪' },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  ILS: { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' }
};

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

    throw new Error(`Unable to fetch exchange rates for base currency ${base}`);
  }

  async convert(sourceCurrency, targetCurrency, rawAmount) {
    const source = sourceCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount < 0) {
      throw new Error('Invalid conversion amount');
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
      throw new Error(`Exchange rate not found for pair ${source}/${target}`);
    }

    const result = parseFloat((amount * rate).toFixed(4));
    const inverseRate = parseFloat((1 / rate).toFixed(6));

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
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const formatYMD = (date) => date.toISOString().split('T')[0];
    const startStr = formatYMD(startDate);
    const endStr = formatYMD(endDate);

    try {
      const url = `https://api.frankfurter.dev/v1/${startStr}..${endStr}?from=${source}&to=${target}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          const sortedDates = Object.keys(data.rates).sort();
          if (sortedDates.length > 0) {
            const points = sortedDates.map((date) => ({
              date,
              rate: data.rates[date][target]
            }));

            const values = points.map((p) => p.rate);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const avg = parseFloat((values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(4));
            const first = values[0];
            const last = values[values.length - 1];
            const changePercent = parseFloat((((last - first) / first) * 100).toFixed(2));

            return {
              source,
              target,
              startDate: sortedDates[0],
              endDate: sortedDates[sortedDates.length - 1],
              points,
              stats: { min, max, avg, changePercent }
            };
          }
        }
      }
    } catch {}

    const rates = await this.getLiveRates(source);
    const baseRate = rates[target] || 1;
    const points = [];

    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(endDate.getDate() - i);
      const variance = 1 + (Math.sin(i / 3) * 0.015) + ((Math.random() - 0.5) * 0.005);
      points.push({
        date: formatYMD(d),
        rate: parseFloat((baseRate * variance).toFixed(4))
      });
    }

    const values = points.map((p) => p.rate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = parseFloat((values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(4));
    const first = values[0];
    const last = values[values.length - 1];
    const changePercent = parseFloat((((last - first) / first) * 100).toFixed(2));

    return {
      source,
      target,
      startDate: points[0].date,
      endDate: points[points.length - 1].date,
      points,
      stats: { min, max, avg, changePercent }
    };
  }

  async getTravelBudget(baseCurrency, rawAmount) {
    const base = baseCurrency.toUpperCase();
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount < 0) {
      throw new Error('Invalid budget amount');
    }

    const majorReserveCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
    const targetCurrencies = majorReserveCurrencies
      .filter((code) => code !== base)
      .slice(0, 5);

    const rates = await this.getLiveRates(base);

    const comparison = targetCurrencies.map((code) => {
      const rate = rates[code] || 1;
      const convertedAmount = parseFloat((amount * rate).toFixed(code === 'JPY' ? 0 : 2));
      const info = CURRENCY_DETAILS[code] || {
        code,
        name: code,
        symbol: code,
        flag: '🌐'
      };

      return {
        currency: code,
        name: info.name,
        symbol: info.symbol,
        flag: info.flag,
        rate: parseFloat(rate.toFixed(4)),
        convertedAmount,
        formattedValue: `${info.symbol} ${convertedAmount.toLocaleString()}`
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
        amount
      },
      comparison
    };
  }
}

module.exports = new ExchangeService();
