// SQLite 데이터베이스 (Node.js 내장 node:sqlite — 별도 설치 불필요)
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'lunch.db');
const SEED_FILE = path.join(__dirname, 'data', 'menus.json');

const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS menus (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL UNIQUE,
    category TEXT    NOT NULL,
    price    INTEGER NOT NULL,
    spicy    INTEGER NOT NULL DEFAULT 0,
    emoji    TEXT    NOT NULL DEFAULT '🍽️'
  );

  CREATE TABLE IF NOT EXISTS menu_tags (
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    tag     TEXT    NOT NULL,
    PRIMARY KEY (menu_id, tag)
  );

  CREATE TABLE IF NOT EXISTS menu_allergens (
    menu_id  INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    allergen TEXT    NOT NULL,
    PRIMARY KEY (menu_id, allergen)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id         TEXT    PRIMARY KEY,
    token      TEXT    NOT NULL,
    title      TEXT    NOT NULL,
    closed     INTEGER NOT NULL DEFAULT 0,
    winner     TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vote_candidates (
    vote_id   TEXT    NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
    menu_name TEXT    NOT NULL,
    position  INTEGER NOT NULL,
    PRIMARY KEY (vote_id, menu_name)
  );

  CREATE TABLE IF NOT EXISTS ballots (
    vote_id      TEXT    NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
    voter        TEXT    NOT NULL,
    menu_name    TEXT    NOT NULL,
    restrictions TEXT    NOT NULL DEFAULT '[]', -- 못 먹는 것 (JSON 배열)
    updated_at   INTEGER NOT NULL,
    PRIMARY KEY (vote_id, voter)
  );

  -- 최근 먹은 메뉴 (로그인이 없으므로 브라우저별 client_id 로 구분)
  CREATE TABLE IF NOT EXISTS meal_history (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT    NOT NULL,
    menu_name TEXT    NOT NULL,
    eaten_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_menu_tags_tag ON menu_tags(tag);
  CREATE INDEX IF NOT EXISTS idx_menu_allergens_allergen ON menu_allergens(allergen);
  CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at);
  CREATE INDEX IF NOT EXISTS idx_history_client ON meal_history(client_id, eaten_at DESC);
`);

function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------- 메뉴 ----------
function seedMenus({ reset = false } = {}) {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM menus').get();
  if (count > 0 && !reset) return 0;
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const insertMenu = db.prepare(
    'INSERT INTO menus (name, category, price, spicy, emoji) VALUES (?, ?, ?, ?, ?)'
  );
  const insertTag = db.prepare('INSERT INTO menu_tags (menu_id, tag) VALUES (?, ?)');
  const insertAllergen = db.prepare('INSERT INTO menu_allergens (menu_id, allergen) VALUES (?, ?)');
  return transaction(() => {
    if (reset) db.exec('DELETE FROM menus; DELETE FROM sqlite_sequence WHERE name = \'menus\';');
    for (const m of seed) {
      const { lastInsertRowid } = insertMenu.run(m.name, m.category, m.price, m.spicy ? 1 : 0, m.emoji);
      for (const t of m.tags) insertTag.run(lastInsertRowid, t);
      for (const a of m.allergens) insertAllergen.run(lastInsertRowid, a);
    }
    return seed.length;
  });
}

const MENU_SELECT = `
  SELECT m.id, m.name, m.category, m.price, m.spicy, m.emoji,
    (SELECT json_group_array(tag) FROM (SELECT tag FROM menu_tags WHERE menu_id = m.id ORDER BY rowid)) AS tags,
    (SELECT json_group_array(allergen) FROM (SELECT allergen FROM menu_allergens WHERE menu_id = m.id ORDER BY rowid)) AS allergens
  FROM menus m`;

function toMenu(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    spicy: Boolean(row.spicy),
    emoji: row.emoji,
    tags: JSON.parse(row.tags),
    allergens: JSON.parse(row.allergens),
  };
}

const placeholders = (arr) => arr.map(() => '?').join(', ');
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

// 조건에 맞는 메뉴 검색 — 필터는 모두 SQL 로 처리
function findMenus({ categories = [], tags = [], exclude = [], maxPrice, spicy, allergens = [], avoid = [] } = {}) {
  const where = [];
  const params = [];
  if (categories.length) {
    where.push(`m.category IN (${placeholders(categories)})`);
    params.push(...categories);
  }
  if (Number.isFinite(maxPrice)) {
    where.push('m.price <= ?');
    params.push(maxPrice);
  }
  if (spicy === 'yes') where.push('m.spicy = 1');
  if (spicy === 'no') where.push('m.spicy = 0');
  if (tags.length) {
    where.push(`EXISTS (SELECT 1 FROM menu_tags t WHERE t.menu_id = m.id AND t.tag IN (${placeholders(tags)}))`);
    params.push(...tags);
  }
  if (exclude.length) {
    where.push(`m.name NOT IN (${placeholders(exclude)})`);
    params.push(...exclude);
  }
  if (allergens.length) {
    where.push(
      `NOT EXISTS (SELECT 1 FROM menu_allergens a WHERE a.menu_id = m.id AND a.allergen IN (${placeholders(allergens)}))`
    );
    params.push(...allergens);
  }
  for (const word of avoid) {
    where.push("m.name NOT LIKE ? ESCAPE '\\'");
    params.push(`%${escapeLike(word)}%`);
  }
  const sql = `${MENU_SELECT}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY m.id`;
  return db.prepare(sql).all(...params).map(toMenu);
}

function getMenuMeta() {
  // 처음 등장한 순서대로 정렬
  const list = (sql) => db.prepare(sql).all().map((r) => r.v);
  return {
    categories: list('SELECT category AS v FROM menus GROUP BY category ORDER BY MIN(id)'),
    tags: list('SELECT tag AS v FROM menu_tags GROUP BY tag ORDER BY MIN(rowid)'),
    allergens: list('SELECT allergen AS v FROM menu_allergens GROUP BY allergen ORDER BY MIN(rowid)'),
  };
}

function menuExists(name) {
  return Boolean(db.prepare('SELECT 1 FROM menus WHERE name = ?').get(name));
}

// ---------- 최근 먹은 메뉴 ----------
function getHistory(clientId, limit = 20) {
  return db
    .prepare(
      `SELECT h.id, h.menu_name AS name, h.eaten_at AS at, m.emoji
       FROM meal_history h LEFT JOIN menus m ON m.name = h.menu_name
       WHERE h.client_id = ? ORDER BY h.eaten_at DESC, h.id DESC LIMIT ?`
    )
    .all(clientId, limit);
}

function addHistory(clientId, menuName, eatenAt = Date.now()) {
  db.prepare('INSERT INTO meal_history (client_id, menu_name, eaten_at) VALUES (?, ?, ?)').run(
    clientId,
    menuName,
    eatenAt
  );
}

function clearHistory(clientId) {
  db.prepare('DELETE FROM meal_history WHERE client_id = ?').run(clientId);
}

module.exports = {
  db,
  transaction,
  seedMenus,
  findMenus,
  getMenuMeta,
  menuExists,
  getHistory,
  addHistory,
  clearHistory,
};

// `node db.js --reset` : menus.json 기준으로 메뉴 테이블 다시 채우기
if (require.main === module && process.argv.includes('--reset')) {
  console.log(`메뉴 ${seedMenus({ reset: true })}개를 다시 불러왔어요. (${DB_FILE})`);
}
