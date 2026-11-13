const API = 'https://picsum.photos/v2/list';
const BATCH = 4; // скільки фото за один запит
const WAIT_MS = 8000; // скільки чекати відповіді сервера

const grid = document.getElementById('grid');
const notice = document.getElementById('notice');
const totalEl = document.getElementById('total');
const likesEl = document.getElementById('likes');

const btnLoad = document.getElementById('btnLoad');
const btnClear = document.getElementById('btnClear');
const btnLast = document.getElementById('btnLast');
const btnFlip = document.getElementById('btnFlip');

const LOAD_LABEL = btnLoad.textContent;
let nextPage = 1; // наступна сторінка API, щоб фото не повторювалися
let lastError = '';

// ---------- Запит ----------

async function requestBatch() {
  const url = `${API}?page=${nextPage}&limit=${BATCH}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WAIT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Сервер відповів зі статусом ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Створення картки ----------

function makeIconButton(className, symbol, action, title) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `icon-btn ${className}`;
  btn.textContent = symbol;
  btn.dataset.action = action;
  btn.title = title;
  return btn;
}

function makePhoto({ id, author, download_url }) {
  const li = document.createElement('li');
  li.className = 'photo';
  li.dataset.id = id;

  const img = document.createElement('img');
  img.className = 'photo__img';
  img.src = download_url;
  img.alt = `Фото автора ${author}`;
  img.loading = 'lazy';

  const bar = document.createElement('div');
  bar.className = 'photo__bar';

  const name = document.createElement('span');
  name.className = 'photo__author';
  name.textContent = author;

  bar.append(
    name,
    makeIconButton('icon-btn--like', '♥', 'like', 'Подобається'),
    makeIconButton('icon-btn--remove', '×', 'remove', 'Видалити фото')
  );

  li.append(img, bar);
  return li;
}

// ---------- Оновлення інтерфейсу ----------

function refresh() {
  const count = grid.children.length;
  const liked = grid.querySelectorAll('.icon-btn--like.is-on').length;

  totalEl.textContent = count;
  likesEl.textContent = liked;

  btnClear.disabled = count === 0;
  btnLast.disabled = count === 0;
  btnFlip.disabled = count < 2;

  if (lastError) {
    notice.textContent = lastError;
    notice.className = 'notice notice--error';
    notice.hidden = false;
  } else if (count === 0) {
    notice.textContent = 'Галерея порожня. Натисніть «Завантажити ще 4 картинки».';
    notice.className = 'notice';
    notice.hidden = false;
  } else {
    notice.hidden = true;
  }
}

// ---------- Дії кнопок ----------

async function loadBatch() {
  btnLoad.disabled = true;
  btnLoad.textContent = 'Завантаження...';
  lastError = '';

  try {
    const photos = await requestBatch();
    grid.append(...photos.map(makePhoto));
    nextPage += 1;
  } catch (err) {
    console.error(err);
    lastError =
      err.name === 'AbortError'
        ? 'Сервер не відповідає. Перевірте інтернет або увімкніть VPN.'
        : 'Не вдалося завантажити картинки. Спробуйте ще раз.';
  } finally {
    btnLoad.disabled = false;
    btnLoad.textContent = LOAD_LABEL;
    refresh();
  }
}

function clearAll() {
  grid.innerHTML = '';
  refresh();
}

function removeLast() {
  if (grid.lastElementChild) {
    grid.lastElementChild.remove();
  }
  refresh();
}

function flip() {
  const items = Array.from(grid.children).reverse();
  grid.append(...items);
}

// Лайк і видалення окремого фото (одна подія на всю сітку)
function onGridClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) {
    return;
  }

  if (btn.dataset.action === 'like') {
    btn.classList.toggle('is-on');
  } else if (btn.dataset.action === 'remove') {
    btn.closest('.photo').remove();
  }
  refresh();
}

btnLoad.addEventListener('click', loadBatch);
btnClear.addEventListener('click', clearAll);
btnLast.addEventListener('click', removeLast);
btnFlip.addEventListener('click', flip);
grid.addEventListener('click', onGridClick);

// Перше завантаження: 4 картинки
refresh();
loadBatch();