# HOME.md (지도 홈 & 탐색 화면 명세서 - 전체 완전본 v2.2)

## [Page] SCR-01: 지도 홈 & 탐색 화면 명세서

---

### 1. 화면 개요 및 목적
* **화면 ID**: SCR-01
* **화면명**: 서울 '로컬 힙' 지수 지도 홈 & 탐색 화면
* **관련 시나리오**: 01. 진입, 02. 탐색/입력
* **지도 엔진**: 네이버지도 API v3 (`Naver Maps JS API v3`)
* **목적**: 1030 뚜벅이 유저가 접속 후 3초 이내에 차 없이 걷기 좋은 힙스터 골목 구역을 '블러 도넛' 마커 형태로 확인하고, 상단 한 줄 필터바를 통해 실시간으로 조작할 수 있도록 제공.

---

### 2. 레이아웃 구조 (Layered Specs)

- **Layer 0 (Base Map Canvas)**: 네이버지도 전면 공간 지도 레이어 (`naver.maps.Map`)
  - 옵션: `zoom: 14`, `mapTypeId: naver.maps.MapTypeId.NORMAL`, `scaleControl: false`
  - 네이버지도 타일 연동으로 국내 상세 한글 도로명, 주요 상권, 지하철역 라벨링 명확 노출.

- **Layer 1 (Sticky-Top Navigation - Course 화면 기준 통일)**: 상단 내비게이션 바 (`primary-nav`, Height: 64px)
  - **Course(SCR-03) 화면과 동일한 세팅으로 전면 통일**:
  - 좌측: Local Hip 네온 로고 ("Local Hip" 텍스트 + `#ff1493` 포인트 닷)
  - 우측: **'사람 아이콘 / 마이페이지' 프로필 버튼 (`user-profile-avatar`, 40px 원형 `#f7f7f3` 패널 + SVG 사람 아이콘)** & 알림 종 아이콘 (`24px`)

- **Layer 2 (Floating Filter Bar - 컨테이너 확장 & 슬라이더 안착)**: 상단 알약 조건 필터바 (`floating-filter-bar`)
  - **레이아웃 스펙**: `height: 56px`, `min-width: 960px` ~ `1080px` (여유 길이 확장), `backgroundColor: #ffffff`, `borderRadius: 9999px`, `padding: 8px 24px`, `shadow: "0px 4px 16px rgba(0,0,0,0.06)"`
  - **한 줄(Single Line) 오버플로우 방지**: `display: flex`, `flex-direction: row`, `flex-wrap: nowrap` (`white-space: nowrap`), `align-items: center`, `gap: 16px`, `overflow-x: auto`, `scrollbar-width: none`
  - **배치 컴포넌트 순서**:
    1. **'프랜차이즈 제외' 토글 스위치**: 기본값 ON (`flex-shrink: 0`)
    2. **세로 구분선**: `1px solid #e5e5e0` (높이 24px)
    3. **선호 업종 멀티 칩**: '감성 카페', '이색 소품샵', '독립 서점', '빈티지 숍' (`filter-chip`)
    4. **세로 구분선**: `1px solid #e5e5e0` (높이 24px)
    5. **보행 쾌적도 인라인 미니 슬라이더 🏃**: `inline-micro-slider` (폭 150px~180px, 0%~100%, 기본 50%, 흰 배경 내 100% 안착)
    6. **독립상점 비율 인라인 미니 슬라이더 🏪**: `inline-micro-slider` (폭 150px~180px, 0%~100%, 기본 50%, 흰 배경 내 100% 안착)

- **Layer 3 (Naver Map CustomOverlay Markers)**: 블러 도넛 마커 (`map-hotspot-marker`)
  - 네이버지도 `CustomOverlay` 클래스 연동
  - `total_walk_score` 점수에 따라 마커 크기(24px ~ 48px) 및 핫핑크 블러 반경(10px ~ 20px) 실시간 동적 확장
  - 중심부 색상: `{colors.map-donut-blur}` (`rgba(255, 20, 147, 0.85)`) 및 점수 수치 라벨 동시 표시

---

### 3. 컴포넌트 및 토큰 매핑 규칙 (Component & Token Mapping Rules)

- **내비게이션 바 (`primary-nav`)**:
 `backgroundColor: #ffffff`, `height: 64px`, `borderBottom: 1px solid #e5e5e0`, 우측 40px 원형 사람 프로필 버튼(`user-profile-avatar`) 매핑.

- **한 줄 조건 필터바 (`floating-filter-bar`)**:
 `backgroundColor: #ffffff`, `borderRadius: 9999px`, `min-width: 960px`, `padding: 8px 24px`

- **필터 칩 상태 분기 (`filter-chip`)**:
  - `Inactive` (기본): 배경 `{colors.surface-card}` (`#f7f7f3`), 텍스트 `{colors.ink}` (`#111111`), 폰트 `{typography.body-sm}`
  - `Active` (선택됨): 배경 `{colors.ink}` (`#111111`), 텍스트 `{colors.canvas}` (`#ffffff`)
  - `borderRadius`: `{rounded.full}` (`9999px`)

- **인라인 미니 슬라이더 (`inline-micro-slider`)**:
 트랙 `#a1a19a` -> 채움 `#ff1493`, 150px~180px 폭으로 흰색 알약 배경 안쪽에 안정적으로 수용.

- **블러 도넛 마커 (`map-hotspot-marker`)**:
 네이버지도 CustomOverlay HTML 연동, `#ff1493` 핫핑크 블러 효과.

---

### 4. UI 레이아웃 구조도 (ASCII Layout)

```
+-----------------------------------------------------------------------------------------+
| [Local Hip Logo]                                              [로그인] [시작] [마이페이지(👤 사람 아이콘)] | -> primary-nav (64px, Course 화면과 통일)
+-----------------------------------------------------------------------------------------+
|                                                                                         |
| +-------------------------------------------------------------------------------------+ |
| | (O)프랜차이즈제외 | [카페v] [소품샵v] | 보행쾌적도 [===o===] 50% | 독립상점 [===o===] 50% | | -> floating-filter-bar (min-width: 960px)
| +-------------------------------------------------------------------------------------+ |    (슬라이더가 흰 알약 배경 안쪽에 100% 수용됨)
|                               (overflow-x: auto 가로 스크롤)                            |
|                                                                                         |
|                        ( Blur Donut CustomOverlay Marker )                              |
|                          total_walk_score: 92.5 pt                                      | -> Naver Map CustomOverlay
|                          (네온 핫핑크 블러 번짐 효과)                                   |
|                                                                                         |
|                                                                   +-----------------+   |
|                                                                   | 보행 힙지수 범례 |   | -> Naver Map Legend
|                                                                   +-----------------+   |
+-----------------------------------------------------------------------------------------+
```

---

### 5. 동적 인터랙션 및 예외 처리 (Interaction & Exception Rules)

1. **실시간 필터 리렌더링**:
   * 유저가 가중치 인라인 슬라이더를 드래그하거나 업종 칩을 선택하는 즉시 `POST /api/v1/walk-score/calculate` API 호출.
   * **1초 이내**에 네이버지도 위 `CustomOverlay` 블러 도넛 마커의 크기와 블러 반경, 점수 수치가 부드러운 애니메이션과 함께 동적으로 업데이트됨.
2. **마커 클릭 이벤트**:
   * 특정 블러 도넛 마커 클릭 시 해당 구역 ID(`zone_id`) 추출 후 `SCR-02` (골목 상세 화면)로 전환되며 하단 3초 요약 카드가 슬라이드 업됨.
3. **Null 값 데이터 방어**:
   * 백엔드에서 Null 또는 0점이 반환되는 신생 골목이라도 레이아웃이 깨지지 않으며, 디폴트 평균 수치를 대입하고 웜 크림 면(`surface-card`)으로 자리를 유지함.
