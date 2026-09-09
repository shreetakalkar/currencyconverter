export function renderTravelComparisonTable(tbody, data) {
  tbody.innerHTML = data.comparison
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
          <td>
            <span class="daily-allowance-highlight">${item.formattedDaily}</span>
            <div class="fav-rate">for ${data.base.days} days</div>
          </td>
          <td>
            <div class="travel-breakdown-tags">
              <span class="breakdown-tag" title="Daily Lodging Budget (~45%)">
                <span class="breakdown-label">Stay:</span> ${item.breakdown.lodging}
              </span>
              <span class="breakdown-tag" title="Daily Food Budget (~35%)">
                <span class="breakdown-label">Food:</span> ${item.breakdown.food}
              </span>
              <span class="breakdown-tag" title="Daily Transit & Activities (~20%)">
                <span class="breakdown-label">Act:</span> ${item.breakdown.transit}
              </span>
            </div>
          </td>
          <td><span class="power-indicator">${powerBadge}</span></td>
        </tr>
      `;
    })
    .join('');
}

export function exportTravelBudgetCsv(data) {
  const headers = ['Currency', 'Destination', 'Exchange Rate', 'Total Budget', 'Daily Allowance', 'Daily Lodging (45%)', 'Daily Food (35%)', 'Daily Transit (20%)'];
  const rows = data.comparison.map((item) => [
    item.currency,
    `"${item.name}"`,
    item.rate,
    item.convertedAmount,
    item.dailyAllowance,
    `"${item.breakdown.lodging}"`,
    `"${item.breakdown.food}"`,
    `"${item.breakdown.transit}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Travel_Budget_${data.base.amount}_${data.base.code}_${data.base.days}days.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function buildTravelSummaryText(data) {
  let summary = `✈️ Travel Budget Summary: ${data.base.amount} ${data.base.code} (${data.base.days} Days)\n`;
  summary += '---------------------------------------------------\n';
  data.comparison.forEach((item) => {
    summary += `${item.flag} ${item.currency} (${item.name}):\n`;
    summary += `   • Total Budget: ${item.formattedValue}\n`;
    summary += `   • Daily Allowance: ${item.formattedDaily}/day\n`;
    summary += `   • Daily Breakdown: Stay: ${item.breakdown.lodging} | Food: ${item.breakdown.food} | Transit: ${item.breakdown.transit}\n`;
  });
  return summary;
}
