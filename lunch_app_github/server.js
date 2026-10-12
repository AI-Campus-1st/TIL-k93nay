// 점심 메뉴 추천 서비스 - 외부 의존성 없는 Node.js 서버
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const store = require('./db');
const { VoteError, createVote, castBallot, closeVote, getVoteView } = require('./votes');

const seeded = store.seedMenus(); // DB 가 비어 있으면 data/menus.json 으로 초기 데이터 입력
if (seeded) console.log(`메뉴 초기 데이터 ${seeded}개를 DB에 넣었어요.`);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': MIME['.json'] });
  res.end(JSON.stringify(body));
}

function splitParam(value) {
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

// 쿼리 조건으로 메뉴 후보 검색 (DB)
function filterMenus(params) {
  const maxPrice = Number(params.get('maxPrice'));
  return store.findMenus({
    categories: splitParam(params.get('category')),
    tags: splitParam(params.get('tags')),
    exclude: splitParam(params.get('exclude')),
    maxPrice: maxPrice > 0 ? maxPrice : undefined,
    spicy: params.get('spicy'), // 'yes' | 'no' | 그 외(상관없음)
    allergens: splitParam(params.get('allergens')),
    avoid: splitParam(params.get('avoid')), // 못 먹는 음식 키워드 (메뉴 이름에 포함되면 제외)
  });
}

// 로그인이 없으므로 브라우저마다 만든 임의 ID 로 기록을 구분
const CLIENT_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
function requireClientId(value) {
  if (!CLIENT_ID_RE.test(String(value || ''))) throw new VoteError(400, '잘못된 사용자 ID예요.');
  return value;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new VoteError(413, '요청이 너무 커요.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new VoteError(400, '잘못된 요청 형식이에요.'));
      }
    });
    req.on('error', reject);
  });
}

// ---------- 날씨 (Open-Meteo, API 키 불필요) ----------
const WEATHER_CACHE_MS = 10 * 60 * 1000;
const weatherCache = new Map();

// 날씨 유형별 추천 규칙: boost 태그는 가중치 ↑, avoid 태그는 가중치 ↓
const WEATHER_PROFILES = {
  rain: { label: '비', emoji: '🌧️', boost: ['비오는날'], avoid: ['더운날'], message: '비 오는 날엔 뜨끈한 국물 요리 어때요?' },
  snow: { label: '눈', emoji: '❄️', boost: ['비오는날', '든든하게'], avoid: ['더운날'], message: '눈 오는 날엔 몸을 녹여줄 따뜻한 음식!' },
  hot: { label: '더움', emoji: '☀️', boost: ['더운날'], avoid: ['비오는날'], message: '더운 날엔 시원하고 가벼운 메뉴로!' },
  cold: { label: '추움', emoji: '🥶', boost: ['비오는날', '든든하게'], avoid: ['더운날'], message: '쌀쌀한 날씨엔 든든하고 따뜻하게!' },
  mild: { label: '맑음', emoji: '🌤️', boost: ['가볍게', '건강하게'], avoid: [], message: '날씨 좋은 날엔 가볍고 산뜻하게!' },
};

function classifyWeather(code, temp) {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain';
  if (temp >= 27) return 'hot';
  if (temp <= 5) return 'cold';
  return 'mild';
}

async function getWeather(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.at < WEATHER_CACHE_MS) return cached.data;

  const api = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const r = await fetch(api, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`weather api ${r.status}`);
  const { current } = await r.json();
  const type = classifyWeather(current.weather_code, current.temperature_2m);
  const { boost, avoid, ...profile } = WEATHER_PROFILES[type];
  const data = { type, temperature: current.temperature_2m, ...profile };
  weatherCache.set(key, { at: Date.now(), data });
  return data;
}

// 날씨에 맞는 메뉴일수록 잘 뽑히도록 가중치 랜덤 선택
function weightOf(menu, weatherType) {
  const profile = WEATHER_PROFILES[weatherType];
  if (!profile) return 1;
  if (menu.tags.some((t) => profile.boost.includes(t))) return 4;
  if (menu.tags.some((t) => profile.avoid.includes(t))) return 0.3;
  return 1;
}

function weightedPick(candidates, weatherType) {
  const weights = candidates.map((m) => weightOf(m, weatherType));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function isWeatherMatch(menu, weatherType) {
  const profile = WEATHER_PROFILES[weatherType];
  return Boolean(profile && menu.tags.some((t) => profile.boost.includes(t)));
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/weather') {
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return sendJson(res, 400, { error: '위치 정보가 올바르지 않아요.' });
    }
    try {
      return sendJson(res, 200, await getWeather(lat, lon));
    } catch (err) {
      console.error('날씨 조회 실패:', err.message);
      return sendJson(res, 502, { error: '날씨 정보를 가져오지 못했어요.' });
    }
  }

  if (url.pathname === '/api/menus') {
    return sendJson(res, 200, { menus: store.findMenus(), ...store.getMenuMeta() });
  }

  if (url.pathname.startsWith('/api/votes')) return handleVotes(req, res, url);

  if (url.pathname === '/api/history') return handleHistory(req, res, url);

  if (url.pathname === '/api/info') return sendJson(res, 200, { lanUrls: lanUrls() });

  if (url.pathname === '/api/recommend') {
    const candidates = filterMenus(url.searchParams);
    if (!candidates.length) {
      return sendJson(res, 404, { error: '조건에 맞는 메뉴가 없어요. 필터를 조금 풀어보세요!' });
    }
    const weather = url.searchParams.get('weather'); // rain | snow | hot | cold | mild | 없음
    const pick = weightedPick(candidates, weather);
    return sendJson(res, 200, {
      pick,
      weatherMatch: isWeatherMatch(pick, weather),
      candidates: candidates.map((m) => m.name),
      total: candidates.length,
    });
  }

  sendJson(res, 404, { error: 'Not found' });
}

// 필터 결과에서 날씨 가중치를 반영해 서로 다른 메뉴 count개 뽑기
function pickVoteCandidates(params, count, include) {
  const pool = filterMenus(params);
  const weather = params.get('weather');
  const picked = [];
  if (include && store.menuExists(include)) picked.push(include);
  let rest = pool.filter((m) => !picked.includes(m.name));
  while (picked.length < count && rest.length) {
    const m = weightedPick(rest, weather);
    picked.push(m.name);
    rest = rest.filter((r) => r !== m);
  }
  return picked;
}

// ---------- 팀 투표 ----------
//   POST /api/votes               투표 생성 { title, query, count, include } 또는 { title, candidates }
//   GET  /api/votes/:id           투표 현황
//   POST /api/votes/:id/ballot    투표하기 { name, menu, allergens }
//   POST /api/votes/:id/close     마감 { token }
async function handleVotes(req, res, url) {
  const [, , , id, action] = url.pathname.split('/');
  try {
    if (!id && req.method === 'POST') {
      const body = await readJsonBody(req);
      let candidates;
      if (Array.isArray(body.candidates)) {
        candidates = body.candidates.filter((c) => store.menuExists(c)).slice(0, 8);
      } else {
        const count = Math.min(Math.max(Number(body.count) || 4, 2), 6);
        candidates = pickVoteCandidates(new URLSearchParams(String(body.query || '')), count, body.include);
      }
      if (candidates.length < 2) {
        throw new VoteError(400, '조건에 맞는 메뉴가 2개 미만이라 투표를 만들 수 없어요. 필터를 조금 풀어보세요!');
      }
      return sendJson(res, 201, createVote({ title: body.title, candidates }));
    }
    if (id && !action && req.method === 'GET') return sendJson(res, 200, getVoteView(id));
    if (id && action === 'ballot' && req.method === 'POST') {
      return sendJson(res, 200, castBallot(id, await readJsonBody(req)));
    }
    if (id && action === 'close' && req.method === 'POST') {
      const { token } = await readJsonBody(req);
      return sendJson(res, 200, closeVote(id, token));
    }
    return sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    if (err instanceof VoteError) return sendJson(res, err.status, { error: err.message });
    throw err;
  }
}

// ---------- 최근 먹은 메뉴 ----------
//   GET    /api/history?client=ID       목록
//   POST   /api/history { client, menu, at? }  기록 추가 (at: 이전 기록 옮길 때)
//   DELETE /api/history?client=ID       전체 삭제
async function handleHistory(req, res, url) {
  try {
    if (req.method === 'GET') {
      return sendJson(res, 200, store.getHistory(requireClientId(url.searchParams.get('client'))));
    }
    if (req.method === 'POST') {
      const { client, menu, at } = await readJsonBody(req);
      const clientId = requireClientId(client);
      if (!store.menuExists(menu)) throw new VoteError(400, '없는 메뉴예요.');
      const now = Date.now();
      const eatenAt = Number.isFinite(at) && at > now - 30 * 24 * 60 * 60 * 1000 && at <= now ? at : now;
      store.addHistory(clientId, menu, eatenAt);
      return sendJson(res, 201, store.getHistory(clientId));
    }
    if (req.method === 'DELETE') {
      store.clearHistory(requireClientId(url.searchParams.get('client')));
      return sendJson(res, 200, []);
    }
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof VoteError) return sendJson(res, err.status, { error: err.message });
    throw err;
  }
}

// 같은 네트워크의 팀원이 접속할 수 있는 주소 목록
function lanUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}`);
}

function serveStatic(res, pathname) {
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    return handleApi(req, res, url).catch((err) => {
      console.error(err);
      sendJson(res, 500, { error: 'Internal server error' });
    });
  }
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  serveStatic(res, decodeURIComponent(url.pathname));
});

server.listen(PORT, () => {
  console.log(`🍱 점심 메뉴 추천 서비스 실행 중: http://localhost:${PORT}`);
  for (const u of lanUrls()) console.log(`   팀원 접속 주소: ${u}`);
});
