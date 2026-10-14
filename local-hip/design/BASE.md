# BASE.md (로컬 힙 서비스 디자인 헌법 & 통합 토큰 명세서 - 전체 완전본)

## '로컬 힙(Local Hip)' 서비스 디자인 헌법 & 토큰 명세서 (v2.1 전체 완전본)

---

### 1. 서비스 개요 및 디자인 철학

본 시스템은 1030 세대 뚜벅이 유저들이 차 없이 걷기 좋은 서울의 '로컬 힙' 골목 상권을 직관적으로 탐색하고 즐길 수 있도록 지원하는 모바일/웹 공간 지도 서비스입니다. 

* **Pinterest의 'Photography-First' 철학 계승**: 복잡한 전통 지도 서비스의 시각적 파편화와 과도한 POI(관심지점) 라벨을 차단하고, 따뜻하고 차분한 **웜 크림(Warm-Cream)** 캔버스 바탕 위에 감성적인 **네온 핫핑크(#ff1493)**와 **네온 오렌지(#ff4500)**의 빛나는 스팟 레이어를 얹어 탐색 몰입도를 극대화합니다.
* **통합 컴포넌트 헌법**: 16px 반지름({rounded.md})의 유니버설 컴포넌트 시스템, 밀도 높게 압축된 자간의 타이포그래피, 그리고 지도 위에 플로팅되는 9999px({rounded.full}) 알약 형태의 단일 가로 행(Single Line) 동적 필터바가 서비스의 핵심 기둥을 이룹니다.

---

### 2. 브랜드 & 컬러 토큰 (Design Tokens)

#### Brand & Accent
* `primary`: `"#ff1493"`          # 네온 핫핑크 (가장 높은 핫스팟, 메인 CTA, 1순위 추천 코스 실선, 선택 골목 다각형)
* `primary-pressed`: `"#cc1075"`  # 딥 핫핑크 (메인 버튼 클릭/터치 유지 상태)
* `secondary-accent`: `"#ff4500"` # 네온 오렌지 (보통 이상~높은 보행 지수 마커 컬러)

#### Map Layer & Comparison Colors (네이버지도 API v3 연동 기준)
* `map-neon-outline`: `"rgba(255, 20, 147, 0.9)"`  # 선택한 골목 구역 다각형(Polygon) 네온 외곽선
* `map-donut-blur`: `"rgba(255, 20, 147, 0.85)"`    # 네이버지도 CustomOverlay 블러 도넛 마커 중심부
* `map-comparison-stroke`: `"#d1d1ca"`             # 주변 유사 골목(성수/을지로) Soft Muted Gray 점선 외곽선 (대비가 강한 검정/노랑 배지 전면 제거)
* `map-comparison-fill`: `"rgba(229, 229, 224, 0.15)"` # 주변 유사 골목 15% 미세 투명 면 채우기 (선택 골목 핫핑크 대비 연하고 은은하게 표현)
* `map-course-primary`: `"#ff1493"`                 # 1순위/선택 탐방 코스 (네이버지도 Polyline 5px 실선)
* `map-course-alternative`: `"#a1a19a"`             # 대안/기타 탐방 코스 (네이버지도 Polyline 3px 점선, strokeDasharray: "6, 6")

#### Typography & Ink
* `ink`: `"#111111"`              # 주 타이틀, 강조 텍스트, 메인 헤드라인
* `ink-soft`: `"#2c2a2b"`         # 요약 카드 내 상호명 및 본문 링크
* `body`: `"#444440"`             # 일반 설명 문구 및 데이터 지표 본문
* `mute`: `"#72726b"`             # 인스타 감성 키워드 태그, 미니 캡션, 푸터 텍스트
* `ash`: `"#a1a19a"`              # 비활성화 텍스트, 슬라이더 기본 바 배경, 대안 경로 점선

#### Chrome & Surfaces (Warm-Cream Neutral)
* `canvas`: `"#ffffff"`           # 순백색 (상단 내비게이션 바, 하단 슬라이딩 업 카드, 필터바 배경)
* `surface-soft`: `"#fcfcf9"`     # 페인트 크림 톤 (지도 홈 플로팅 패널 기본 배경)
* `surface-card`: `"#f7f7f3"`     # 웜 크림 톤 (조건 필터바 필드, 미니 썸네일 박스, 사람 아이콘 프로필 원형 배경)
* `surface-pressed`: `"#e6e6df"`  # 필터/버튼 클릭 및 터치 유지 상태
* `hairline`: `"#e5e5e0"`         # 1px 구분선 및 카드 내 경계선

---

### 3. 타이포그래피 & 자간 스케일

- **Font Family**: `Pin Sans, -apple-system, system-ui, BlinkMacSystemFont, Roboto, sans-serif`
- **Typography Scale Table**:

| Token | Size / Weight | Line Height / Spacing | Usage / Description |
| --- | --- | --- | --- |
| `display-xl` | 56px / Bold (700) | 1.1 / **-1.2px** | 웹/모바일 범용 최적화 헤드라인 |
| `heading-xl` | 28px / Bold (700) | 1.2 / **-1.0px** | 3초 요약 카드 내 종합 보행 점수 배지 |
| `heading-lg` | 22px / SemiBold (600) | 1.25 / **-0.5px** | 골목 구역 타이틀 ("문래창작촌 뒷골목") |
| `heading-md` | 18px / SemiBold (600) | 1.3 / 0px | 대표 독립 상점 이름, 핵심 그룹 타이틀 |
| `body-md` | 16px / Regular (400) | 1.4 / 0px | 필터바 스위치 라벨, 요약 설명 본문 |
| `body-strong` | 16px / SemiBold (600) | 1.4 / 0px | 가중치 설정 숫자 표시, 활성화 텍스트 |
| `body-sm` | 14px / Regular (400) | 1.4 / 0px | 독립 상점 업종 정보, 레이더 차트 축 라벨 |
| `body-sm-strong` | 14px / Bold (700) | 1.0 / 0px | "이 골목 탐방 코스 추천받기" 메인 CTA 라벨 |
| `caption-md` | 12px / Medium (500) | 1.5 / 0px | 인스타 감성 키워드 태그 (#차없는도로, #소품샵천국) |

---

### 4. 3-Radius 컴포넌트 시스템 & 여백 스케일

#### Radius Tokens
- `none` (`0px`): 내비게이션 바 바닥면, 지도 전체 캔버스 타일
- `sm` (`8px`): 레이더 차트 툴팁 내부 둥글기
- `md` (`16px`): **[Universal]** 기본 버튼, 입력창 필드, 상점 미니 썸네일 카드
- `lg` (`32px`): **[Highlight]** 하단 슬라이딩 업 요약 카드 상단 코너 둥글기 (`32px 32px 0px 0px`)
- `full` (`9999px`): **[Pill/Circle]** 조건 필터바 전체 프레임, 필터 칩, 슬라이더 핸들, 마커

#### Spacing Tokens
- `xxs`: `4px` | `xs`: `6px` | `sm`: `8px` (마커 간 간격, 썸네일 간 타이트한 Gutter)
- `md`: `12px` | `lg`: `16px` (카드 및 필터바 내부 패딩의 표준 단위)
- `xl`: `24px` | `xxl`: `32px` (요약 카드 내부 주요 섹션 여백) | `section`: `64px`

---

### 5. UI 컴포넌트 규격 및 기술 제약 사항

#### 지도 엔진 준수 사항 (필수)
* **네이버지도 JS API v3 (`Naver Maps JS API v3`) 전면 사용 필수**. (Mapbox 의존성 완전 폐기)
* 네이버지도의 `naver.maps.CustomOverlay`, `naver.maps.Polygon`, `naver.maps.Polyline` 클래스를 활용하여 고화질 한글 도로망 및 보행자 전용 도로 지도표현 구현.

#### `primary-nav` (상단 내비게이션 바)
* **레이아웃 스펙**: `height: 64px`, `backgroundColor: #ffffff`, `borderBottom: 1px solid #e5e5e0`, `padding: 0 24px`, `display: flex`, `justify-content: space-between`, `align-items: center`, `z-index: 1000`
* **좌측 영역**: Local Hip 네온 로고 (`"Local Hip"` 텍스트 + `#ff1493` 포인트 닷 배지)
* **우측 영역 (사용자 액션 그룹)**:
  * **'사람 아이콘 / 마이페이지' 프로필 버튼 (`user-profile-avatar`)**: `40px` 직경 원형 버튼, `backgroundColor: #f7f7f3`, `border: 1px solid #e5e5e0`, `borderRadius: 9999px` (`{rounded.full}`), 내부에 사용자 SVG 프로필 아이콘 안착
  * **알림 종 아이콘 (`notification-bell`)**: `24px` SVG 아이콘

#### `floating-filter-bar` (상단 알약 조건 필터바 - 한 줄 Single Line 배치)
* **형태 & 레이아웃**: `backgroundColor: #ffffff`, `borderRadius: 9999px` (알약 형태), `height: 56px`, `shadow: "0px 4px 16px rgba(0,0,0,0.06)"`
* **확장 및 안착 규칙**:
  * 기존 필터바 길이가 짧아 슬라이더가 흰 배경 밖으로 튀어나오던 현상을 해결하기 위해 **가로 컨테이너 길이를 확장 (`min-width: 960px` ~ `max-width: 1080px`, `padding: 8px 24px`)**합니다.
  * `display: flex`, `flex-direction: row`, `flex-wrap: nowrap` (`white-space: nowrap`), `align-items: center`, `gap: 16px`, `overflow-x: auto`
  * 내부에 포함된 **보행 쾌적도 및 독립상점 비율 인라인 미니 슬라이더(`inline-micro-slider`, 각각 150px~180px)**가 흰색 알약 배경 안쪽에 여유롭게 100% 안착되도록 보장합니다.
* **내부 요소 순서**:
  1. **[토글]**: '프랜차이즈 제외' 토글 스위치 (`flex-shrink: 0`)
  2. **[구분선]**: `1px solid #e5e5e0` (높이 24px)
  3. **[업종 칩]**: '선호 업종 멀티 칩' ('감성 카페', '이색 소품샵', '독립 서점', '빈티지 숍' 등)
  4. **[구분선]**: `1px solid #e5e5e0` (높이 24px)
  5. **[미니 슬라이더 1]**: '보행 쾌적도 🏃' 인라인 슬라이더 (`inline-micro-slider`, 폭 140px, 0~100%, 기본 50%)
  6. **[미니 슬라이더 2]**: '독립상점 비율 🏪' 인라인 슬라이더 (`inline-micro-slider`, 폭 140px, 0~100%, 기본 50%)

#### `map-hotspot-marker` (블러 도넛 마커)
* 네이버지도 `CustomOverlay` 연동
* `width`: `total_walk_score` 점수에 따라 24px ~ 48px 동적 확장
* `blurRadius`: 점수에 따라 10px ~ 20px 동적 연산 번짐 효과
* 중심 색상: `{colors.map-donut-blur}` (`rgba(255, 20, 147, 0.85)`)

#### `sliding-up-summary-card` (하단 3초 요약 팝업 카드)
* `backgroundColor: {colors.canvas}`, `borderRadius: 32px 32px 0px 0px`
* `padding: 32px 24px`, `shadow: "0px -8px 24px rgba(0, 0, 0, 0.08)"`
* **내부 구성**:
  * Left Top: 골목명 (`heading-lg`) + 감성 해시태그 (`caption-md`)
  * Right Top: 종합 보행 점수 배지 (`heading-xl`, `#ff1493`)
  * Center: 대표 독립 상점 TOP 3 미니 썸네일 그리드 (16px 미니 카드, 내부 여백 없는 **풀블리드 Full-bleed 이미지**)
  * Bottom: 주변 유사 골목 비교분석 5축 레이더 차트 (`RadarChart`) + "이 골목 탐방 코스 추천받기" 메인 CTA 버튼

#### `course-overlay-line` (탐방 경로 매핑)
* **1순위/선택 경로 (`map-course-primary`)**:
  * `naver.maps.Polyline`, `strokeColor: "#ff1493"`, `strokeStyle: "solid"` (실선), `strokeWeight: 5`, `strokeOpacity: 0.95`
* **대안/보조 경로 (`map-course-alternative`)**:
  * `naver.maps.Polyline`, `strokeColor: "#a1a19a"`, `strokeStyle: "dash"` (`strokeDasharray: "6, 6"`, 점선), `strokeWeight: 3`, `strokeOpacity: 0.65`
* **매핑 원칙**: 직결 직선 금지. 네이버지도 보행자 길찾기 API 연동 실제 보행로 노드 좌표 배열(`LineString`) 드로잉 필수.

#### `toast-notification` (토스트 알림)
* `backgroundColor: {colors.ink}`, `textColor: {colors.canvas}`, `borderRadius: {rounded.full}`, `padding: 12px 24px`
* 용도: "카카오톡 공유 링크가 복사되었습니다!" 토스트 메시지

---

### 6. Do's and Don'ts (디자인 실행 준수 사항)

#### Do
* **단일 액센트 유지**: 가장 중요한 보행 점수 배지와 최적 동선 추천 버튼에만 `{colors.primary}`(네온 핫핑크)를 부여하세요. 정보 탐색 필터 칩은 뉴트럴 톤으로 차분하게 눌러주어야 합니다.
* **16px 반지름 통일**: 지도 화면 내부의 버튼, 상점 리스트 썸네일 프레임은 예외 없이 `{rounded.md}`(16px)를 엄격히 지키세요.
* **풀블리드 이미지 배치**: 3초 요약 카드 내부에 들어가는 독립 상점의 대표 이미지는 카드 내부에 여백(Internal Padding) 없이 꽉 차게 렌더링하세요.
* **자간 압축 타이포그래피**: 점수 숫자와 대형 헤드라인 타이틀은 무조건 `letter-spacing: -1.2px` / `-1.0px` 밀도를 적용하세요.
* **한 줄 필터바 스크롤 보장**: 필터바는 반드시 `flex-wrap: nowrap` 및 `overflow-x: auto` 스펙을 적용하여 화면 폭이 좁아져도 한 줄 구조가 깨지지 않고 스크롤되도록 구현하세요.

#### Don't
* **화려한 그라데이션 금지**: UI 컴포넌트 자체에 인위적인 선형/방사형 CSS 그라데이션을 입히지 마세요.
* **일반 드롭 섀도우 오용 금지**: 플로팅 필터바와 하단 요약 카드 외의 일반 컴포넌트에 그림자를 넣지 마세요.
* **Null 값의 빈 공간 방치 금지**: 특정 데이터가 누락되더라도 `{colors.surface-card}` 크림색 면으로 자리를 채우고 디폴트 스크리닝 수치를 유지하세요.
* **경로 직결 직선 금지**: 지도 경로 매핑 시 상점 간 위치를 단순 직선으로 잇지 말고 실제 네이버지도 보행자 전용 도로망을 따라 꺾어지는 Polyline으로 그리세요.

---

### 7. 브레이크포인트 및 모바일 대응 전략

* **모바일 화면 중심 (Core Layout)**: 모바일 뷰(768px 이하)가 메인 캔버스입니다.
* **하단 슬라이딩 업 시트**: 데스크톱에서는 측면 고정 패널(Width 400px)로 렌더링되며, 모바일에서는 하단에서 올라오는 Bottom Sheet로 트랜지션됩니다.
* **한 줄 필터바 모바일 최적화**: 모바일 터치 환경에서 한 줄(Single Line) 필터바가 가로 스크롤(`overflow-x: auto`)되므로, 유저는 손가락으로 가볍게 스와이프하며 토글, 업종 칩, 인라인 슬라이더를 바로 조작할 수 있습니다.

---

### 8. 지도 엔진 및 비교 차트 시각 위계 규칙

* **지도 엔진 (필수)**: **네이버지도 (Naver Map API v3 / Web Dynamic Map)** 전면 적용.
* **주변 유사 골목 시각 위계 조정**:
  * 선택한 핫핑크(`#ff1493`) 골목 구역이 강력한 시각적 주도권을 가지도록, 주변 유사 골목(성수/을지로 등)은 기존의 검정/노랑 등 대비가 강한 색상을 전면 제거하고 **Soft Muted Gray (`#d1d1ca`) 은은한 회색 점선 및 15% 미세 투명 면 채우기 조합**으로 대비를 확실히 낮춰 연하고 깔끔하게 표현함.
