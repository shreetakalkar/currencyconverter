function round(value, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function calculateStats(values) {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, avg: 0, changePercent: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = round(sum / values.length, 4);
  const first = values[0];
  const last = values[values.length - 1];
  const changePercent = first !== 0 ? round(((last - first) / first) * 100, 2) : 0;

  return { min, max, avg, changePercent };
}

function calculateMarketSignal(currentRate, min, max, avg) {
  if (max === min) {
    return {
      score: 50,
      rating: 'Neutral',
      status: 'neutral',
      advice: 'Stable exchange rate within the 30-day cycle',
      volatility: 'Low'
    };
  }

  const score = Math.max(0, Math.min(100, Math.round(((currentRate - min) / (max - min)) * 100)));
  const rangeDiff = max - min;
  const volatilityRatio = avg > 0 ? (rangeDiff / avg) * 100 : 0;
  const volatility = volatilityRatio > 3 ? 'High' : volatilityRatio > 1.5 ? 'Moderate' : 'Low';

  if (score >= 70) {
    return {
      score,
      rating: 'Favorable',
      status: 'positive',
      advice: 'Near 30-day peak. Highly favorable time to convert',
      volatility
    };
  }

  if (score <= 30) {
    return {
      score,
      rating: 'Unfavorable',
      status: 'negative',
      advice: 'Near 30-day low. Consider waiting for a rebound',
      volatility
    };
  }

  return {
    score,
    rating: 'Neutral',
    status: 'neutral',
    advice: 'Holding steady near 30-day average',
    volatility
  };
}

module.exports = {
  round,
  calculateStats,
  calculateMarketSignal
};
