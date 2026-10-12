# 🍱 오늘 뭐 먹지? — 점심 메뉴 추천 서비스

조건(음식 종류, 기분, 가격, 매운맛)에 맞춰 점심 메뉴를 랜덤 추천해주는 웹 서비스입니다.

## 실행

```bash
npm start
```

브라우저에서 http://localhost:3000 접속. 외부 패키지 설치 없이 Node.js(22.13 이상)만 있으면 됩니다.

팀원은 같은 네트워크에서 서버 실행 시 콘솔에 표시되는 `팀원 접속 주소`로 접속합니다. (투표 링크는 자동으로 이 주소로 만들어져요. Windows 방화벽에서 Node.js 허용이 필요할 수 있어요.)

## 배포 (Render)

GitHub 저장소를 Render에 연결해 배포합니다. 설정은 `render.yaml`에 있습니다.

- Build Command: `npm install` / Start Command: `npm start` / Instance: Free
- Node.js 24 사용 (`NODE_VERSION=24`)
- 무료 플랜은 15분간 접속이 없으면 잠들어서 첫 접속에 30초~1분 걸립니다.
- 무료 플랜은 디스크가 유지되지 않아 서버가 재시작되면 투표·기록이 초기화됩니다. 메뉴는 `data/menus.json`에서 자동으로 다시 채워집니다.

## 기능

- 음식 종류 / 오늘의 기분(해장, 비오는날, 가볍게 등) / 최대 가격 / 매운맛 필터
- **날씨 맞춤 추천**: 현재 위치(권한 거부 시 서울)의 날씨를 [Open-Meteo](https://open-meteo.com/)에서 가져와 비/눈/더움/추움/맑음에 어울리는 메뉴가 더 잘 뽑히도록 가중치 적용 (토글로 끌 수 있음)
- **알러지 · 못 먹는 음식 제외**: 알러지 재료(밀·갑각류·견과류 등 11종) 선택, "육류 전부 제외" 버튼, 못 먹는 메뉴 키워드 입력. 브라우저에 저장되고 추천·투표에 모두 적용
- **팀 투표**: 현재 조건에 맞는 후보 3~6개로 투표를 만들고 링크 공유. 실시간(3초) 집계, 이름 기준 1인 1표(재투표 시 변경), 팀원별 못 먹는 메뉴 경고 표시, 만든 사람만 마감 가능(동점이면 랜덤). 투표는 DB에 저장되고 24시간 후 삭제
- 룰렛 애니메이션으로 메뉴 추천, 직전 메뉴는 연속으로 나오지 않음
- "이걸로 결정" 시 DB에 기록 저장(브라우저별 ID로 구분), 최근 3일 동안 먹은 메뉴 자동 제외
- 네이버 지도로 주변 식당 바로 검색

## 구조

```
server.js          # Node.js HTTP 서버 (정적 파일 + API)
db.js              # SQLite 연결, 스키마, 메뉴 검색·기록 쿼리
votes.js           # 팀 투표 저장/집계
data/menus.json    # 메뉴 초기 데이터 (DB가 비어 있을 때 자동 입력)
data/lunch.db      # SQLite DB 파일 (서버 첫 실행 시 자동 생성)
public/            # 프론트엔드 (index.html, style.css, app.js)
```

## 데이터베이스

Node.js 내장 `node:sqlite`를 사용해 별도 설치 없이 `data/lunch.db`에 저장합니다. (경로는 환경변수 `DB_FILE`로 변경 가능)

| 테이블 | 내용 |
| --- | --- |
| `menus` | 메뉴 (이름, 종류, 가격, 매운맛, 이모지) |
| `menu_tags` / `menu_allergens` | 메뉴별 태그 / 알러지 재료 |
| `votes` / `vote_candidates` / `ballots` | 투표, 후보, 투표 기록(투표자별 못 먹는 것 포함) |
| `meal_history` | 최근 먹은 메뉴 (브라우저별 `client_id`) |

`data/menus.json`을 고친 뒤 DB에 다시 반영하려면 아래 명령을 실행하세요. 메뉴 테이블만 다시 채우고, 투표와 기록은 그대로 둡니다.

```bash
npm run db:reset
```

## API

| 경로 | 설명 |
| --- | --- |
| `GET /api/menus` | 전체 메뉴, 카테고리, 태그 목록 |
| `GET /api/weather?lat=&lon=` | 현재 날씨와 유형(`rain`/`snow`/`hot`/`cold`/`mild`), 10분 캐시 |
| `GET /api/recommend` | 가중치 랜덤 추천. 쿼리: `category`, `tags`(쉼표 구분), `maxPrice`, `spicy`(yes/no/any), `exclude`(쉼표 구분), `weather`(날씨 유형), `allergens`(쉼표 구분), `avoid`(메뉴 이름 키워드, 쉼표 구분) |
| `POST /api/votes` | 투표 생성. `{ title, count, query, include }` (query는 recommend와 같은 조건) 또는 `{ title, candidates }`. 응답의 `token`으로 마감 |
| `GET /api/votes/:id` | 투표 현황 (후보별 투표자, 팀원별 못 먹는 것, 마감 여부, 결과) |
| `POST /api/votes/:id/ballot` | 투표 `{ name, menu, allergens }` |
| `POST /api/votes/:id/close` | 마감 `{ token }` |
| `GET /api/history?client=` | 최근 먹은 메뉴 목록 |
| `POST /api/history` | 기록 추가 `{ client, menu, at? }` |
| `DELETE /api/history?client=` | 기록 전체 삭제 |
| `GET /api/info` | 같은 네트워크 접속 주소 |
