import streamlit as st
import pandas as pd

# 데이터 불러오기
@st.cache_data
def load_data():
    df = pd.read_csv('cars.csv')
    return df

df = load_data()

# 대시보드 제목 및 서브타이틀 설정
st.title("자동차 데이터")
st.markdown("<span style='color: #4CAF50; font-weight: bold; font-size: 1.25rem;'>자동차 데이터 테이블</span>", unsafe_allow_html=True)

# 제조사 선택 (중복 제거 후 리스트 생성)
manufacturers = df['Manufacturer'].unique().tolist()
selected_manufacturer = st.selectbox("제조사 선택", manufacturers)

# 정렬할 컬럼 선택
columns = df.columns.tolist()
selected_column = st.selectbox("정렬할 컬럼 선택", columns)

# 정렬 순서 선택 (라디오 버튼)
sort_order = st.radio("정렬 순서 선택", ["오름차순", "내림차순"])
is_ascending = True if sort_order == "오름차순" else False

# 데이터 필터링 및 정렬 처리
# 사용자가 선택한 제조사 데이터만 필터링
filtered_df = df[df['Manufacturer'] == selected_manufacturer]

# 사용자가 선택한 컬럼과 순서로 정렬
filtered_df = filtered_df.sort_values(by=selected_column, ascending=is_ascending)

# 5. 최종 데이터 테이블 출력
st.dataframe(filtered_df)
