
CREATE DATABASE IF NOT EXISTS lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_db;

--------- 1. 유저 DDL 스크립트 -----------

CREATE TABLE tb_user (
    user_id     INT      NOT NULL AUTO_INCREMENT,
    user_type   VARCHAR(16) NOT NULL,
    PRIMARY KEY (user_id)
) COMMENT='유저';

--------- 2. 회원정보 DDL 스크립트 -----------
CREATE TABLE tb_member (
    user_id         INT      NOT NULL,
    id              VARCHAR(100) NOT NULL,
    m_name            VARCHAR(50)  NOT NULL,
    email           VARCHAR(100) NOT NULL,
    phone           VARCHAR(50)  NULL,
    joined_at       DATE         NULL,
    birth_year      SMALLINT     NULL,
    gender          CHAR(1)      NULL,
    marketing_agree VARCHAR(16)      NOT NULL DEFAULT 'Flase',
    last_login_at   DATETIME     NULL,
    user_type       VARCHAR(50)  NOT NULL DEFAULT '일반',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    -- 제약 조건 설정
    UNIQUE KEY uix_tb_member_email (email)     -- 이메일 중복 방지(UK) 지정
) COMMENT='회원정보';

--------- 3. 강사 DDL 스크립트 -----------

CREATE TABLE tb_instructor (
    user_id         INT      NOT NULL,
    i_name          VARCHAR(32) NOT NULL,
    created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) COMMENT='강사';

--------- 4. 강의 DDL 스크립트 -----------

CREATE TABLE tb_course (
    course_id     INT          NOT NULL AUTO_INCREMENT,
    course_code   VARCHAR(100)  NOT NULL,
    title         VARCHAR(100) NOT NULL,
    user_id       INT      NOT NULL,
    price         INT          NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id),
    UNIQUE KEY uix_course_code (course_code),
    CONSTRAINT fk_course_instructor FOREIGN KEY (user_id) REFERENCES tb_instructor (user_id)
) COMMENT='강의';


--------- 5. 레슨 DDL 스크립트 -----------

CREATE TABLE tb_lesson (
    lesson_id   INT          NOT NULL AUTO_INCREMENT,
    course_id   INT          NOT NULL,
    lesson_no   INT          NOT NULL,
    title       VARCHAR(100) NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lesson_id),
    UNIQUE KEY uix_course_lesson (course_id, lesson_no),
    CONSTRAINT fk_lesson_course FOREIGN KEY (course_id) REFERENCES tb_course (course_id)
) COMMENT='레슨';


--------- 6. 쿠폰 DDL 스크립트 -----------

CREATE TABLE tb_coupon (
    coupon_id   INT         NOT NULL AUTO_INCREMENT,
    coupon_code VARCHAR(32) NOT NULL,
    coupon_name VARCHAR(50) NOT NULL,
    amount      INT         NOT NULL DEFAULT 0,
    expired_at  DATE        NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (coupon_id),
    UNIQUE KEY uix_coupon_code (coupon_code)
) COMMENT='쿠폰';

--------- 7. 결제정보 DDL 스크립트 -----------

CREATE TABLE tb_payment (
    payment_id         INT         NOT NULL AUTO_INCREMENT,
    user_id            INT         NOT NULL,
    coupon_id          INT         NULL,
    applied_at         DATE        NOT NULL,
    paid_at            DATE        NULL,
    payment_method     VARCHAR(16) NOT NULL,
    original_price     INT         NOT NULL DEFAULT 0,
    coupon_discount    INT         NOT NULL DEFAULT 0,
    paid_amount        INT         NOT NULL DEFAULT 0,
    created_at         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    CONSTRAINT fk_payment_member FOREIGN KEY (user_id) REFERENCES tb_member (user_id),
    CONSTRAINT fk_payment_coupon FOREIGN KEY (coupon_id) REFERENCES tb_coupon (coupon_id)
) COMMENT='결제정보';


--------- 8. 쿠폰발행 DDL 스크립트 -----------

CREATE TABLE tb_coupon_issue (
    issue_id        INT      NOT NULL AUTO_INCREMENT,
    coupon_id       INT      NOT NULL,
    user_id         INT      NOT NULL,
    payment_id      INT      NOT NULL,
    issued_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at         DATETIME NULL,
    status_now          VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE',
    PRIMARY KEY (issue_id),
    CONSTRAINT fk_issue_coupon FOREIGN KEY (coupon_id) REFERENCES tb_coupon (coupon_id),
    CONSTRAINT fk_issue_member FOREIGN KEY (user_id) REFERENCES tb_member (user_id),
    CONSTRAINT fk_issue_payment FOREIGN KEY (payment_id) REFERENCES tb_payment (payment_id)
) COMMENT='쿠폰 발행';

--------- 9. 환불 DDL 스크립트 -----------

CREATE TABLE tb_refund (
    refund_id       INT   NOT NULL AUTO_INCREMENT,
    payment_id      INT      NOT NULL,
    refunded_at     DATE     NOT NULL,
    refunded_amount INT      NOT NULL DEFAULT 0,
    refund_reason   TEXT     NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (refund_id),
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES tb_payment (payment_id)
) COMMENT='환불';


--------- 10. 수강정보 DDL 스크립트 -----------

CREATE TABLE tb_enrollment (
    enrollment_id  INT   NOT NULL AUTO_INCREMENT,
    user_id        INT   NOT NULL,
    course_id      INT   NOT NULL,
    payment_id     INT   NOT NULL,
    progress_rate  SMALLINT NOT NULL DEFAULT 0,
    last_lesson_no INT      NULL,
    is_completed   VARCHAR(16)  NOT NULL DEFAULT 'False',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (enrollment_id),
    CONSTRAINT fk_enrollment_member FOREIGN KEY (user_id) REFERENCES tb_member (user_id),
    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES tb_course (course_id),
    CONSTRAINT fk_enrollment_payment FOREIGN KEY (payment_id) REFERENCES tb_payment (payment_id)
) COMMENT='수강정보';



--------- 11. 리뷰 DDL 스크립트 -----------

CREATE TABLE tb_review (
    review_id    INT       NOT NULL AUTO_INCREMENT,
    review_no    VARCHAR(100)  NOT NULL,
    user_id      INT           NOT NULL,
    course_id    INT          NOT NULL,
    rating       SMALLINT      NOT NULL,
    title        VARCHAR(100) NULL,
    content      TEXT         NULL,
    status_now   VARCHAR(16)  NOT NULL DEFAULT 'PUBLIC',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    UNIQUE KEY uix_review_no (review_no),
    CONSTRAINT fk_review_member FOREIGN KEY (user_id) REFERENCES tb_member (user_id),
    CONSTRAINT fk_review_course FOREIGN KEY (course_id) REFERENCES tb_course (course_id)
) COMMENT='리뷰';




--------- 12. 문의사항 DDL 스크립트 -----------

CREATE TABLE tb_inquiry (
    inquiry_id        INT       NOT NULL AUTO_INCREMENT,
    inquiry_no        VARCHAR(32)  NOT NULL,
    user_id         INT       NOT NULL,
    course_id         INT          NOT NULL,
    lesson_id         INT          NOT NULL,
    title             VARCHAR(100) NOT NULL,
    content           TEXT         NOT NULL,
    answer_content    TEXT         NULL,
    answered_member_id INT         NOT NULL,
    answered_at       DATETIME     NULL,
    status_now        VARCHAR(16)  NOT NULL DEFAULT 'WAIT',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (inquiry_id),
    UNIQUE KEY uix_inquiry_no (inquiry_no),
    CONSTRAINT fk_inquiry_member FOREIGN KEY (user_id) REFERENCES tb_member (user_id),
    CONSTRAINT fk_inquiry_course FOREIGN KEY (course_id) REFERENCES tb_course (course_id),
    CONSTRAINT fk_inquiry_lesson FOREIGN KEY (lesson_id) REFERENCES tb_lesson (lesson_id),
    CONSTRAINT fk_inquiry_answerer FOREIGN KEY (answered_member_id) REFERENCES tb_user (user_id)
) COMMENT='문의사항';