// 팀 투표 저장소 - SQLite (votes / vote_candidates / ballots 테이블)
const crypto = require('crypto');
const { db, transaction } = require('./db');

const VOTE_TTL_MS = 24 * 60 * 60 * 1000; // 하루 지난 투표는 삭제
const MAX_VOTERS = 50;
const MAX_NAME_LEN = 20;

function cleanup() {
  // 후보와 투표 기록은 ON DELETE CASCADE 로 함께 삭제
  db.prepare('DELETE FROM votes WHERE created_at < ?').run(Date.now() - VOTE_TTL_MS);
}
setInterval(cleanup, 60 * 60 * 1000).unref();
cleanup();

class VoteError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const stmt = {
  vote: db.prepare('SELECT * FROM votes WHERE id = ?'),
  candidates: db.prepare('SELECT menu_name FROM vote_candidates WHERE vote_id = ? ORDER BY position'),
  ballots: db.prepare('SELECT voter, menu_name, restrictions FROM ballots WHERE vote_id = ? ORDER BY updated_at'),
  insertVote: db.prepare('INSERT INTO votes (id, token, title, created_at) VALUES (?, ?, ?, ?)'),
  insertCandidate: db.prepare('INSERT INTO vote_candidates (vote_id, menu_name, position) VALUES (?, ?, ?)'),
  hasBallot: db.prepare('SELECT 1 FROM ballots WHERE vote_id = ? AND voter = ?'),
  countBallots: db.prepare('SELECT COUNT(*) AS n FROM ballots WHERE vote_id = ?'),
  upsertBallot: db.prepare(`
    INSERT INTO ballots (vote_id, voter, menu_name, restrictions, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (vote_id, voter) DO UPDATE SET
      menu_name = excluded.menu_name, restrictions = excluded.restrictions, updated_at = excluded.updated_at`),
  tally: db.prepare(`
    SELECT c.menu_name, COUNT(b.voter) AS n
    FROM vote_candidates c LEFT JOIN ballots b ON b.vote_id = c.vote_id AND b.menu_name = c.menu_name
    WHERE c.vote_id = ? GROUP BY c.menu_name`),
  close: db.prepare('UPDATE votes SET closed = 1, winner = ? WHERE id = ?'),
};

function getVote(id) {
  const vote = stmt.vote.get(String(id));
  if (!vote) throw new VoteError(404, '투표를 찾을 수 없어요. 만료되었거나 잘못된 링크예요.');
  return vote;
}

// 클라이언트에 보낼 형태 (생성자 토큰은 숨김)
function toPublic(vote) {
  const candidates = stmt.candidates.all(vote.id).map((r) => r.menu_name);
  const tally = Object.fromEntries(candidates.map((c) => [c, []]));
  const allergies = {};
  const ballots = stmt.ballots.all(vote.id);
  for (const b of ballots) {
    tally[b.menu_name]?.push(b.voter);
    const list = JSON.parse(b.restrictions);
    if (list.length) allergies[b.voter] = list;
  }
  return {
    id: vote.id,
    title: vote.title,
    candidates,
    tally,
    allergies,
    voterCount: ballots.length,
    closed: Boolean(vote.closed),
    winner: vote.winner,
    createdAt: vote.created_at,
  };
}

function cleanName(name) {
  const trimmed = String(name || '').trim().slice(0, MAX_NAME_LEN);
  if (!trimmed) throw new VoteError(400, '이름을 입력해주세요.');
  return trimmed;
}

function createVote({ title, candidates }) {
  const unique = [...new Set(candidates)];
  if (unique.length < 2) throw new VoteError(400, '투표 후보가 2개 이상 필요해요.');
  const id = crypto.randomBytes(4).toString('hex');
  const token = crypto.randomBytes(16).toString('hex');
  const cleanTitle = String(title || '').trim().slice(0, 40) || '오늘 점심 뭐 먹을까요?';
  transaction(() => {
    stmt.insertVote.run(id, token, cleanTitle, Date.now());
    unique.forEach((menu, i) => stmt.insertCandidate.run(id, menu, i));
  });
  return { vote: toPublic(getVote(id)), token };
}

function castBallot(id, { name, menu, allergens }) {
  const vote = getVote(id);
  if (vote.closed) throw new VoteError(409, '이미 마감된 투표예요.');
  const voter = cleanName(name);
  const candidates = stmt.candidates.all(vote.id).map((r) => r.menu_name);
  if (!candidates.includes(menu)) throw new VoteError(400, '후보에 없는 메뉴예요.');
  const restrictions = Array.isArray(allergens)
    ? allergens.map((a) => String(a).trim().slice(0, MAX_NAME_LEN)).filter(Boolean).slice(0, 20)
    : [];
  transaction(() => {
    const isNew = !stmt.hasBallot.get(vote.id, voter);
    if (isNew && stmt.countBallots.get(vote.id).n >= MAX_VOTERS) {
      throw new VoteError(409, '참여 인원이 가득 찼어요.');
    }
    // 같은 이름으로 다시 투표하면 변경
    stmt.upsertBallot.run(vote.id, voter, menu, JSON.stringify(restrictions), Date.now());
  });
  return toPublic(vote);
}

function closeVote(id, token) {
  const vote = getVote(id);
  if (vote.token !== token) throw new VoteError(403, '투표를 만든 사람만 마감할 수 있어요.');
  if (!vote.closed) {
    const rows = stmt.tally.all(vote.id);
    const max = Math.max(0, ...rows.map((r) => r.n));
    const top = rows.filter((r) => r.n === max).map((r) => r.menu_name);
    // 동점이면 동점 후보 중 랜덤으로 결정
    const winner = max > 0 ? top[Math.floor(Math.random() * top.length)] : null;
    stmt.close.run(winner, vote.id);
  }
  return toPublic(getVote(id));
}

module.exports = { VoteError, createVote, castBallot, closeVote, getVoteView: (id) => toPublic(getVote(id)) };
