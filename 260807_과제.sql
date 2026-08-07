--- 1. 쇼핑몰 서비스 database 및 회원, 상품 테이블 생성과 구조 변경

-- shopping_db 데이터베이스를 생성한 후, 회원 정보를 담을 users 테이블과 상품 정보를 담을 products 테이블을 생성하세요.

-- 또한 요구사항에 맞춰 컬럼을 추가해 보세요.

-- [요구사항]

-- shopping_db 데이터베이스를 생성하고 활성화(USE)하세요.

CREATE DATABASE IF NOT EXISTS shopping_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON shopping_db.* TO 'analyst'@'localhost';

USE shopping_db;

-- users 테이블 생성:

-- user_id: 정수형(INT), 기본키(PRIMARY KEY), 자동 증가(AUTO_INCREMENT)
-- username: 문자열(50자), 필수 입력(NOT NULL)
-- email: 문자열(100자), 필수 입력(NOT NULL), 중복 불가(UNIQUE)
-- created_at: 날짜시간형(DATETIME), 기본값 현재시간(DEFAULT CURRENT_TIMESTAMP)

-- products 테이블 생성:

-- product_id: 정수형(INT), 기본키(PRIMARY KEY), 자동 증가(AUTO_INCREMENT)
-- product_name: 문자열(100자), 필수 입력(NOT NULL)
-- price: 정수형(INT), 필수 입력(NOT NULL), 기본값 0
-- stock_quantity: 정수형(INT), 필수 입력(NOT NULL), 기본값 0

CREATE TABLE tb_users (
    user_id INT AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

CREATE TABLE tb_products (
    product_id INT AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    price INT NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    PRIMARY KEY(product_id)
);


-- users 테이블에 회원 전화번호를 저장할 phone (문자열 20자, NULL 허용) 컬럼을 추가(ALTER TABLE)하세요.

ALTER TABLE tb_users ADD phone VARCHAR(20);


--- 2. 쇼핑몰 초기 테스트 데이터 등록, 수정 및 삭제

-- 1에서 생성한 users 및 products 테이블에 초기 테스트 데이터를 삽입하고, 데이터 수정 및 삭제 작업을 수행하세요.

-- [요구사항]

-- users 테이블에 최소 3명 이상의 회원 데이터를 INSERT 구문으로 삽입하세요.

-- 회원데이터
user_id: 1 username: 홍길동, email: gildong@gmail.com, phone: 010-1234-5679
user_id: 2 username: 이연걸, email: yeongeol@gmail.com, phone: 010-4321-5678
user_id: 3 username: 이몽룡, email: mongryong@gmail.com, phone: 010-1234-8865
user_id: 4 username: 성철수, email: chulsoo@test.com, phone: 010-1212-8865

INSERT INTO tb_users(user_id, username, email, phone)
    values(1, '홍길동', 'gildong@gmail.com', '010-1234-5679'),
        (2, '이연걸', 'yeongeol@gmail.com', '010-4321-5678'),
        (3, '이몽룡', 'mongryong@gmail.com', '010-1234-8865'),
        (4, '성철수', 'chulsoo@test.com', '010-1212-8865');


-- products 테이블에 최소 4개 이상의 상품 데이터를 단일 또는 다중 INSERT문으로 삽입하세요. (예: 무선 마우스/25000원/50개, 기계식 키보드/89000원/30개, 4K 모니터/350000원/10개, USB 허브/15000원/100개)

-- 상품데이터
product_id: 11 product_name: 젤리, price: 1200 ,stock_quantity: 50
product_id: 22 product_name: 초콜릿, price: 3000, stock_quantity: 70
product_id: 33 product_name: 쿠키, price: 2400, stock_quantity: 30
product_id: 44 product_name: 과자, price: 1800, stock_quantity: 40

INSERT INTO tb_products(product_id, product_name, price, stock_quantity)
    values(11, '젤리', 1200, 50),
        (22, '초콜릿', 3000, 70),
        (33, '쿠키', 2400, 30),
        (44, '과자', 1800, 40);

-- 'chulsoo@test.com' 회원의 전화번호(phone)를 '010-1234-5678'로 수정(UPDATE)하세요.

select phone
from tb_users
where email = 'chulsoo@test.com';

UPDATE tb_users set phone = '010-1234-5678' where email = 'chulsoo@test.com';

-- 잘못 등록된 특정 상품(예: USB 허브)을 삭제(DELETE)하세요.

DELETE FROM tb_products WHERE product_name = '젤리';




--- 3. DISTINCT, ORDER BY, LIMIT을 활용한 기초 SELECT 쿼리 작성

-- 등록된 products 및 users 테이블에서 중복 제거, 정렬, 조회 개수 제한을 수행하는 SELECT SQL 문을 작성하세요.

-- [요구사항]

-- products 테이블에서 중복을 제거한 고유한 상품 재고 수량(stock_quantity) 목록을 조회하세요.
-- tb_products

select distinct stock_quantity from tb_products;


-- products 테이블의 모든 상품을 가격(price)이 비싼 순서(내림차순)로 상품 이름과 가격을 조회하세요.
select * from tb_products limit 2;

select product_name, price
from tb_products
order by price DESC;


-- users 테이블에서 회원 번호(user_id)가 가장 큰(최근 등록된) 회원부터 순서대로 상위 2명의 회원 정보를 조회하세요.

select *
from tb_users
order by user_id DESC
limit 2;