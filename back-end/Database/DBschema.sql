-- DROP DATABASE IF EXISTS --

DROP DATABASE IF EXISTS online_ticket_booking;

-- DATABASE CREATION --

CREATE DATABASE online_ticket_booking;
USE online_ticket_booking;


-- CUSTOMER TABLE --

CREATE TABLE CUSTOMER (
    customer_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    age INT,
    gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
    phone_number VARCHAR(10) UNIQUE
);


-- ADMIN TABLE --

CREATE TABLE ADMIN (
    admin_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100)
);


-- SERVICE PROVIDER TABLE --

CREATE TABLE SERVICE_PROVIDER (
    provider_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100)
);


-- CUSTOMER SUPPORT STAFF --

CREATE TABLE CUSTOMER_SUPPORT (
    supporter_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100)
);


-- VEHICLE TABLE --

CREATE TABLE VEHICLE (
    vehicle_id VARCHAR(10) PRIMARY KEY,
    provider_id VARCHAR(10) NOT NULL,
    vehicle_number VARCHAR(50) UNIQUE,
    vehicle_type ENUM('AC','Non-AC','No preference'),
    total_seats INT CHECK (total_seats > 0),
    remaining_seats INT CHECK (remaining_seats >= 0),

    FOREIGN KEY (provider_id)
    REFERENCES SERVICE_PROVIDER(provider_id)
);


-- SEAT TABLE (Weak Entity)

CREATE TABLE SEAT (
    vehicle_id VARCHAR(10),
    seat_number INT,
    seat_status VARCHAR(20),

    PRIMARY KEY(vehicle_id, seat_number),

    FOREIGN KEY(vehicle_id)
    REFERENCES VEHICLE(vehicle_id)
);


-- ROUTE TABLE --

CREATE TABLE ROUTE (
    route_id VARCHAR(10) PRIMARY KEY,
    source VARCHAR(100),
    destination VARCHAR(100),
    distance INT CHECK (distance >= 0)
);


-- SCHEDULE TABLE --

CREATE TABLE SCHEDULE (
    schedule_id VARCHAR(10) PRIMARY KEY,
    route_id VARCHAR(10) NOT NULL,
    provider_id VARCHAR(10) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    journey_date DATE NOT NULL,
    arrival_time_to_destination TIME NOT NULL,

    FOREIGN KEY(route_id)
    REFERENCES ROUTE(route_id),

    FOREIGN KEY(provider_id)
    REFERENCES SERVICE_PROVIDER(provider_id)
);


-- TRIP TABLE --

CREATE TABLE TRIP (
    trip_id VARCHAR(10) PRIMARY KEY,
    schedule_id VARCHAR(10) NOT NULL,
    vehicle_id VARCHAR(10) NOT NULL,
    trip_status ENUM('SCHEDULED', 'DELAYED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),

    FOREIGN KEY(schedule_id)
    REFERENCES SCHEDULE(schedule_id),

    FOREIGN KEY(vehicle_id)
    REFERENCES VEHICLE(vehicle_id)
);


-- OFFER TABLE --

CREATE TABLE OFFER (
    offer_id VARCHAR(10) PRIMARY KEY,
    provider_id VARCHAR(10),
    offer_code VARCHAR(50) UNIQUE,
    discount_percentage INT CHECK (discount_percentage >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED', 'SUSPENDED'),

    FOREIGN KEY(provider_id)
    REFERENCES SERVICE_PROVIDER(provider_id)
);


-- IRCTC TABLE --

CREATE TABLE IRCTC (
    irctc_id VARCHAR(20) PRIMARY KEY,
    verification_status ENUM('IN_PROGRESS', 'REJECTED', 'VERIFIED', 'FAILED'),
    irctc_username VARCHAR(10),
    linked_phone_number INT
);


-- BOOKING TABLE --

CREATE TABLE BOOKING (
    booking_id VARCHAR(10) PRIMARY KEY,
    customer_id VARCHAR(10) NOT NULL,
    trip_id VARCHAR(10) NOT NULL,
    offer_id VARCHAR(10),
    booking_date DATE NOT NULL,
    booking_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
    irctc_id VARCHAR(20),

    FOREIGN KEY(customer_id)
    REFERENCES CUSTOMER(customer_id),

    FOREIGN KEY(irctc_id)
    REFERENCES IRCTC(irctc_id),

    FOREIGN KEY(trip_id)
    REFERENCES TRIP(trip_id),

    FOREIGN KEY(offer_id)
    REFERENCES OFFER(offer_id)
);


-- PAYMENT TABLE --

CREATE TABLE PAYMENT (
    payment_id VARCHAR(10) PRIMARY KEY,
    booking_id VARCHAR(10) UNIQUE,
    amount DECIMAL(10,2) CHECK (amount >= 0),
    discount_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'),
    payment_date DATE NOT NULL,

    FOREIGN KEY(booking_id)
    REFERENCES BOOKING(booking_id)
);


-- CANCELLATION TABLE --

CREATE TABLE CANCELLATION (
    booking_id VARCHAR(10) FOREIGN KEY,
    cancel_date DATE NOT NULL,

    FOREIGN KEY(booking_id)
    REFERENCES BOOKING(booking_id)
);


-- REFUND TABLE --

CREATE TABLE REFUND (
    booking_id VARCHAR(10) PRIMARY KEY,
    admin_id VARCHAR(10),
    refund_amount DECIMAL(10,2) CHECK (refund_amount >= 0),
    refund_status ENUM('REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED'),
    refund_date DATE NOT NULL,

    FOREIGN KEY (booking_id)
    REFERENCES BOOKING(booking_id),

    FOREIGN KEY (admin_id)
    REFERENCES ADMIN(admin_id)
);


-- REVIEW TABLE --

CREATE TABLE REVIEW (
    review_id VARCHAR(10) PRIMARY KEY,
    customer_id VARCHAR(10),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    review_date DATE NOT NULL,

    FOREIGN KEY(customer_id)
    REFERENCES CUSTOMER(customer_id)
);


-- SUPPORT REQUEST TABLE --

CREATE TABLE SUPPORT_REQUEST (
    request_id VARCHAR(10) PRIMARY KEY,
    customer_id VARCHAR(10),
    supporter_id VARCHAR(10),
    description TEXT,
    status VARCHAR(50),
    created_date DATE NOT NULL,

    FOREIGN KEY(customer_id)
    REFERENCES CUSTOMER(customer_id),

    FOREIGN KEY(supporter_id)
    REFERENCES CUSTOMER_SUPPORT(supporter_id)
);


-- REPORT TABLE --

CREATE TABLE REPORT (
    admin_id VARCHAR(10),
    report_date DATE NOT NULL,
    total_booking INT,
    total_revenue DECIMAL(12,2),

    PRIMARY KEY(admin_id, report_date),

    FOREIGN KEY(admin_id)
    REFERENCES ADMIN(admin_id)
);
