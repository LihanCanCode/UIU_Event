-- =====================================================
-- Event Koi - Minimal Core Procedures & Triggers
-- File: 02_procedures_triggers.sql
-- =====================================================

DELIMITER $$

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- 1. Get user activity summary (Simplified - Organizer Only Focus)
DROP PROCEDURE IF EXISTS sp_GetUserActivity$$
CREATE PROCEDURE sp_GetUserActivity(IN p_user_id INT)
BEGIN
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(DISTINCT e.event_id) as events_organized
    FROM Users u
    LEFT JOIN Events e ON u.id = e.organizer_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.name, u.email, u.role;
END$$

DELIMITER ;

-- =====================================================
-- PROCEDURES & TRIGGERS CREATED SUCCESSFULLY
-- =====================================================
SELECT 'Stored procedures and triggers created successfully!' as Status;
