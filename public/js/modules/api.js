async function request(url, options = {}) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({ error: 'Network communication error' }));
  if (!response.ok) {
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

export async function fetchCurrencies() {
  const res = await request('/api/currencies');
  return res.data;
}

export async function convertCurrency(source, target, amount) {
  const res = await request('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, target, amount })
  });
  return res.data;
}

export async function fetchHistoricalTrends(source, target) {
  const res = await request(`/api/history/trends?source=${source}&target=${target}`);
  return res.data;
}

export async function fetchFavorites() {
  const res = await request('/api/favorites');
  return res.data;
}

export async function addFavorite(source, target) {
  const res = await request('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, target })
  });
  return res.data;
}

export async function removeFavorite(id) {
  const res = await request(`/api/favorites/${id}`, { method: 'DELETE' });
  return res.message;
}

export async function fetchHistory(limit = 8) {
  const res = await request(`/api/history?limit=${limit}`);
  return res.data;
}

export async function clearHistory() {
  const res = await request('/api/history', { method: 'DELETE' });
  return res.message;
}

export async function fetchTravelBudget(base, amount) {
  const res = await request(`/api/travel-budget?base=${base}&amount=${amount}`);
  return res.data;
}
