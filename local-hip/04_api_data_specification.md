# [Data/API] 데이터 아키텍처 및 기술 스택 명세서

## 1. 기술 스택 매트릭스 (Tech Stack)

| 레이어 | 기술 및 데이터 소스 | 상세 역할 |
| :--- | :--- | :--- |
| **Data Sources** | • 서울시 보행우선도로 / 보행자전용도로 GIS 공간 데이터<br>• 소상공인진흥공단 업종별 상권 데이터<br>• Kakao / Naver Place Web API | • 골목 단위 차량 통행 차단 및 인도 확보 여부 파싱<br>• 프랜차이즈 제외 처리 및 소규모 독립 카페, 소품샵 분류<br>• 1030 유저 리뷰 키워드 파싱 및 감성 점수 보정 |
| **Spatial DB & Engine** | • PostgreSQL + PostGIS<br>• Python (GeoPandas, NetworkX) | • 도로명 주소 기반 골목 폴리곤 생성 및 공간 조인<br>• 골목 내 상점들을 연결하는 최적 보행 탐방 동선 알고리즘 연산 |
| **Backend API** | • Python + FastAPI | • 프론트엔드 필터(토글, 체크박스, 슬라이더) 수신 후 가중치를 적용한 Walk Score 계산 및 실시간 마커 속성값 반환 API |
| **Frontend / UI** | • React (Next.js)<br>• Mapbox GL JS<br>• Tailwind CSS | • **'블러 도넛' 형태의 커스텀 Marker Layer** 고속 동적 렌더링 및 코스 라인(LineString)의 맵 오버레이 기술 구현<br>• 모바일 환경에 최적화된 하단 슬라이딩 업 요약 카드 및 공유 UI |

---

## 2. 백엔드 REST API 인터페이스 명세 (동적 필터바 대응)

### Endpoint: `POST /api/v1/walk-score/calculate`
*   **Description:** 사용자가 조건 필터바(대형 프랜차이즈 제외 토글, 선호 업종 체크박스, 보행 쾌적도 가중치 슬라이더, 독립상점 밀집비율 슬라이더)를 조작할 때 호출되는 실시간 재연산 API입니다. 데이터가 유실되거나 공공 코드와 일치하지 않는 트렌드 업종이 입력되어도 서버 다운(500 Error)을 방지하는 안전장치가 포함되어 있습니다.

*   **Request Body (JSON):**
```json
{
  "exclude_franchise": true,
  "selected_categories": [
    "cafe",           // 독립형 감성 카페
    "prop_shop",     // 이색 소품샵
    "book_store",    // 독립 서점
    "popup_space",   // 상시 로테이션 팝업 공간 (공공 데이터 외 네이버/카카오 키워드 보정 업종)
    "vintage_shop",  // 빈티지/구제 의류 및 편집숍 (소상공인 코드 G47416 기반)
    "photo_studio",  // 아날로그/셀프 사진관 및 현상소 (소상공인 코드 M73300 기반)
    "dessert_bar",   // 콘셉트 중심 디저트/뮤직 바
    "perfume_studio",// 조향/인센스 체험형 공방
    "wine_snack"     // 내추럴 와인/식료품 그로서리 숍
  ],
  "weight_walk_comfort": 0.8,
  "weight_store_density": 0.6
}
```

*   **Response Body (JSON):**
```json
{
  "status": "success",
  "data": [
    {
      "spatial_id": "GEO_SEOUL_0032",
      "alley_name": "문래창작촌 뒷골목",
      "total_walk_score": 92.5,
      "marker_attributes": {
        "size_pixels": 45,
        "color_rgba": "rgba(255, 20, 147, 0.85)",
        "blur_radius_pixels": 15
      },
      "detected_categories": [
        "wine_snack",
        "vintage_shop",
        "popup_space"
      ],
      "geometry": {
        "type": "Point",
        "coordinates": [126.891234, 37.512345]  // 블러 도넛 마커를 배치할 골목의 중심점 좌표 [경도, 위도]
      },
      "polygon_geometry_fallback_link": "/api/v1/walk-score/polygon/GEO_SEOUL_0032" // 마커 터치 시 네온 외곽선(Polygon)을 렌더링하기 위한 동적 상세 API 경로
    }
  ]
}
```

### 데이터 매칭 및 에러 예방 방침 (Exception Handling)
1. **Fallback 데이터 매핑:** 1030 트렌드 업종 중 공공 데이터 표준산업분류코드에 명확히 정의되지 않은 항목(`popup_space`, `wine_snack` 등)이 `selected_categories` 배열로 요청될 경우, 백엔드 엔진은 에러를 내지 않고 데이터베이스 내의 `general_independent_store(일반 독립 점포)` 혹은 상위 대분류 풀(Pool)로 안전하게 우회(Fallback)하여 가산점을 연산함.
2. **플레이스 키워드 필터 스크리닝:** 공공 데이터상 '부동산 임대업', '주류 소매업' 등으로 모호하게 분류되어 누락 위험이 큰 점포들은 백엔드 전처리 파이프라인에서 Kakao/Naver Place API의 상호명 텍스트 및 태그 데이터를 크롤링/조회하여 "와인 그로서리", "빈티지", "팝업" 키워드가 매칭될 경우 응답 데이터의 `detected_categories`에 동적으로 재할당함.
3. **Null 값 방어:** 특정 골목 내부 데이터가 통계상 0이거나 누락(Null)된 경우, 연산 오류를 방지하기 위해 기본값(`0` 또는 보행 친화도 평균 수치)으로 치환하는 안정화 로직을 백엔드 비즈니스 로직에 포함함.

---

## 3. 데이터 흐름 및 지수 산출 개념
*   **실시간 마커 동적 반영:** 사용자가 필터바를 움직이면 백엔드에서 위 수식 데이터에 맞춰 `total_walk_score`를 재산출하고, 점수에 비례하는 **마커의 크기(size_pixels)**와 **색상 투명도 및 블러 반경(blur_radius_pixels)** 속성을 계산하여 프론트엔드로 즉시 스트리밍합니다. Mapbox GL JS는 수신된 속성값을 기반으로 '블러 도넛' 마커 레이어를 1초 이내에 리렌더링합니다.
