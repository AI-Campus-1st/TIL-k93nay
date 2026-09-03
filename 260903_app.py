import streamlit as st
import pandas as pd
import time

# if 'counter' not in st.session_state:
#    st.session_state['counter'] = 0

#if st.button('Increment'):
#    st.session_state['counter'] += 1

#if st.button('초기화'):
#    st.session_state['counter'] = 0

##st.write(f"Counter: {st.session_state['counter']}")

### rerun 적용을 위해 나중에 작성
#st.write('상태 관리를 적용했습니다.')


start_time = time.time()

# 주석 처리
@st.cache_data
def load_data(v):                             ## 파라미터 설정할 수 있음. 새로 설정할떄마다 캐시 새로 생성
    return pd.read_csv('2019-Oct-small.csv')

v = st.number_input('파라미터 입력 - 캐시 꺠짐', 0, 100)  ## 파라미터가 바뀌는 것. 소요시간 길어짐
st.slider('볼륨', 0, 10, step=1)  ## 파라미터가 아니므로, 소요시간 적음
st.text_input('아이디')

data = load_data(v)
st.write(data.head())

end_time = time.time()

# 캐싱 전, 캐싱 후 소요 시간 비교
st.write(f'load 소요 시간 = {end_time - start_time}')

# 캐싱 후 위젯 추가
st.write('캐시 적용한 뒤 값 넣기')

## 파라미터가 변경되지 않는 한 다시 계산되지 않음
## 용량이 큰 데이터는 대시보드에 올리지 않는게 좋음

import streamlit as st
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData
import pandas as pd
from faker import Faker

# SQLite 데이터베이스 연결
engine = create_engine('sqlite:///users.db')
metadata = MetaData()

# 테이블 정의
users_table = Table('users', metadata,
                    Column('id', Integer, primary_key=True),
                    Column('name', String),
                    Column('email', String),
                    Column('address', String))

# 테이블 생성
metadata.create_all(engine)

# Faker를 사용하여 가짜 데이터 생성
fake = Faker()

def generate_fake_data(n=10):
    with engine.connect() as conn:
        # 기존 데이터 삭제 
        # ORM - Object Relational Mapping
        conn.execute(users_table.delete())
        # 가짜 데이터 삽입
        for _ in range(n):
            conn.execute(users_table.insert().values(
                name=fake.name(),
                email=fake.email(),
                address=fake.address()
            ))
        conn.commit()

# 가짜 데이터 생성 버튼
if st.button('Generate Fake Data'):
    generate_fake_data(20)
    st.success('Fake data generated!')

# 데이터 조회
@st.cache_data
def load_data():
    with engine.connect() as conn:
        query = "SELECT * FROM users"
        return pd.read_sql(query, conn)

# 데이터 로드 및 표시
data = load_data()
st.write(data)
