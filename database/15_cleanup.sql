-- =====================================================
-- Event Koi - Database Cleanup Script
-- Removes unnecessary seed data while keeping core records
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Purge all social and transactional data
TRUNCATE TABLE Notifications;
TRUNCATE TABLE Messages;
TRUNCATE TABLE Friendships;
TRUNCATE TABLE PostComments;
TRUNCATE TABLE PostLikes;
TRUNCATE TABLE EventPosts;
TRUNCATE TABLE Sponsors;
TRUNCATE TABLE Bookings;

-- 2. Lean down Users
-- Keep admins, organizers, and one test attendee
DELETE FROM Users 
WHERE email NOT IN (
    'admin@eventkoi.com', 
    'sarah.admin@eventkoi.com', 
    'tech@events.bd', 
    'organizer@eventkoi.com', 
    'john.doe@email.com'
);

-- 3. Lean down Events
-- Keep only the events starting in 2026 or later
DELETE FROM Events 
WHERE start_time < '2026-01-01 00:00:00';

-- 4. Clean up orphaned TicketTypes
-- Remove tickets that don't belong to our remaining events
DELETE FROM TicketTypes 
WHERE event_id NOT IN (SELECT event_id FROM Events);

-- 5. Lean down Venues
-- Keep only the main venues used by our 2026 events
DELETE FROM Venues 
WHERE venue_id NOT IN (SELECT venue_id FROM Events);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database cleanup complete! Only core data and 2026 events remain.' as Status;
SELECT 'Users left:' as Metric, COUNT(*) as Count FROM Users;
SELECT 'Events left:' as Metric, COUNT(*) as Count FROM Events;
SELECT 'Venues left:' as Metric, COUNT(*) as Count FROM Venues;
