-- =====================================================
-- Event Koi - Custom Seed 2026 & Fix Credentials
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Update existing users with valid bcrypt hash for 'password'
-- Hash: $2b$10$aveUwUbM6zCIW657DU6Lp.Ri8EdwB7M1G6BOwEjcNUR5TMS6rKXlO
UPDATE Users SET password = '$2b$10$aveUwUbM6zCIW657DU6Lp.Ri8EdwB7M1G6BOwEjcNUR5TMS6rKXlO' 
WHERE email IN ('admin@eventkoi.com', 'sarah.admin@eventkoi.com', 'tech@events.bd', 'john.doe@email.com');

-- 2. Add a dedicated Organizer
INSERT IGNORE INTO Users (name, email, password, role) 
VALUES ('Main Organizer', 'organizer@eventkoi.com', '$2b$10$aveUwUbM6zCIW657DU6Lp.Ri8EdwB7M1G6BOwEjcNUR5TMS6rKXlO', 'organizer');

-- Get the organizer id
SET @org_id = (SELECT id FROM Users WHERE email = 'organizer@eventkoi.com');

-- 3. Add 2026 Events in Bangladesh
INSERT INTO Events (organizer_id, category_id, title, description, location, start_time, end_time) VALUES
-- Dhaka Events
(@org_id, 1, 'Bangladesh Tech Expo 2026', 'Future of AI and Robotics in Bangladesh.', 'ICC Purbachal', '2026-06-15 09:00:00', '2026-06-17 18:00:00'),
(@org_id, 6, 'Dhaka Food Carnival 2026', 'A massive celebration of Bangladeshi street food and international cuisines.', 'Hatirjheel Amphitheatre', '2026-08-10 12:00:00', '2026-08-12 22:00:00'),

-- Chittagong Events
(@org_id, 2, 'Chittagong Music Fest 2026', 'Live performances from top bands across the country.', 'M.A. Aziz Stadium', '2026-07-20 18:00:00', '2026-07-20 23:30:00'),
(@org_id, 4, 'Ctg Business Summit 2026', 'Networking event for entrepreneurs in the port city.', 'Radisson Blu Bay View', '2026-09-05 10:00:00', '2026-09-06 17:00:00'),

-- Sylhet Events
(@org_id, 3, 'Sylhet Green Fest 2026', 'Sports and eco-awareness event in the beauty of tea gardens.', 'Sylhet International Stadium', '2026-05-12 08:00:00', '2026-05-12 18:00:00');

-- 4. Add Ticket Types for these events
-- Get event IDs
SET @e1 = (SELECT event_id FROM Events WHERE title = 'Bangladesh Tech Expo 2026');
SET @e2 = (SELECT event_id FROM Events WHERE title = 'Dhaka Food Carnival 2026');
SET @e3 = (SELECT event_id FROM Events WHERE title = 'Chittagong Music Fest 2026');
SET @e4 = (SELECT event_id FROM Events WHERE title = 'Ctg Business Summit 2026');
SET @e5 = (SELECT event_id FROM Events WHERE title = 'Sylhet Green Fest 2026');

INSERT INTO TicketTypes (event_id, name, price, quantity) VALUES
(@e1, 'Early Bird', 1200.00, 200),
(@e1, 'Regular', 1800.00, 500),
(@e2, 'Entry Only', 200.00, 2000),
(@e2, 'Foodie Pass', 1000.00, 500),
(@e3, 'Standing', 500.00, 1000),
(@e3, 'VIP Seating', 2500.00, 100),
(@e4, 'Business Pass', 2000.00, 300),
(@e5, 'General Entry', 100.00, 5000);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Custom 2026 seed and credential fix complete!' as Status;
