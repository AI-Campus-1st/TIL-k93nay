# COURSE.md (코스 생성 및 공유 완료 화면 명세서 - 전체 완전본 v2.2)

## [Page] SCR-03: 코스 생성 및 공유 완료 화면 명세서

---

### 1. 화면 개요 및 목적
* **화면 ID**: SCR-03
* **화면명**: 1클릭 골목 탐방 코스 추천 및 카카오톡 공유 완료 화면
* **관련 시나리오**: 04. 이탈/전환
* **지도 엔진**: 네이버지도 API v3 (`naver.maps.Polyline`)
* **목적**: 요약 카드에서 추천 코스 생성 버튼을 눌러 차량 통행 스트레스가 없는 최적 보행 동선 라인을 네이버지도 위에 드로잉하고, 외부 공유 및 토스트 알림을 통해 주말 나들이 실행을 완료시킴.

---

### 2. 레이아웃 구조 (Layered Specs)

- **Layer 0 (Naver Map Polyline Overlay)**: 네이버지도 전면 캔버스 기반 1순위 실선 및 대안 점선 보행 경로 렌더링
  - `naver.maps.Polyline` 및 `naver.maps.Marker` 커스텀 아이콘 레이어

- **Layer 1 (Sticky-Top Navigation - 표준 기준 헤더)**: 상단 내비게이션 바 (`primary-nav`, Height: 64px)
  - 좌측: Local Hip 네온 로고 ("Local Hip" 텍스트 + `#ff1493` 포인트 닷)
  - 우측: **'사람 아이콘 / 마이페이지' 프로필 버튼 (`user-profile-avatar`, 40px 원형 `#f7f7f3` 패널 + SVG 사람 아이콘)** & 알림 종 아이콘 (`24px`)

- **Layer 2 (Left/Bottom Action Panel)**: 좌측/하단 코스 요약 정보 카드 및 액션 버튼 패널
  - `backgroundColor: #ffffff`, `borderRadius: 24px`, `padding: 24px`, `shadow: "0px 8px 24px rgba(0, 0, 0, 0.08)"`
  - 코스 타이틀("문래창작촌 뒷골목 추천 코스"), 순회 상점 정보, 도보 시간, 카카오톡 공유하기 및 도보 길안내 시작 버튼

- **Layer 3 (Toast Notification Panel)**: 공유 성공 시 표출되는 하단 알약 토스트 팝업 (`toast-notification`)
  - `backgroundColor: #111111`, `textColor: #ffffff`, `borderRadius: 9999px`, `padding: 12px 24px`

---

### 3. 지도 경로 매핑 규격 (Polyline Specs)

- **1순위 / 선택 추천 경로 (`course-primary-line`)**:
  - `naver.maps.Polyline` 생성
  - `strokeColor`: `"#ff1493"` (네온 핫핑크)
  - `strokeStyle`: `"solid"` (실선)
  - `strokeWeight`: `5`
  - `strokeOpacity`: `0.95`
  - `path`: 실제 보행자 도로망 위경도 좌표 배열 (`LineString`)

- **대안 / 기타 후보 경로 (`course-alternative-line`)**:
  - `naver.maps.Polyline` 생성
  - `strokeColor`: `"#a1a19a"` (Ash Gray)
  - `strokeStyle`: `"dash"` (`strokeDasharray: "6, 6"`, 점선)
  - `strokeWeight`: `3`
  - `strokeOpacity`: `0.65`
  - `path`: 대안 보행 경로 위경도 좌표 배열

- **상점 마커 (Waypoint Markers)**:
  - 순번 배지 (1, 2, 3, 4) 마커 표출 (`naver.maps.Marker` 커스텀 HTML 아이콘)
  - 예: `1. 신도림 진입로` -> `2. 포스트 포에틱스` -> `3. 폰트 문래` -> `4. 와인바 비닐`

- **매핑 원칙**: 단순 직결 직선 연결 금지! 네이버지도 보행자 길찾기 API 연동 실제 보행로 노드 좌표 배열(`LineString`) 기반 드로잉 필수.

---

### 4. 컴포넌트 및 토큰 매핑 규칙 (Component & Token Mapping Rules)

- **추천 동선 실선 (`course-primary-line`)**:
  - `strokeColor`: `{colors.primary}` (`#ff1493` 네온 핫핑크)
  - `strokeWidth`: `5px`
  - `strokeOpacity`: `0.95`
  - `strokeStyle`: `solid` (그라데이션을 배제한 단색 실선)

- **대안 동선 점선 (`course-alternative-line`)**:
  - `strokeColor`: `{colors.ash}` (`#a1a19a` Ash Gray)
  - `strokeWidth`: `3px`
  - `strokeOpacity`: `0.65`
  - `strokeStyle`: `dash` (`strokeDasharray: "6, 6"`)

- **순번 마커 배지 (`waypoint-marker`)**:
  - `backgroundColor`: `{colors.primary}` (`#ff1493`)
  - `textColor`: `{colors.canvas}` (`#ffffff`)
  - `borderRadius`: `{rounded.full}` (`9999px` 원형 배지)
  - `typography`: `{typography.body-sm-strong}`

- **토스트 알림 스타일 (`toast-notification`)**:
  - `backgroundColor`: `{colors.ink}` (`#111111` Ink Black)
  - `textColor`: `{colors.canvas}` (`#ffffff` Pure White)
  - `typography`: `{typography.body-sm}`
  - `borderRadius`: `{rounded.full}` (`9999px` 완전한 알약 형태)
  - `padding`: `12px 24px`

---

### 5. UI 레이아웃 구조도 (ASCII Layout)

```
+-----------------------------------------------------------------------------------------+
| [Local Hip Logo]                                              [로그인] [시작하기] [마이페이지(👤 사람 아이콘)] | -> primary-nav (64px 표준 헤더)
+-----------------------------------------------------------------------------------------+
|  [골목 보행 네트워크] [안심 보행 전용]                                                  |
|  문래창작촌 뒷골목 추천 코스                                                            |
|  총 4개 상점 순회 · 예상 도보 18분                                                       |
|  +-------------------------------------+  (Shop 1) ======= [1순위 실선] ===== (Shop 2)   |
|  | 1. 신도림 진입로 (출발지)           |                \                        ||   |
|  | 2. 독립서점 '포스트 포에틱스'        |                 \                       ||   |
|  | 3. 테라스 골목 로스터리 '폰트 문래' |                  (대안 경로 점선)       (Shop 3)  |
|  | 4. 루프탑 와인바 '비닐' (피날레)    |                                         ||   |
|  +-------------------------------------+                                      (Shop 4)  |
|  [ 카카오톡 공유하기 ]                                                                  | -> button-secondary
|  [ 도보 길안내 시작 ]                                                                   | -> button-primary
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   | (i) 카카오톡 공유 링크가 복사되었습니다!                                        |   | -> toast-notification
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

### 6. 세션 파라미터 보존 및 동적 인터랙션 규칙 (Interaction & Exception Rules)

1. **1클릭 코스 드로잉**:
   * "탐방 코스 추천받기" 버튼 탭 즉시 지도 중심점이 최적화되며, 상점 간 보행 네트워크 라인이 지도 위에 부드럽게 드로잉(`LineString Overlay`)됨.
   * *QA 필수 검증*: 차량 전용 대로변으로 우회하는 비정상 경로가 절대 포함되지 않아야 함.
2. **공유 링크 세션 파라미터 보존**:
   * "카카오톡 공유하기" 클릭 시 외부 API 창이 뜨고 완료 시 토스트 알림 노출.
   * 공유된 링크(`?zone_id=GEO_SEOUL_0032&walk_weight=70&store_weight=30&course_id=C_9281`)를 통해 친구가 재진입했을 때, 유저가 세팅했던 **가중치 슬라이더 값, 선택한 골목 ID, 생성된 코스 라인 좌표가 깨짐 없이 그대로 복원**되어 렌더링되어야 함.
