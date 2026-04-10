-- =====================================================
-- Event Koi - Database Cleanup Script
-- Removes unnecessary seed data while keeping core records
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Lean down Users
-- Keep admins, organizers, and test accounts
DELETE FROM Users 
WHERE email NOT IN (
    'admin@eventkoi.com', 
    'sarah.admin@eventkoi.com', 
    'tech@events.bd', 
    'organizer@eventkoi.com', 
    'john.doe@email.com'
);

-- 2. Lean down Events
-- Keep only the events starting in 2026 or later
DELETE FROM Events 
WHERE start_time < '2026-01-01 00:00:00';

-- 3. Clean up orphaned TicketTypes
-- Remove tickets that don't belong to our remaining events
DELETE FROM TicketTypes 
WHERE event_id NOT IN (SELECT event_id FROM Events);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database cleanup complete! Only core data and 2026 events remain.' as Status;
SELECT 'Users left:' as Metric, COUNT(*) as Count FROM Users;
SELECT 'Events left:' as Metric, COUNT(*) as Count FROM Events;
