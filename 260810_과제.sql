다음의 요구사항을 만족시키는 SELECT query를 작성하시오.

[기본]
Q1. 서울에 사는 고객의 이름과 등급 조회

SELECT customer_name, grade
FROM tb_customer
WHERE city = '서울';

Q2. 이름이 '이'로 시작하는 고객 조회

SELECT *
FROM tb_customer
WHERE customer_name LIKE '이%';

Q3. 가격이 5,000~50,000원인 상품을 저렴한 순으로 조회

SELECT *
FROM tb_product
WHERE unit_price BETWEEN 5000 AND 50000
ORDER BY unit_price ASC;

Q4. 2024년 2분기(4~6월) 주문 건수 조회

SELECT MONTH(order_dt) AS m,
    COUNT(*) AS 주문건수
FROM tb_order
WHERE order_dt >= '2024-04-01'
    AND order_dt < '2024-07-01'
GROUP BY MONTH(order_dt);

Q5. 등급이 지정되지 않은 고객 조회

SELECT *
FROM tb_customer
WHERE grade IS NULL;

[집계]
Q6. 카테고리별 상품 수와 평균 가격 조회 (평균가 높은 순)

SELECT category_id, COUNT(*) AS 상품수, AVG(unit_price) AS 평균가격
FROM tb_product
GROUP BY category_id
ORDER BY 평균가격 DESC;

Q7. 고객 등급별 인원수와 비율(%) 조회

SELECT grade, COUNT(*), 
    COUNT(*) / (SELECT COUNT(customer_id) FROM tb_customer) * 100 AS 비율
FROM tb_customer
GROUP BY grade;

Q8. 월별 주문 건수 (취소 제외) 조회 ※ DATE_FORMAT('%Y-%m') 활용

SELECT DATE_FORMAT(order_dt,'%Y-%m') AS m,
    COUNT(*) AS cnt
FROM tb_order
WHERE status <> 'CANCELED'
GROUP BY m;

Q9. 상품 재고 총합이 100개 미만인 카테고리 조회

SELECT category_id
FROM tb_product
GROUP BY category_id
HAVING SUM(stock_qty) < 100;

Q10. 가장 비싼 상품과 가장 싼 상품의 가격 차이 조회

------ 최소 가격 ----- 
SELECT MAX(unit_price) - MIN(unit_price) AS 가격차이
FROM tb_product;

[조인]
Q11. 주문별 고객명 · 주문일 · 주문금액 합계 조회

SELECT c.customer_name, o.order_dt, SUM(oi.qty*oi.unit_price) AS 주문금액
FROM tb_order AS o
    JOIN tb_customer AS c ON o.customer_id=c.customer_id
    JOIN tb_order_item AS oi ON oi.order_id=o.order_id
GROUP BY o.order_id;

Q12. 한 번도 주문하지 않은 고객 조회

SELECT *
FROM tb_order AS o
    JOIN tb_customer AS c ON o.customer_id=c.customer_id
WHERE order_id IS NULL;


Q13. 한 번도 팔리지 않은 상품 조회

SELECT *
FROM tb_product AS p
    JOIN tb_order_item AS oi ON oi.product_id=p.product_id
WHERE order_id IS NULL;


Q14. 고객별 총 구매금액 TOP 5 조회 (취소 제외)

SELECT c.customer_name, SUM(oi.qty*oi.unit_price) AS 구매금액
FROM tb_order AS o
    JOIN tb_customer AS c ON o.customer_id=c.customer_id
    JOIN tb_order_item AS oi ON o.order_id=oi.order_id
WHERE o.status <> 'CANCELED' 
GROUP BY c.customer_id
ORDER BY 구매금액 DESC
LIMIT 5;

Q15. 국가별 · 카테고리별 매출 조회

SELECT c.country, p.category_id, SUM(oi.qty*oi.unit_price) AS 매출
FROM tb_order AS o
    JOIN tb_customer AS c ON o.customer_id=c.customer_id
    JOIN tb_order_item AS oi ON o.order_id=oi.order_id
    JOIN tb_product AS p ON oi.product_id=p.product_id
GROUP BY c.country, p.category_id                       
ORDER BY c.country ASC; 

[응용 — CASE 피벗]
Q16. 카테고리별 상품 수와, 상품 수가 3개 초과면 '많음' 아니면 '적음'으로 조회

SELECT category_id, COUNT(*) AS 상품수,
    CASE                                       
        WHEN COUNT(*) > 3 THEN '많음'
        ELSE '적음'
    END AS 수준
FROM tb_product
GROUP BY category_id;


Q17. 고객별 주문 건수를 0건 / 1~2건 / 3건 이상 구간으로 나눠 인원수 집계

CREATE OR REPLACE VIEW v_order_detail AS
SELECT c.customer_id, COUNT(*) AS 주문건수,
    CASE                                       
        WHEN COUNT(*) = 0 THEN '0건'
        WHEN COUNT(*) <= 2 THEN '1~2건'
        ELSE '3건이상'
    END AS 수준
FROM tb_customer AS c
    JOIN tb_order AS o ON o.customer_id=c.customer_id
GROUP BY c.customer_id;

SELECT 수준, COUNT(*)
FROM v_order_detail
GROUP BY 수준;

Q18. 연도×월 매트릭스로 월별 매출 출력 (열: 1월~12월)

SELECT YEAR(order_dt) AS yr,
    SUM(CASE WHEN MONTH(order_dt)=1 THEN oi.qty*oi.unit_price ELSE 0 END) AS m01,
    SUM(CASE WHEN MONTH(order_dt)=2 THEN oi.qty*oi.unit_price ELSE 0 END) AS m02,
    SUM(CASE WHEN MONTH(order_dt)=3 THEN oi.qty*oi.unit_price ELSE 0 END) AS m03,
    SUM(CASE WHEN MONTH(order_dt)=4 THEN oi.qty*oi.unit_price ELSE 0 END) AS m04,
    SUM(CASE WHEN MONTH(order_dt)=5 THEN oi.qty*oi.unit_price ELSE 0 END) AS m05,
    SUM(CASE WHEN MONTH(order_dt)=6 THEN oi.qty*oi.unit_price ELSE 0 END) AS m06,
    SUM(CASE WHEN MONTH(order_dt)=1 THEN oi.qty*oi.unit_price ELSE 0 END) AS m07,
    SUM(CASE WHEN MONTH(order_dt)=2 THEN oi.qty*oi.unit_price ELSE 0 END) AS m08,
    SUM(CASE WHEN MONTH(order_dt)=3 THEN oi.qty*oi.unit_price ELSE 0 END) AS m09,
    SUM(CASE WHEN MONTH(order_dt)=4 THEN oi.qty*oi.unit_price ELSE 0 END) AS m10,
    SUM(CASE WHEN MONTH(order_dt)=5 THEN oi.qty*oi.unit_price ELSE 0 END) AS m11,
    SUM(CASE WHEN MONTH(order_dt)=6 THEN oi.qty*oi.unit_price ELSE 0 END) AS m12
FROM tb_order AS o
    JOIN tb_order_item AS oi ON o.order_id=oi.order_id
GROUP BY YEAR(order_dt);

[다중 조인]

Q19. 상품별 재고 소진율

상품마다 지금까지 팔린 수량과 남은 재고를 나란히 놓고, 재고 대비 얼마나 팔렸는지(소진율)를 구하세요.

출력: 카테고리명 · 상품명 · 판매수량 · 남은재고 · 소진율(%)
소진율 = 판매수량 / (판매수량 + 남은재고) × 100, 소수점 1자리 반올림
조건: 취소 주문은 판매로 치지 않습니다. 한 번도 안 팔린 상품도 0으로 표시.
정렬: 소진율 높은 순

힌트

· 세 테이블: tb_category · tb_product · tb_order_item (+ 취소 제외용 tb_order)
· 안 팔린 상품도 살려야 합니다
· 판매수량이 NULL 인 상품은 IFNULL 로 0으로 바꿉니다

SELECT 
    c.category_name,
    p.product_name,
    IFNULL(SUM(oi.qty), 0) AS 판매수량,
    p.stock_qty AS 남은재고,
    ROUND(IFNULL(SUM(oi.qty), 0) / (IFNULL(SUM(oi.qty), 0) + p.stock_qty) * 100, 1) AS 소진율
FROM tb_category AS c
    JOIN tb_product AS p ON c.category_id = p.category_id
    LEFT JOIN tb_order_item AS oi ON p.product_id = oi.product_id
    LEFT JOIN tb_order AS o ON oi.order_id = o.order_id 
WHERE o.status <> 'CANCELED'
GROUP BY c.category_name, p.product_name, p.stock_qty
ORDER BY 소진율 DESC;


Q20. 취소로 놓친 매출

취소된 주문만 모아서, 얼마를 놓쳤는지 정리하세요.

출력: 고객명 · 국가 · 주문일 · 취소금액 · 담긴 상품 개수
그리고 취소 총액도 함께 구하세요.
정렬: 취소금액 큰 순

힌트
· 세 테이블: tb_customer · tb_order · tb_order_item
· "담긴 상품 개수"는 상세 줄 수입니다. ※ 수량 합계 아님


SELECT 
    c.customer_name,
    c.country,
    o.order_dt,
    SUM(oi.qty * oi.unit_price) AS 취소금액,
    COUNT(oi.order_item_id) AS 담긴상품개수,
    SUM(SUM(oi.qty * oi.unit_price)) OVER() AS 취소총액
FROM tb_order AS o
    JOIN tb_customer AS c ON c.customer_id = o.customer_id
    JOIN tb_order_item AS oi ON o.order_id = oi.order_id
WHERE o.status = 'CANCELED'
GROUP BY c.customer_name, c.country, o.order_dt, o.order_id
ORDER BY 취소금액 DESC;




Q21. 등급별 1인당 구매액

고객 등급(GOLD·SILVER·BRONZE·미지정)마다
그 등급에 속한 사람이 평균 얼마나 샀는지 구하세요.

출력: 등급 · 인원수 · 주문한 인원수 · 총매출 · 1인당 평균구매액
1인당 평균 = 총매출 / 그 등급의 전체 인원수 (주문 안 한 사람도 분모에 포함)
조건: 취소 주문 제외. 등급이 NULL 인 고객은 '미지정' 으로 묶습니다.
정렬: 1인당 평균구매액 높은 순

힌트
· 세 테이블: tb_customer · tb_order · tb_order_item
· 주문이 없는 고객도 인원수에 들어가야 합니다 → 조인 방향에 주의
· "인원수"와 "주문한 인원수"는 다릅니다. COUNT(DISTINCT)
· 등급 NULL 은 GROUP BY 에서도 IFNULL 로 감싸야 한 줄로 묶입니다


SELECT 
    IFNULL(c.grade, '미지정') AS 등급,
    COUNT(c.customer_id) AS 인원수,
    COUNT(DISTINCT o.customer_id) AS 주문한인원수,
    SUM(oi.qty * oi.unit_price) AS 총매출,
    SUM(oi.qty * oi.unit_price) / COUNT(c.customer_id) AS 1인당평균구매액
FROM tb_customer AS c
    LEFT JOIN tb_order AS o ON c.customer_id = o.customer_id
    LEFT JOIN tb_order_item AS oi ON o.order_id = oi.order_id
WHERE o.status <> 'CANCELED'
GROUP BY 등급
ORDER BY 1인당평균구매액 DESC;