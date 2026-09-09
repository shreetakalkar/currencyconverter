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
          <td><span class="power-indicator">${powerBadge}</span></td>
        </tr>
      `;
    })
    .join('');
}
