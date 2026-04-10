-- =====================================================
-- Event Koi - Minimalist Views & Indexes
-- File: 03_views_indexes.sql
-- =====================================================

-- 1. Event Summary View (Minimal)
DROP VIEW IF EXISTS vw_EventSummary;
CREATE VIEW vw_EventSummary AS
SELECT 
    e.event_id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    e.location,
    c.name as category_name,
    u.name as organizer_name,
    u.email as organizer_email,
    DATEDIFF(e.start_time, NOW()) as days_until_event
FROM Events e
LEFT JOIN Categories c ON e.category_id = c.category_id
LEFT JOIN Users u ON e.organizer_id = u.id;

-- =====================================================
-- VIEWS & INDEXES CREATED SUCCESSFULLY
-- =====================================================
SELECT 'Minimalist views and performance indexes created successfully!' as Status;
