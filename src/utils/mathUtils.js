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

module.exports = {
  round,
  calculateStats
};
