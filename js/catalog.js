(function () {
  const GAMES_JSON_PATH = 'data/games.json';
  const PLACEHOLDER_COLORS = ['#5B6BFF', '#FF6B6B', '#8890A4', '#22C1A0', '#F5A623'];

  const grid = document.getElementById('game-grid');
  const chips = document.querySelectorAll('.chip[data-category]');

  let games = [];
  let activeCategory = 'all';

  function placeholderColor(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return PLACEHOLDER_COLORS[hash % PLACEHOLDER_COLORS.length];
  }

  function createThumb(game) {
    if (!game.thumbnail) {
      return createPlaceholderThumb(game);
    }

    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = game.thumbnail;
    img.alt = game.title;
    img.loading = 'lazy';
    img.onerror = function () {
      img.replaceWith(createPlaceholderThumb(game));
    };
    return img;
  }

  function createPlaceholderThumb(game) {
    const div = document.createElement('div');
    div.className = 'thumb thumb--placeholder';
    div.style.background = placeholderColor(game.id);
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.color = '#fff';
    div.style.fontFamily = 'var(--font-display)';
    div.style.fontWeight = '700';
    div.style.fontSize = '28px';
    div.textContent = (game.title || '?').charAt(0).toUpperCase();
    return div;
  }

  function createCard(game) {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.dataset.category = (game.category || []).join(',');

    const link = document.createElement('a');
    link.href = `game/slug.html?id=${encodeURIComponent(game.id)}`;

    link.appendChild(createThumb(game));

    const info = document.createElement('div');
    info.className = 'info';

    if (game.featured) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-featured';
      badge.textContent = 'Featured';
      info.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.className = 'game-card__title';
    title.textContent = game.title;
    info.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'game-card__desc';
    desc.textContent = game.description || '';
    info.appendChild(desc);

    if (Array.isArray(game.tags) && game.tags.length) {
      const tagList = document.createElement('div');
      tagList.className = 'tag-list';
      game.tags.forEach((tag) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagList.appendChild(tagEl);
      });
      info.appendChild(tagList);
    }

    link.appendChild(info);
    card.appendChild(link);
    return card;
  }

  function renderGames(list) {
    grid.innerHTML = '';

    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = '해당 카테고리에 게임이 없습니다.';
      grid.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach((game) => fragment.appendChild(createCard(game)));
    grid.appendChild(fragment);
  }

  function applyFilter(category) {
    activeCategory = category;

    chips.forEach((chip) => {
      chip.classList.toggle('is-active', chip.dataset.category === category);
    });

    const filtered =
      category === 'all'
        ? games
        : games.filter((game) => (game.category || []).includes(category));

    renderGames(filtered);
  }

  function setupChipListeners() {
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        applyFilter(chip.dataset.category);
      });
    });
  }

  async function init() {
    if (!grid) return;

    try {
      const res = await fetch(GAMES_JSON_PATH);
      games = await res.json();
    } catch (err) {
      grid.innerHTML = '<p class="empty-state">게임 목록을 불러오지 못했습니다.</p>';
      return;
    }

    setupChipListeners();
    applyFilter(activeCategory);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
