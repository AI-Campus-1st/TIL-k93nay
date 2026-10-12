const LEGACY_HISTORY_KEY = 'lunch-history'; // 이전 버전(localStorage 저장) 기록
const CLIENT_ID_KEY = 'lunch-client-id';
const RECENT_DAYS = 3;

const $ = (id) => document.getElementById(id);
const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.978, name: '서울' }; // 위치 권한 거부 시 기본값

const ALLERGEN_KEY = 'lunch-allergens';
const AVOID_KEY = 'lunch-avoid';
const VOTER_NAME_KEY = 'lunch-voter-name';
const VOTE_TOKENS_KEY = 'lunch-vote-tokens';
const MEAT_ALLERGENS = ['돼지고기', '소고기', '닭고기'];
const VOTE_POLL_MS = 3000;

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 불가 환경에서는 무시 */
  }
}

const state = {
  categories: new Set(),
  tags: new Set(),
  allergens: new Set(loadJson(ALLERGEN_KEY, [])),
  allMenus: [],
  current: null,
  weather: null,
  history: [], // 최근 먹은 메뉴 (서버에서 불러옴)
  vote: null, // { id, data, pollTimer }
};

// ---------- 날씨 ----------
function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(DEFAULT_LOCATION);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: '현재 위치' }),
      () => resolve(DEFAULT_LOCATION),
      { timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function loadWeather() {
  const card = $('weatherCard');
  card.hidden = false;
  try {
    const loc = await getPosition();
    const res = await fetch(`/api/weather?lat=${loc.lat}&lon=${loc.lon}`);
    if (!res.ok) throw new Error((await res.json()).error);
    const w = await res.json();
    state.weather = w;
    $('weatherEmoji').textContent = w.emoji;
    $('weatherSummary').textContent = `${loc.name} · ${Math.round(w.temperature)}°C · ${w.label}`;
    $('weatherMessage').textContent = w.message;
  } catch {
    // 날씨를 못 불러와도 일반 추천은 그대로 동작
    state.weather = null;
    card.hidden = true;
  }
}

function weatherParam() {
  return state.weather && $('weatherToggle').checked ? state.weather.type : null;
}

// ---------- 기록 (서버 DB, 브라우저별 client ID 로 구분) ----------
// crypto.randomUUID 는 http://사내IP 같은 비보안 주소에서 막혀 있어 getRandomValues 사용
function clientId() {
  let id = loadJson(CLIENT_ID_KEY, null);
  if (!id) {
    id = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
    saveJson(CLIENT_ID_KEY, id);
  }
  return id;
}

async function loadHistory() {
  try {
    state.history = await api(`/api/history?client=${clientId()}`);
  } catch {
    state.history = [];
  }
  renderHistory();
}

// 예전 버전에서 브라우저에 저장했던 기록을 DB 로 한 번 옮기기
async function migrateLocalHistory() {
  const old = loadJson(LEGACY_HISTORY_KEY, []);
  if (!old.length) return;
  for (const h of [...old].reverse()) {
    try {
      await api('/api/history', { method: 'POST', body: { client: clientId(), menu: h.name, at: h.at } });
    } catch {
      /* 지금은 없는 메뉴 등은 건너뜀 */
    }
  }
  localStorage.removeItem(LEGACY_HISTORY_KEY);
}

function recentMenuNames() {
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  return state.history.filter((h) => h.at >= cutoff).map((h) => h.name);
}

function renderHistory() {
  const list = $('historyList');
  list.innerHTML = '';
  if (!state.history.length) {
    list.innerHTML = '<li class="empty">아직 기록이 없어요</li>';
    return;
  }
  for (const h of state.history) {
    const li = document.createElement('li');
    const d = new Date(h.at);
    const name = document.createElement('span');
    name.textContent = `${h.emoji || '🍽️'} ${h.name}`;
    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
    li.append(name, date);
    list.appendChild(li);
  }
}

// ---------- 필터 UI ----------
function renderChips(containerId, items, selected, { className = 'chip', onChange } = {}) {
  const box = $(containerId);
  box.innerHTML = '';
  for (const item of items) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = className;
    chip.textContent = item;
    chip.setAttribute('aria-pressed', String(selected.has(item)));
    chip.addEventListener('click', () => {
      selected.has(item) ? selected.delete(item) : selected.add(item);
      chip.setAttribute('aria-pressed', String(selected.has(item)));
      onChange?.();
    });
    box.appendChild(chip);
  }
}

// ---------- 알러지 · 못 먹는 음식 ----------
function avoidWords() {
  return $('avoidInput').value.split(',').map((s) => s.trim()).filter(Boolean);
}

function saveAllergens() {
  saveJson(ALLERGEN_KEY, [...state.allergens]);
}

// 내가 못 먹는 것 전체 (투표 시 팀원에게 공유됨)
function myRestrictions() {
  return [...state.allergens, ...avoidWords()];
}

// 메뉴가 제한 목록 중 무엇에 걸리는지
function conflictsOf(menu, restrictions) {
  if (!menu) return [];
  return restrictions.filter((r) => menu.allergens.includes(r) || menu.name.includes(r));
}

function renderAllergenChips(allergens) {
  renderChips('allergenChips', allergens, state.allergens, {
    className: 'chip danger',
    onChange: () => {
      saveAllergens();
      if (state.vote) renderVote();
    },
  });
}

function updatePriceLabel() {
  const v = Number($('priceRange').value);
  $('priceLabel').textContent = v >= 20000 ? '상관없음' : `${v.toLocaleString()}원 이하`;
}

function buildQuery({ excludeCurrent = true } = {}) {
  const params = new URLSearchParams();
  if (state.allergens.size) params.set('allergens', [...state.allergens].join(','));
  const avoid = avoidWords();
  if (avoid.length) params.set('avoid', avoid.join(','));
  if (state.categories.size) params.set('category', [...state.categories].join(','));
  if (state.tags.size) params.set('tags', [...state.tags].join(','));
  const price = Number($('priceRange').value);
  if (price < 20000) params.set('maxPrice', price);
  params.set('spicy', document.querySelector('input[name="spicy"]:checked').value);
  const weather = weatherParam();
  if (weather) params.set('weather', weather);

  const exclude = $('excludeRecent').checked ? recentMenuNames() : [];
  // 같은 메뉴가 연속으로 나오지 않도록 직전 추천도 제외
  if (excludeCurrent && state.current) exclude.push(state.current.name);
  if (exclude.length) params.set('exclude', exclude.join(','));
  return params;
}

// ---------- 추천 ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function spinAnimation(pool) {
  const card = document.querySelector('.result-card');
  card.classList.remove('done');
  card.classList.add('spinning');
  // 점점 느려지는 룰렛 효과
  for (let i = 0; i < 14; i++) {
    const m = pool[Math.floor(Math.random() * pool.length)];
    $('resultEmoji').textContent = m.emoji;
    $('resultName').textContent = m.name;
    await sleep(40 + i * 12);
  }
  card.classList.remove('spinning');
  card.classList.add('done');
}

function showResult(menu, total, weatherMatch) {
  const badge = $('weatherBadge');
  badge.hidden = !(weatherMatch && weatherParam());
  if (!badge.hidden) badge.textContent = `${state.weather.emoji} 오늘 날씨에 딱 맞는 메뉴`;
  $('resultEmoji').textContent = menu.emoji;
  $('resultName').textContent = menu.name;
  $('resultMeta').textContent =
    `${menu.category} · 약 ${menu.price.toLocaleString()}원${menu.spicy ? ' · 🌶️' : ''} · #${menu.tags.join(' #')}` +
    `\n주요 재료: ${menu.allergens.join(', ')}`;
  $('candidateInfo').textContent = `조건에 맞는 메뉴 ${total}개 중에서 골랐어요`;
  const map = $('mapLink');
  map.href = `https://map.naver.com/p/search/${encodeURIComponent(menu.name)}`;
  map.hidden = false;
  $('decideBtn').hidden = false;
  $('decideBtn').disabled = false;
  $('decideBtn').textContent = '이걸로 결정! ✅';
  $('recommendBtn').textContent = '다른 메뉴 추천 🔄';
}

function showError(message) {
  $('resultEmoji').textContent = '😢';
  $('resultName').textContent = '추천할 메뉴가 없어요';
  $('resultMeta').textContent = message;
  $('candidateInfo').textContent = '';
  $('mapLink').hidden = true;
  $('decideBtn').hidden = true;
  $('weatherBadge').hidden = true;
}

async function recommend() {
  const btn = $('recommendBtn');
  btn.disabled = true;
  try {
    let res = await fetch(`/api/recommend?${buildQuery()}`);
    // 직전 메뉴 제외로 후보가 없어지면 직전 메뉴 포함해서 재시도
    if (res.status === 404 && state.current) {
      const prev = state.current;
      state.current = null;
      res = await fetch(`/api/recommend?${buildQuery()}`);
      if (!res.ok) state.current = prev;
    }
    const data = await res.json();
    if (!res.ok) {
      showError(data.error);
      return;
    }
    const pool = state.allMenus.filter((m) => data.candidates.includes(m.name));
    await spinAnimation(pool.length > 1 ? pool : state.allMenus);
    state.current = data.pick;
    showResult(data.pick, data.total, data.weatherMatch);
  } catch (err) {
    showError('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
  } finally {
    btn.disabled = false;
  }
}

async function decide() {
  if (!state.current) return;
  const btn = $('decideBtn');
  btn.disabled = true;
  try {
    state.history = await api('/api/history', {
      method: 'POST',
      body: { client: clientId(), menu: state.current.name },
    });
    renderHistory();
    btn.textContent = '맛있게 드세요! 😋';
  } catch (err) {
    btn.disabled = false;
    $('candidateInfo').textContent = `기록 저장 실패: ${err.message}`;
  }
}

// ---------- 팀 투표 ----------
const menuByName = (name) => state.allMenus.find((m) => m.name === name);
const voteTokens = () => loadJson(VOTE_TOKENS_KEY, {});

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
    body: options.body && JSON.stringify(options.body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '요청에 실패했어요.');
  return data;
}

function setMessage(id, text, isError = false) {
  $(id).textContent = text;
  $(id).classList.toggle('error', isError);
}

async function createVote() {
  const btn = $('createVoteBtn');
  btn.disabled = true;
  setMessage('createVoteMessage', '');
  try {
    // 지금 추천된 메뉴가 내 제한에 걸리지 않을 때만 후보에 포함
    const include =
      $('includeCurrent').checked && state.current && !conflictsOf(state.current, myRestrictions()).length
        ? state.current.name
        : undefined;
    const { vote, token } = await api('/api/votes', {
      method: 'POST',
      body: {
        title: $('voteTitleInput').value,
        count: Number($('voteCount').value),
        query: buildQuery({ excludeCurrent: false }).toString(),
        include,
      },
    });
    saveJson(VOTE_TOKENS_KEY, { ...voteTokens(), [vote.id]: token });
    history.pushState(null, '', `/?vote=${vote.id}`);
    openVote(vote.id, vote);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    setMessage('createVoteMessage', err.message, true);
  } finally {
    btn.disabled = false;
  }
}

// localhost 로 접속 중이면 팀원이 열 수 있도록 같은 네트워크 주소로 링크 생성
async function shareBaseUrl() {
  if (!['localhost', '127.0.0.1'].includes(location.hostname)) return location.origin;
  try {
    const { lanUrls } = await api('/api/info');
    return lanUrls[0] || location.origin;
  } catch {
    return location.origin;
  }
}

async function openVote(id, initialData) {
  stopVotePolling();
  state.vote = { id, data: initialData || null, pollTimer: null };
  $('voteView').hidden = false;
  $('voterName').value = loadJson(VOTER_NAME_KEY, '');
  $('shareLink').value = `${await shareBaseUrl()}/?vote=${id}`;
  if (!initialData) await refreshVote();
  else renderVote();
  state.vote.pollTimer = setInterval(() => {
    if (!document.hidden) refreshVote();
  }, VOTE_POLL_MS);
}

function stopVotePolling() {
  if (state.vote?.pollTimer) clearInterval(state.vote.pollTimer);
}

async function refreshVote() {
  if (!state.vote) return;
  try {
    state.vote.data = await api(`/api/votes/${state.vote.id}`);
    renderVote();
  } catch (err) {
    stopVotePolling();
    $('voteTitle').textContent = '🗳️ 팀 투표';
    $('voteCandidates').innerHTML = '';
    setMessage('voteMessage', err.message, true);
  }
}

function renderVote() {
  const v = state.vote?.data;
  if (!v) return;
  if (v.closed) stopVotePolling();

  const myName = $('voterName').value.trim();
  // 팀원별 못 먹는 것 (내 것은 아직 투표 전이어도 현재 설정 반영)
  const restrictions = { ...v.allergies };
  if (myName) delete restrictions[myName];
  const mine = myRestrictions();

  $('voteTitle').textContent = `🗳️ ${v.title}`;
  $('voteStatus').textContent = v.closed ? '마감됨' : `${v.voterCount}명 참여 · 실시간 반영 중`;

  const winnerBox = $('voteWinner');
  winnerBox.hidden = !v.closed;
  $('voterName').closest('.field').hidden = v.closed;
  if (v.closed) {
    const w = menuByName(v.winner);
    winnerBox.textContent = w ? `🎉 오늘의 점심은 ${w.emoji} ${w.name}!` : '투표한 사람이 없어서 결정되지 않았어요';
  }

  const maxCount = Math.max(1, ...Object.values(v.tally).map((voters) => voters.length));
  const list = $('voteCandidates');
  list.innerHTML = '';
  for (const name of v.candidates) {
    const menu = menuByName(name);
    const voters = v.tally[name] || [];
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vote-option';
    btn.disabled = v.closed;
    if (myName && voters.includes(myName)) btn.classList.add('mine');
    if (v.closed && v.winner === name) btn.classList.add('winner');
    btn.addEventListener('click', () => castBallot(name));

    const bar = document.createElement('div');
    bar.className = 'vote-bar';
    bar.style.width = `${(voters.length / maxCount) * 100}%`;

    const row = document.createElement('div');
    row.className = 'vote-row';
    const label = document.createElement('span');
    label.textContent = `${menu?.emoji || '🍽️'} ${name}`;
    const count = document.createElement('span');
    count.className = 'vote-count';
    count.textContent = `${voters.length}표`;
    row.append(label, count);
    btn.append(bar, row);

    if (voters.length) {
      const who = document.createElement('div');
      who.className = 'vote-voters';
      who.textContent = voters.join(', ');
      btn.append(who);
    }

    const warnings = [];
    const myConflicts = conflictsOf(menu, mine);
    if (myConflicts.length) warnings.push(`나: ${myConflicts.join(', ')}`);
    for (const [person, list] of Object.entries(restrictions)) {
      const c = conflictsOf(menu, list);
      if (c.length) warnings.push(`${person}: ${c.join(', ')}`);
    }
    if (warnings.length) {
      const warn = document.createElement('div');
      warn.className = 'vote-warn';
      warn.textContent = `⚠️ 못 먹는 사람 있음 — ${warnings.join(' · ')}`;
      btn.append(warn);
    }

    li.append(btn);
    list.append(li);
  }

  $('closeVoteBtn').hidden = v.closed || !voteTokens()[v.id];
  if (!v.closed && !$('voteMessage').classList.contains('error')) {
    setMessage('voteMessage', myName ? '메뉴를 누르면 투표돼요. 다시 누르면 바꿀 수 있어요.' : '이름을 입력하고 메뉴를 눌러 투표하세요.');
  } else if (v.closed) {
    setMessage('voteMessage', '');
  }
}

async function castBallot(menu) {
  const name = $('voterName').value.trim();
  if (!name) {
    setMessage('voteMessage', '먼저 이름을 입력해주세요!', true);
    $('voterName').focus();
    return;
  }
  saveJson(VOTER_NAME_KEY, name);
  try {
    state.vote.data = await api(`/api/votes/${state.vote.id}/ballot`, {
      method: 'POST',
      body: { name, menu, allergens: myRestrictions() },
    });
    setMessage('voteMessage', '');
    renderVote();
  } catch (err) {
    setMessage('voteMessage', err.message, true);
  }
}

async function closeVote() {
  if (!confirm('투표를 마감할까요? 마감 후에는 투표할 수 없어요.')) return;
  try {
    state.vote.data = await api(`/api/votes/${state.vote.id}/close`, {
      method: 'POST',
      body: { token: voteTokens()[state.vote.id] },
    });
    renderVote();
  } catch (err) {
    setMessage('voteMessage', err.message, true);
  }
}

async function copyShareLink() {
  const link = $('shareLink').value;
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    $('shareLink').select();
    document.execCommand('copy');
  }
  $('copyLinkBtn').textContent = '복사됨 ✓';
  setTimeout(() => ($('copyLinkBtn').textContent = '링크 복사'), 1500);
}

// ---------- 초기화 ----------
async function init() {
  const res = await fetch('/api/menus');
  const data = await res.json();
  state.allMenus = data.menus;
  renderChips('categoryChips', data.categories, state.categories);
  renderChips('tagChips', data.tags, state.tags);
  renderAllergenChips(data.allergens);

  $('avoidInput').value = loadJson(AVOID_KEY, '');
  $('avoidInput').addEventListener('input', () => {
    saveJson(AVOID_KEY, $('avoidInput').value);
    if (state.vote) renderVote();
  });
  $('vegetarianBtn').addEventListener('click', () => {
    MEAT_ALLERGENS.forEach((m) => state.allergens.add(m));
    saveAllergens();
    renderAllergenChips(data.allergens);
    if (state.vote) renderVote();
  });

  $('createVoteBtn').addEventListener('click', createVote);
  $('closeVoteBtn').addEventListener('click', closeVote);
  $('copyLinkBtn').addEventListener('click', copyShareLink);
  $('voterName').addEventListener('input', () => {
    if ($('voteMessage').classList.contains('error')) setMessage('voteMessage', '');
    renderVote();
  });

  const voteId = new URLSearchParams(location.search).get('vote');
  if (voteId) openVote(voteId);

  $('priceRange').addEventListener('input', updatePriceLabel);
  $('recommendBtn').addEventListener('click', recommend);
  // 플로팅 버튼: 어디서든 결과 영역으로 올라가며 바로 추천
  $('frapBtn').addEventListener('click', () => {
    document.querySelector('.feature-band').scrollIntoView({ behavior: 'smooth' });
    if (!$('recommendBtn').disabled) recommend();
  });
  $('decideBtn').addEventListener('click', decide);
  $('clearHistory').addEventListener('click', async () => {
    if (!state.history.length || !confirm('먹은 메뉴 기록을 모두 지울까요?')) return;
    try {
      state.history = await api(`/api/history?client=${clientId()}`, { method: 'DELETE' });
      renderHistory();
    } catch (err) {
      alert(err.message);
    }
  });

  updatePriceLabel();
  renderHistory();
  migrateLocalHistory().then(loadHistory);
  loadWeather();
}

init();
