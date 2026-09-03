import streamlit as st
import pandas as pd
import time
import os
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData
from faker import Faker

# ==========================================
# 1. 파일 데이터 로드 파트
# ==========================================
start_time = time.time()

@st.cache_data
def load_csv_data(v):
    # 파일이 없을 경우를 대비한 예외 처리
    try:
        return pd.read_csv('2019-Oct-small.csv')
    except FileNotFoundError:
        # 배포 환경에 파일이 없을 경우 가짜 데이터프레임 반환
        return pd.DataFrame({"Notice": ["CSV 파일이 리포지토리에 없습니다."], "Value": [v]})

v = st.number_input('파라미터 입력 - 캐시 깨짐', 0, 100)
st.slider('볼륨', 0, 10, step=1)
st.text_input('아이디')

csv_data = load_csv_data(v)
st.write(csv_data.head())

end_time = time.time()
st.write(f'load 소요 시간 = {end_time - start_time}')
st.write('캐시 적용한 뒤 값 넣기')


# ==========================================
# 2. 데이터베이스 파트 (오류 수정 핵심)
# ==========================================

# [수정] 배포 환경의 권한 문제를 피하기 위해 가상 환경의 절대 경로 형태로 SQLite 경로를 지정합니다.
db_path = os.path.abspath('users.db')
engine = create_engine(f'sqlite:///{db_path}')
metadata = MetaData()

users_table = Table('users', metadata,
                    Column('id', Integer, primary_key=True),
                    Column('name', String),
                    Column('email', String),
                    Column('address', String))

metadata.create_all(engine)
fake = Faker()

def generate_fake_data(n=10):
    with engine.connect() as conn:
        conn.execute(users_table.delete())
        for _ in range(n):
            conn.execute(users_table.insert().values(
                name=fake.name(),
                email=fake.email(),
                address=fake.address()
            ))
        conn.commit()

# [수정] 데이터 로드 함수명을 위쪽 CSV 로드 함수와 겹치지 않게 변경합니다.
@st.cache_data
def load_db_data():
    with engine.connect() as conn:
        query = "SELECT * FROM users"
        return pd.read_sql(query, conn)

# 가짜 데이터 생성 버튼
if st.button('Generate Fake Data'):
    generate_fake_data(20)
    # [수정] DB 데이터가 바뀌었으므로 캐시를 지워 새로고침되도록 만듭니다.
    st.cache_data.clear() 
    st.success('Fake data generated!')
    st.rerun()  # 화면을 즉시 새로고침하여 바뀐 데이터를 보여줍니다.

# 데이터 로드 및 표시
db_data = load_db_data()
st.write(db_data)
