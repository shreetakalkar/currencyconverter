const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const json = await res.json();
  return { status: res.status, ok: res.ok, data: json };
}

function checkZeroComments(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('<!--') || line.startsWith('-- ')) {
      throw new Error(`Comment detected in ${filePath} at line ${i + 1}: ${line}`);
    }
  }
}

async function runTests() {
  console.log('Running test suite...');

  const currenciesRes = await request('/api/currencies');
  assert.strictEqual(currenciesRes.status, 200);
  assert.strictEqual(currenciesRes.data.success, true);
  assert.ok(currenciesRes.data.data.length >= 20);
  console.log('PASS: GET /api/currencies');

  const ratesRes = await request('/api/rates?base=USD');
  assert.strictEqual(ratesRes.status, 200);
  assert.strictEqual(ratesRes.data.success, true);
  assert.ok(ratesRes.data.rates.EUR);
  console.log('PASS: GET /api/rates');

  const convertRes = await request('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'USD', target: 'EUR', amount: 500 })
  });
  assert.strictEqual(convertRes.status, 200);
  assert.strictEqual(convertRes.data.success, true);
  assert.strictEqual(convertRes.data.data.amount, 500);
  assert.ok(convertRes.data.data.result > 0);
  assert.ok(convertRes.data.data.rate > 0);
  console.log('PASS: POST /api/convert');

  const trendsRes = await request('/api/history/trends?source=USD&target=EUR');
  assert.strictEqual(trendsRes.status, 200);
  assert.strictEqual(trendsRes.data.success, true);
  assert.ok(trendsRes.data.data.points.length >= 20);
  assert.ok('min' in trendsRes.data.data.stats);
  assert.ok('max' in trendsRes.data.data.stats);
  assert.ok('avg' in trendsRes.data.data.stats);
  assert.ok('changePercent' in trendsRes.data.data.stats);
  assert.ok('signal' in trendsRes.data.data);
  assert.ok(typeof trendsRes.data.data.signal.score === 'number');
  assert.ok(trendsRes.data.data.signal.rating);
  assert.ok(trendsRes.data.data.signal.advice);
  console.log('PASS: GET /api/history/trends (with Timing Signal USP)');

  const travelRes = await request('/api/travel-budget?base=USD&amount=2800&days=14');
  assert.strictEqual(travelRes.status, 200);
  assert.strictEqual(travelRes.data.success, true);
  assert.strictEqual(travelRes.data.data.base.days, 14);
  assert.strictEqual(travelRes.data.data.comparison.length, 5);
  for (const item of travelRes.data.data.comparison) {
    assert.ok(item.currency);
    assert.ok(item.rate > 0);
    assert.ok(item.convertedAmount > 0);
    assert.ok(item.dailyAllowance > 0);
    assert.ok(item.breakdown.lodging);
    assert.ok(item.breakdown.food);
    assert.ok(item.breakdown.transit);
  }
  console.log('PASS: GET /api/travel-budget (with 14-day Daily Allowance USP)');

  const favListRes = await request('/api/favorites');
  assert.strictEqual(favListRes.status, 200);
  assert.strictEqual(favListRes.data.success, true);
  assert.ok(favListRes.data.data.length > 0);
  console.log('PASS: GET /api/favorites');

  const addFavRes = await request('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'AUD', target: 'NZD' })
  });
  assert.strictEqual(addFavRes.status, 201);
  assert.strictEqual(addFavRes.data.success, true);
  const newFavId = addFavRes.data.data.id;
  console.log('PASS: POST /api/favorites');

  const delFavRes = await request(`/api/favorites/${newFavId}`, { method: 'DELETE' });
  assert.strictEqual(delFavRes.status, 200);
  assert.strictEqual(delFavRes.data.success, true);
  console.log('PASS: DELETE /api/favorites/:id');

  const historyRes = await request('/api/history?limit=10');
  assert.strictEqual(historyRes.status, 200);
  assert.strictEqual(historyRes.data.success, true);
  assert.ok(historyRes.data.data.length > 0);
  console.log('PASS: GET /api/history (SQLite persistence)');

  const clearHistoryRes = await request('/api/history', { method: 'DELETE' });
  assert.strictEqual(clearHistoryRes.status, 200);
  const emptyHistoryRes = await request('/api/history');
  assert.strictEqual(emptyHistoryRes.data.data.length, 0);
  console.log('PASS: DELETE /api/history');

  const filesToCheck = [
    'server.js',
    'src/server.js',
    'src/config/database.js',
    'src/constants/currencies.js',
    'src/utils/dateUtils.js',
    'src/utils/mathUtils.js',
    'src/middleware/errorHandler.js',
    'src/middleware/validator.js',
    'src/models/cacheModel.js',
    'src/models/historyModel.js',
    'src/models/favoriteModel.js',
    'src/services/exchangeService.js',
    'src/controllers/currencyController.js',
    'src/controllers/favoriteController.js',
    'src/controllers/historyController.js',
    'src/routes/currencyRoutes.js',
    'src/routes/favoriteRoutes.js',
    'src/routes/historyRoutes.js',
    'src/routes/apiRoutes.js',
    'public/index.html',
    'public/css/style.css',
    'public/js/app.js',
    'public/js/modules/utils.js',
    'public/js/modules/api.js',
    'public/js/modules/chartManager.js',
    'public/js/modules/favoritesManager.js',
    'public/js/modules/historyManager.js',
    'public/js/modules/travelManager.js'
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(__dirname, '..', relPath);
    checkZeroComments(fullPath);
  }
  console.log(`PASS: All ${filesToCheck.length} files verified with zero comments`);

  console.log('\nAll test assertions passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
