# BUTTON.md (버튼 & 필터 디자인 시스템 명세서 - 전체 완전본)

## [Component] Button, Chip & Slider System Specification (v2.1 전체 완전본)

---

### 1. 버튼 계층 구조 및 용도 (Button Hierarchy)

서비스 내에서 액션의 중요도와 위계에 따라 버튼 및 조작 컴포넌트의 역할을 엄격히 구분하여 사용합니다.

* **Primary Button (메인 CTA)**: 화면 내에서 가장 중요한 단 하나의 핵심 전환 행동에만 사용합니다.
  * `backgroundColor`: `#ff1493` (네온 핫핑크)
  * `textColor`: `#ffffff`
  * `borderRadius`: `16px` (`{rounded.md}`)
  * `height`: `44px` (모바일 minimum 44px 터치 타겟)
  * 용도: SCR-01 "시작하기", SCR-02 "이 골목 탐방 코스 추천받기", SCR-03 "도보 길안내 시작"
* **Secondary Button (서브 액션)**: 주요 CTA를 보조하거나, 외부 연동 및 부가 기능을 실행할 때 사용합니다.
  * `backgroundColor`: `#f7f7f3` (웜 크림)
  * `border`: `1px solid #e5e5e0`
  * `textColor`: `#111111`
  * `borderRadius`: `16px` (`{rounded.md}`)
  * 예: `SCR-01` 내비게이션의 "로그인", `SCR-03` 하단의 "카카오톡 공유하기"
* **Filter Chip (인터랙티브 칩)**: 지도 위 필터 조건이나 업종 멀티 선택을 담당하는 경량형 인라인 컴포넌트입니다.
  * 예: `SCR-01` 필터바의 "감성 카페", "이색 소품샵", "독립 서점" 칩
* **Inline Micro Slider (인라인 미니 슬라이더)**: 한 줄(Single Line) 필터바 내부에 슬림하게 탑재되는 가중치 조절 슬라이더입니다.
  * 예: `SCR-01` 필터바의 "보행 쾌적도 🏃", "독립상점 비율 🏪" 인라인 슬라이더

---

### 2. 디자인 토큰 사양 (Visual Specs / Design Tokens)

`BASE.md`의 디자인 헌법 토큰을 엄격하게 참조하여 구성합니다.

#### Primary Button 토큰
- **Background**: `{colors.primary}` (`#ff1493` 네온 핫핑크)
- **Text Color**: `{colors.canvas}` (`#ffffff` 순백색)
- **Typography**: `{typography.body-sm-strong}` (14px, Bold, `lineHeight: 1`)
- **Border Radius**: `{rounded.md}` (16px, Pinterest 시그니처 둥글기 준수)
- **Height & Padding**: Height 44px (모바일 터치 타겟 최소 규격), Padding 12px 20px

#### Secondary Button 토큰
- **Background**: `{colors.surface-card}` (`#f7f7f3` 웜 크림 톤)
- **Border**: `1px solid {colors.hairline}` (`#e5e5e0`)
- **Text Color**: `{colors.ink}` (`#111111`)
- **Border Radius**: `{rounded.md}` (16px)
- **Height & Padding**: Height 44px, Padding 12px 20px

#### User Profile Avatar Button 토큰 ('사람 아이콘 / 마이페이지' 버튼 - 공통 상단바 통일)
  * **width**: `40px`, **height**: `40px`
  * **backgroundColor**: `#f7f7f3` (`{colors.surface-card}`)
  * **border**: `1px solid #e5e5e0` (`{colors.hairline}`)
  * **borderRadius**: `9999px` (`{rounded.full}`)
  * **display**: `flex`, **align-items**: `center`, **justify-content**: `center`
  * 내부에 `#111111` 컬러의 20px 사람 SVG 프로필 아이콘 삽입
  * 용도: 모든 화면(SCR-01, SCR-02, SCR-03) 최상단 내비게이션 바 우측 마이페이지/프로필 아이콘

#### Filter Chip 토큰
- **Inactive (기본)**: `backgroundColor: #f7f7f3`, `textColor: #111111`
  * `borderRadius`: `9999px` (`{rounded.full}`)
- **Active (선택됨)**: `backgroundColor: #111111`, `textColor: #ffffff`
- **Border Radius**: `{rounded.full}` (9999px 알약 형태)
- **Height & Padding**: Height 36px, Padding 6px 14px

#### Inline Micro Slider (한 줄 필터바 전용 인라인 미니 슬라이더) 토큰
- **Frame Width**: `140px ~ 160px` (`flex-shrink: 0`)
- **Track**: Background `#e5e5e0` (Height 4px, `borderRadius: 9999px`)
- **Filled Track**: Background `#ff1493` (Height 4px)
- **Thumb (Handle)**: Width 16px, Height 16px, Background `#ffffff`, Border `2px solid #ff1493`, `borderRadius: 9999px`, Shadow `0px 2px 4px rgba(0,0,0,0.15)`
- **Label & Value Badge**: Text 12px (`caption-md`), Label `{colors.ink}`, Value `{colors.primary}` (예: "보행 50%")

---

### 3. 인터랙션 상태별 변화 (Interaction States)

* **Hover (마우스 오버)**:
  * Primary: 다크 오버레이 적용 (`{colors.primary-pressed}` `#cc1075`)
  * Secondary / Filter Chip: 배경색을 `{colors.surface-pressed}` (`#e6e6df`)로 변경
* **Active / Pressed (클릭 및 터치 유지)**:
  * 공통: 물리적 터치 피드백을 위해 `scale(0.98)` 축소 애니메이션 적용
* **Loading State (로딩 중)**:
  * API 호출 및 코스 생성 대기 중에는 내부 텍스트를 숨기고 미니 스피너(Spinner) 또는 "생성 중..." 문구 출력
  * Background 유지, `cursor: wait`, `pointer-events: none` 처리
* **Disabled (비활성화)**:
  * Background: `{colors.surface-card}` (`#f7f7f3`), Text Color: `{colors.mute}` (`#72726b`), `cursor: not-allowed`
* **Focus Ring (포커스 링)**:
  * 키보드 접근성 준수를 위해 포커스 시 `{colors.focus-outer}` (`#435ee5` 블루링) + `{colors.focus-inner}` (`#ffffff` 화이트 갭) 섀도우 노출

---

### 4. 반응형 및 터치 타겟 규격 (Responsive & Touch Targets)

* **모바일 터치 타겟 최소 규격**: 모바일(768px 이하) 조작 편의성을 위해 **최소 높이 44px 이상**의 터치 영역을 보장합니다.
* **컴포넌트별 치수 매핑**:
  * Primary CTA (대형): Height 44px ~ 52px, Padding 12px 20px
  * Secondary Button (중형): Height 44px, Padding 12px 20px
  * Filter Chip (소형): Height 36px, Padding 6px 14px
  * Inline Micro Slider: Touch Area Height 44px (시각적 트랙 높이는 4px), Handle Size 16px

---

### 5. 확장된 플로팅 알약 필터바 (`floating-filter-bar`) 규격

* `height`: `56px`
* `min-width`: `960px` ~ `1080px` (컨테이너 여유 길이 확장)
* `padding`: `8px 24px`
* `backgroundColor`: `#ffffff`
* `borderRadius`: `9999px` (알약 형태)
* `shadow`: `"0px 4px 16px rgba(0,0,0,0.06)"`
* `display`: `flex`, `flex-wrap`: `nowrap`, `align-items`: `center`, `gap`: `16px`, `overflow-x`: `auto`

---

### 6. 인라인 미니 슬라이더 (`inline-micro-slider`) 규격

* `min-width`: `150px` ~ `180px`
* `height`: `32px`
* `display`: `inline-flex`, `align-items`: `center`, `gap`: `8px`
* 트랙: 배경 `#a1a19a` (Ash Gray, 두께 4px) -> 활성 트랙 `#ff1493` (네온 핫핑크)
* 썸(Thumb): `16px` 원형 `#ffffff`, 테두리 `2px solid #ff1493`
* 백그라운드 안착: 확장된 `floating-filter-bar` 흰색 배경 안쪽에 슬라이더 전체가 100% 여유롭게 수용되어 밖으로 튀어나오거나 깨지는 현상을 방지함.

---

### 7. 아이콘 및 레이아웃 결합 규칙 (Icon & Spacing Guidelines)

* **Leading / Trailing Icon**: 버튼 내부에 아이콘(예: 카카오톡 심볼, 화살표 등)이 결합되는 경우, 텍스트와 아이콘 사이의 간격(gap)은 **8px(`{spacing.sm}`)**로 고정합니다.
* **아이콘 사이즈**: 버튼 내부 아이콘은 고정 크기 16px x 16px를 준수하며 수직 중앙 정렬합니다.

---

### 8. 코드 스니펫 (Code Snippet - React / Tailwind)

```tsx
import React from 'react';

// 1. Primary Button 컴포넌트
export const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled, 
  loading 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  loading?: boolean; 
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="h-[44px] sm:h-[52px] px-6 rounded-[16px] bg-[var(--colors-primary)] text-[var(--colors-canvas)] font-bold text-sm sm:text-base transition-transform active:scale-[0.98] disabled:bg-[var(--colors-surface-card)] disabled:text-[var(--colors-mute)] disabled:cursor-not-allowed shadow-sm focus:ring-2 focus:ring-[var(--colors-focus-outer)] flex items-center justify-center gap-2 flex-shrink-0"
  >
    {loading ? (
      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
    ) : (
      children
    )}
  </button>
);

// 2. Filter Chip 컴포넌트
export const FilterChip = ({ 
  label, 
  active, 
  onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void; 
}) => (
  <button
    onClick={onClick}
    className={`h-[36px] px-3.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center flex-shrink-0 ${
      active 
        ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)]' 
        : 'bg-[var(--colors-surface-card)] text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)]'
    }`}
  >
    {label}
  </button>
);

// 3. Inline Micro Slider 컴포넌트 (한 줄 필터바 전용)
export const InlineMicroSlider = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) => (
  <div className="flex items-center gap-2 w-[150px] flex-shrink-0 bg-[var(--colors-surface-card)] px-3 py-1.5 rounded-full border border-[var(--colors-hairline)]">
    <span className="text-xs font-medium text-[var(--colors-ink)] whitespace-nowrap">{label}</span>
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-[var(--colors-ash)] rounded-lg appearance-none cursor-pointer accent-[#ff1493]"
    />
    <span className="text-xs font-bold text-[var(--colors-primary)] w-[32px] text-right">{value}%</span>
  </div>
);
```
