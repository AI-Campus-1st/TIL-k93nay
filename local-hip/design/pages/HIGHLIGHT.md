# HIGHLIGHT.md (골목 상세 및 요약 카드 화면 명세서 - 전체 완전본 v2.2)

## [Page] SCR-02: 골목 상세 및 요약 카드 화면 명세서

---

### 1. 화면 개요 및 목적
* **화면 ID**: SCR-02
* **화면명**: 골목 구역 하이라이트 & 3초 요약 팝업 카드
* **관련 시나리오**: 03. 결과
* **지도 엔진**: 네이버지도 API v3 (`naver.maps.Polygon`)
* **목적**: 지도 홈에서 가장 붉고 큰 핫스팟(예: 문래창작촌 뒷골목)을 터치했을 때, 공간 구역 경계를 네온 외곽선 다각형으로 하이라이팅하고 하단에서 슬라이딩 업 방식으로 핵심 요약 정보를 3초 만에 제공.

---

### 2. 레이아웃 구조 (Layered Specs)

- **Layer 0 (Naver Map Polygon Highlight)**: 선택된 골목 구역 바닥면 경계
  - `naver.maps.Polygon` 객체 연동
  - `strokeColor`: `"rgba(255, 20, 147, 0.9)"` (네온 핫핑크)
  - `strokeWeight`: `4` (두꺼운 실선)
  - `fillColor`: `"rgba(255, 20, 147, 0.15)"` (은은한 분홍색 면 채우기)

- **Layer 1 (Sticky-Top Navigation - Course 화면 기준 통일)**: 상단 내비게이션 바 (`primary-nav`, Height: 64px)
  - **Course(SCR-03) 화면과 동일한 세팅으로 전면 통일**:
  - 좌측: Local Hip 네온 로고 ("Local Hip" 텍스트 + `#ff1493` 포인트 닷)
  - 우측: **'사람 아이콘 / 마이페이지' 프로필 버튼 (`user-profile-avatar`, 40px 원형 `#f7f7f3` 패널 + SVG 사람 아이콘)** & 알림 종 아이콘 (`24px`)

- **Layer 2 (Sliding-Up Summary Card)**: 하단 슬라이딩 시트 (`sliding-up-summary-card`)
  - `backgroundColor: #ffffff`, `borderRadius: 32px 32px 0px 0px`, `padding: 32px 24px`, `shadow: "0px -8px 24px rgba(0, 0, 0, 0.08)"`
  - **Top Area**:
    - 좌측: 골목명 (`heading-lg`, 예: "문래창작촌 뒷골목") + 감성 해시태그 (`caption-md`, 예: `#차없는도로 #소품샵천국 #도보천국`)
    - 우측: 종합 보행 점수 스코어 배지 (`heading-xl`, `28px`, `#ff1493`, 예: `92.5`)
  - **Center Area (대표 독립 상점 TOP 3)**:
    - 가로 3열 격자 구조, `{rounded.md}`(16px) 반지름 미니 썸네일 카드
    - **풀블리드(Full-bleed) 규칙**: 이미지 내부에 패딩을 주지 않고 프레임에 꽉 차게 렌더링 후 하단에 상호명 캡션 및 평점/특징 배치 (예: 문래방구 ★4.9, 베르데 문래 ★4.8, 스튜디오 폰드 ★4.9)
  - **Bottom Area 1 (주변 유사 골목 비교분석 5축 레이더 차트 - 연한 회색조 색상 조정)**:
    - 컴포넌트: `RadarChart` (Recharts / SVG 기반)
    - 5개 평가 축: 인도 분리도, 프랜차이즈 역비율, 독립상점 다양성, 인스타 감성 지수, 안전 보행도
    - **이중 레이어 시각화 (색상 조합 개편)**:
      - **Target Zone (선택한 골목)**: `{colors.primary}` (`#ff1493`) 네온 핫핑크 외곽선 + `rgba(255, 20, 147, 0.3)` 면 채우기 (강력한 시각적 주도권)
      - **Comparison Zone (주변 유사 골목 - 성수/을지로)**: **Soft Muted Gray (`#d1d1ca`) 은은한 회색 점선 외곽선 + `rgba(229, 229, 224, 0.15)` (15% 미세 투명 면 채우기)** -> 기존의 검정/노랑 등 대비가 강한 색상을 전면 배제하여 선택 골목보다 훨씬 연하고 깔끔하게 시각 위계를 정리함.
  - **Bottom Area 2 (메인 CTA 버튼)**:
    - "이 골목 탐방 코스 추천받기" (`button-primary`, `#ff1493`, `height: 44px ~ 52px`)

---

### 3. 컴포넌트 및 토큰 매핑 규칙 (Component & Token Mapping Rules)

- **`primary-nav` (상단바 통일)**: `backgroundColor: #ffffff`, `height: 64px`, `borderBottom: 1px solid #e5e5e0`, 우측 40px 원형 사람 프로필 버튼(`user-profile-avatar`) 매핑.
- **`sliding-up-summary-card`**: `backgroundColor: #ffffff`, `borderRadius: 32px 32px 0px 0px`, `padding: 32px 24px`
- **`naver.maps.Polygon` (선택 골목)**: `strokeColor: rgba(255, 20, 147, 0.9)`, `fillColor: rgba(255, 20, 147, 0.15)`

- **골목 타이틀 (`heading-lg`)**: `fontSize: 22px`, `fontWeight: 600`, `lineHeight: 1.25`, `letterSpacing: -0.5px`, `color: {colors.ink}` (`#111111`)
- **종합 점수 배지 (`heading-xl`)**: `fontSize: 28px`, `fontWeight: 700`, `lineHeight: 1.2`, `letterSpacing: -1.0px`, `color: {colors.primary}` (`#ff1493`)
- **감성 키워드 태그 (`caption-md`)**: `fontSize: 12px`, `fontWeight: 500`, `color: {colors.mute}` (`#72726b`)
- **상점 미니 카드 반지름**: `{rounded.md}` (`16px` Pinterest 시그니처 반지름 엄격 준수)
- **카드 내부 여백**: 상하좌우 패딩 `32px 24px` 통일 (`{colors.canvas}` Pure White 배경)
- **네이버지도 다각형 하이라이트 (`Polygon`)**:
  - `strokeColor`: `rgba(255, 20, 147, 0.9)`
  - `strokeWeight`: `4px`
  - `fillColor`: `rgba(255, 20, 147, 0.15)`
- **비교 분석 레이더 차트 (`RadarChart`)**:
  * Target: `#ff1493` (핫핑크 실선 + 30% 채우기)
  * Comparison: `#d1d1ca` (Soft Muted Gray 점선 + 15% 은은한 회색 면 채우기)

---

### 4. UI 레이아웃 구조도 (ASCII Layout)

```
+-----------------------------------------------------------------------------------------+
| [Local Hip Logo]                                              [로그인] [시작하기] [마이페이지(👤 사람 아이콘)] | -> primary-nav (64px, Course 화면과 통일)
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|               /=========================================\                               |
|              /   # # # # # # # # # # # # # # # # # # #   \                              | -> Naver Map Polygon
|             (   # 문래창작촌 뒷골목 영역 하이라이트 #   )                             |    (rgba(255, 20, 147, 0.9) 외곽선)
|              \   # # # # # # # # # # # # # # # # # # #   /                              |
|               =========================================/                                |
|                                                                                         |
+=========================================================================================+
|  문래창작촌 뒷골목    [차없는 안심골목]                                      [ 92.5 ]   | -> heading-lg / 점수 배지
|  #차없는도로 #소품샵천국 #도보천국                                                      | -> caption-md (mute)
|                                                                                         |
|  [대표 독립 상점 TOP 3]                                                                 |
|  +-----------------------+ +-----------------------+ +-----------------------+          |
|  |       [이미지]        | |       [이미지]        | |       [이미지]        |          | -> 16px 미니 카드
|  | 문래방구 ★4.9         | | 베르데 문래 ★4.8    | | 스튜디오 폰드 ★4.9  |          |    (풀블리드 이미지)
|  +-----------------------+ +-----------------------+ +-----------------------+          |
|                                                                                         |
|  [주변 유사 골목(성수·을지로) 비교분석 RadarChart - Soft Muted Gray 회색조 연한 연출]    |
|  - 선택 골목: #ff1493 네온 핫핑크 (강조)                                                |
|  - 주변 골목: #d1d1ca Muted Gray 점선 & 15% 투명 회색 채우기 (연하게 연출)               |
|                                                                                         |
|  [ 이 골목 탐방 코스 추천받기 ]                                                         | -> button-primary (#ff1493)
+=========================================================================================+ -> sliding-up-summary-card (32px 둥글기)
```

---

### 5. 화면 전환 및 카메라 애니메이션 시퀀스 (Interaction & Exception Rules)

1. **슬라이딩 업 애니메이션**: 블러 도넛 마커 터치 시 0.3초 내에 하단 요약 카드가 위로 슬라이딩 업.
2. **카메라 줌인 시퀀스 (3단계)**:
   * 유저가 **"이 골목 탐방 코스 추천받기"** 버튼 탭.
   * `POST /api/v1/courses/generate` API 요청 전송 및 추천 경로 데이터 수령.
   * 네이버지도 카메라 애니메이션 실행: `map.morph(zoneCenterBounds, 17, { duration: 800 })` (800ms 동안 선택 골목 중심으로 부드럽게 줌인 및 마이크로 중심 이동).
   * `SCR-02` 하단 요약 카드가 슬라이드 다운되며 `SCR-03` 코스 추천 화면 패널로 전환.
3. **Fallback 카테고리 매핑**: 공공 데이터 분류 코드에 잡히지 않는 힙스터 트렌드 업종(`popup_space` 등)은 일반 독립 상점 아이콘 및 명칭으로 안전하게 우회하여 썸네일 카드를 생성함.
