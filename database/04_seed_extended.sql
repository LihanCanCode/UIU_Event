-- This file will generate 1000+ additional records programmatically
-- Run after 04_seed.sql for massive dataset

-- Generate 200 more users
INSERT INTO Users (name, email, password, role, phone, designation, created_at)
SELECT 
    CONCAT('User_', n),
    CONCAT('user', n, '@email.com'),
    '$2a$10$YourHashedPasswordHere',
    CASE WHEN n % 10 = 0 THEN 'organizer' ELSE 'attendee' END,
    CONCAT('+88017', LPAD(n, 8, '0')),
    CASE 
        WHEN n % 5 = 0 THEN 'Engineer'
        WHEN n % 5 = 1 THEN 'Designer'
        WHEN n % 5 = 2 THEN 'Manager'
        WHEN n % 5 = 3 THEN 'Developer'
        ELSE 'Analyst'
    END,
    DATE_ADD('2024-01-01', INTERVAL n DAY)
FROM (
    SELECT a.N + b.N * 10 + c.N * 100 + 1 n
    FROM 
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2) c
    LIMIT 200
) numbers;

-- Generate 100 more events
INSERT INTO Events (organizer_id, venue_id, category_id, title, description, start_time, end_time, status, listing_fee, is_listing_paid)
SELECT 
    3 + (n % 15),  -- Rotate through organizers
    1 + (n % 20),  -- Rotate through venues
    1 + (n % 15),  -- Rotate through categories
    CONCAT('Event ', n, ': ', 
        CASE (n % 5)
            WHEN 0 THEN 'Tech Conference'
            WHEN 1 THEN 'Music Festival'
            WHEN 2 THEN 'Sports Tournament'
            WHEN 3 THEN 'Business Summit'
            ELSE 'Cultural Event'
        END
    ),
    CONCAT('Description for event ', n, '. This is a comprehensive event covering multiple topics.'),
    DATE_ADD(NOW(), INTERVAL n DAY),
    DATE_ADD(NOW(), INTERVAL (n + 1) DAY),
    'PUBLISHED',
    1000.00 + (n * 100),
    TRUE
FROM (
    SELECT a.N + b.N * 10 + 1 n
    FROM 
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
    LIMIT 100
) numbers;

-- Generate 500 more bookings
INSERT INTO Bookings (user_id, event_id, ticket_type_id, unique_code, status, created_at)
SELECT 
    18 + (n % 200),  -- Rotate through users
    1 + (n % 100),   -- Rotate through events
    1 + (n % 40),    -- Rotate through ticket types
    UUID(),
    CASE (n % 10)
        WHEN 0 THEN 'CANCELLED'
        WHEN 1 THEN 'USED'
        ELSE 'VALID'
    END,
    DATE_ADD('2024-01-01', INTERVAL n HOUR)
FROM (
    SELECT a.N + b.N * 10 + c.N * 100 + 1 n
    FROM 
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
    (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) c
    LIMIT 500
) numbers;

SELECT 'Extended seed data loaded: +200 users, +100 events, +500 bookings' as Status;
