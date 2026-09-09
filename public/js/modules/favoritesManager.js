export function renderFavorites(container, countElement, favorites, onSelectPair, onDeletePair) {
  countElement.textContent = `${favorites.length} Pairs`;

  if (favorites.length === 0) {
    container.innerHTML = `<div class="fav-rate">No favorite pairs saved yet.</div>`;
    return;
  }

  container.innerHTML = favorites
    .map((fav) => {
      const rateDisplay = fav.currentRate
        ? `1 ${fav.source_currency} = ${fav.currentRate.toFixed(4)} ${fav.target_currency}`
        : 'Rate updating...';

      return `
        <div class="favorite-card" data-source="${fav.source_currency}" data-target="${fav.target_currency}">
          <div class="fav-info">
            <div class="fav-pair">${fav.source_currency} → ${fav.target_currency}</div>
            <div class="fav-rate">${rateDisplay}</div>
          </div>
          <button class="fav-delete-btn" data-id="${fav.id}" title="Remove favorite">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.favorite-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.fav-delete-btn')) return;
      const s = card.getAttribute('data-source');
      const t = card.getAttribute('data-target');
      onSelectPair(s, t);
    });
  });

  container.querySelectorAll('.fav-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      onDeletePair(id);
    });
  });
}

export function updateFavoriteStarButton(button, starIcon, isFavorited) {
  if (isFavorited) {
    button.classList.add('favorited');
    starIcon.setAttribute('fill', 'currentColor');
  } else {
    button.classList.remove('favorited');
    starIcon.setAttribute('fill', 'none');
  }
}
