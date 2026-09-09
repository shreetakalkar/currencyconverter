import { formatNumber, formatTimeAgo } from './utils.js';

export function renderHistory(container, historyList, onSelectHistoryItem) {
  if (historyList.length === 0) {
    container.innerHTML = `<div class="fav-rate">No recent conversions recorded.</div>`;
    return;
  }

  container.innerHTML = historyList
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

  container.querySelectorAll('.history-item').forEach((row) => {
    row.addEventListener('click', () => {
      const s = row.getAttribute('data-source');
      const t = row.getAttribute('data-target');
      const amt = row.getAttribute('data-amount');
      onSelectHistoryItem(s, t, amt);
    });
  });
}
