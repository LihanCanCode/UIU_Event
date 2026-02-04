-- =====================================================
-- Event Koi - Performance Optimization & Monitoring
-- File: 07_performance_optimization.sql
-- Query optimization, explain plans, monitoring
-- =====================================================

-- =====================================================
-- 1. QUERY PERFORMANCE ANALYSIS
-- =====================================================

-- Enable query profiling
SET profiling = 1;

-- Example slow query
SELECT e.*, COUNT(b.booking_id)
FROM Events e
LEFT JOIN Bookings b ON e.event_id = b.event_id
GROUP BY e.event_id;

-- Show query execution time
SHOW PROFILES;

-- Detailed execution plan
EXPLAIN ANALYZE
SELECT 
    e.event_id,
    e.title,
    COUNT(DISTINCT b.booking_id) as bookings,
    SUM(tt.price) as revenue
FROM Events e
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
WHERE e.status = 'PUBLISHED'
  AND e.start_time > NOW()
GROUP BY e.event_id, e.title
ORDER BY revenue DESC
LIMIT 20;

-- =====================================================
-- 2. INDEX USAGE ANALYSIS
-- =====================================================

-- Check index cardinality
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'event_koi'
  AND TABLE_NAME IN ('Events', 'Bookings', 'Users')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Find unused indexes
SELECT 
    object_schema,
    object_name,
    index_name
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL
  AND count_star = 0
  AND object_schema = 'event_koi'
ORDER BY object_schema, object_name;

-- Find duplicate indexes
SELECT 
    a.TABLE_NAME,
    a.INDEX_NAME as index1,
    b.INDEX_NAME as index2,
    a.COLUMN_NAME
FROM information_schema.STATISTICS a
JOIN information_schema.STATISTICS b ON 
    a.TABLE_SCHEMA = b.TABLE_SCHEMA AND
    a.TABLE_NAME = b.TABLE_NAME AND
    a.COLUMN_NAME = b.COLUMN_NAME AND
    a.INDEX_NAME < b.INDEX_NAME
WHERE a.TABLE_SCHEMA = 'event_koi'
ORDER BY a.TABLE_NAME, a.COLUMN_NAME;

-- =====================================================
-- 3. QUERY OPTIMIZATION TECHNIQUES
-- =====================================================

-- BAD: Using SELECT *
-- SELECT * FROM Events WHERE status = 'PUBLISHED';

-- GOOD: Select only needed columns
SELECT event_id, title, start_time, venue_id
FROM Events
WHERE status = 'PUBLISHED';

-- BAD: Function in WHERE clause prevents index usage
-- SELECT * FROM Events WHERE YEAR(start_time) = 2025;

-- GOOD: Range query uses index
SELECT event_id, title, start_time
FROM Events
WHERE start_time BETWEEN '2025-01-01' AND '2025-12-31';

-- BAD: OR condition may not use index
-- SELECT * FROM Events WHERE category_id = 1 OR category_id = 2;

-- GOOD: IN clause can use index
SELECT event_id, title, category_id
FROM Events
WHERE category_id IN (1, 2);

-- BAD: Implicit type conversion
-- SELECT * FROM Users WHERE id = '123';

-- GOOD: Explicit type matching
SELECT id, name, email
FROM Users
WHERE id = 123;

-- =====================================================
-- 4. SUBQUERY OPTIMIZATION
-- =====================================================

-- BAD: Correlated subquery (runs for each row)
SELECT 
    e.event_id,
    e.title,
    (SELECT COUNT(*) FROM Bookings b WHERE b.event_id = e.event_id) as booking_count
FROM Events e;

-- GOOD: JOIN instead of subquery
SELECT 
    e.event_id,
    e.title,
    COUNT(b.booking_id) as booking_count
FROM Events e
LEFT JOIN Bookings b ON e.event_id = b.event_id
GROUP BY e.event_id, e.title;

-- BAD: IN with subquery
SELECT * FROM Events
WHERE event_id IN (SELECT event_id FROM Bookings WHERE user_id = 18);

-- GOOD: EXISTS (stops at first match)
SELECT e.* FROM Events e
WHERE EXISTS (
    SELECT 1 FROM Bookings b 
    WHERE b.event_id = e.event_id AND b.user_id = 18
);

-- =====================================================
-- 5. BATCH OPERATIONS
-- =====================================================

-- Efficient bulk insert
INSERT INTO Notifications (user_id, type, content)
SELECT 
    b.user_id,
    'EVENT_REMINDER',
    CONCAT('Event "', e.title, '" starts tomorrow!')
FROM Bookings b
JOIN Events e ON b.event_id = e.event_id
WHERE b.status = 'VALID'
  AND e.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
  AND NOT EXISTS (
      SELECT 1 FROM Notifications n
      WHERE n.user_id = b.user_id 
        AND n.type = 'EVENT_REMINDER'
        AND n.reference_id = e.event_id
  );

-- Batch update with CASE
UPDATE TicketTypes
SET price = CASE 
    WHEN quantity - sold_count < 10 THEN price * 1.2  -- 20% increase for low stock
    WHEN quantity - sold_count < 50 THEN price * 1.1  -- 10% increase
    ELSE price
END
WHERE event_id IN (SELECT event_id FROM Events WHERE start_time > NOW());

-- =====================================================
-- 6. CACHING STRATEGIES
-- =====================================================

-- Create cache table for expensive queries
CREATE TABLE query_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_value JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- Store query result
INSERT INTO query_cache (cache_key, cache_value, expires_at)
VALUES (
    'popular_events_2025',
    (SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'event_id', event_id,
            'title', title,
            'bookings', booking_count
        )
    ) FROM vw_PopularEvents LIMIT 10),
    DATE_ADD(NOW(), INTERVAL 1 HOUR)
);

-- Retrieve from cache
SELECT cache_value
FROM query_cache
WHERE cache_key = 'popular_events_2025'
  AND expires_at > NOW();

-- Clean expired cache
DELETE FROM query_cache WHERE expires_at < NOW();

-- =====================================================
-- 7. MONITORING QUERIES
-- =====================================================

-- Table size analysis
SELECT 
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb,
    TABLE_ROWS,
    ROUND((DATA_LENGTH / 1024 / 1024), 2) AS data_mb,
    ROUND((INDEX_LENGTH / 1024 / 1024), 2) AS index_mb,
    ROUND((INDEX_LENGTH / DATA_LENGTH * 100), 2) AS index_ratio_pct
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'event_koi'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- Slow query log analysis
SELECT 
    DIGEST_TEXT as query,
    COUNT_STAR as exec_count,
    AVG_TIMER_WAIT / 1000000000000 as avg_time_sec,
    MAX_TIMER_WAIT / 1000000000000 as max_time_sec,
    SUM_ROWS_EXAMINED as total_rows_examined,
    SUM_ROWS_SENT as total_rows_sent
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = 'event_koi'
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 20;

-- Lock contention analysis
SELECT 
    r.trx_id waiting_trx_id,
    r.trx_mysql_thread_id waiting_thread,
    r.trx_query waiting_query,
    b.trx_id blocking_trx_id,
    b.trx_mysql_thread_id blocking_thread,
    b.trx_query blocking_query
FROM information_schema.innodb_lock_waits w
INNER JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
INNER JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;

-- =====================================================
-- 8. PARTITIONING MAINTENANCE
-- =====================================================

-- Add new partition for next year
ALTER TABLE Bookings
ADD PARTITION (PARTITION p_2026 VALUES LESS THAN (2027));

-- Drop old partitions
ALTER TABLE Bookings DROP PARTITION p_2023;

-- Reorganize partitions
ALTER TABLE Bookings REORGANIZE PARTITION p_future INTO (
    PARTITION p_2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Check partition usage
SELECT 
    PARTITION_NAME,
    TABLE_ROWS,
    AVG_ROW_LENGTH,
    DATA_LENGTH / 1024 / 1024 as data_mb
FROM information_schema.PARTITIONS
WHERE TABLE_SCHEMA = 'event_koi'
  AND TABLE_NAME = 'Bookings'
ORDER BY PARTITION_ORDINAL_POSITION;

-- =====================================================
-- 9. STATISTICS MAINTENANCE
-- =====================================================

-- Update table statistics
ANALYZE TABLE Events, Bookings, Users, TicketTypes;

-- Optimize tables (defragment)
OPTIMIZE TABLE Events, Bookings, Users;

-- Check table health
CHECK TABLE Events, Bookings, Users;

-- Repair corrupted tables (if needed)
-- REPAIR TABLE Events;

-- =====================================================
-- 10. QUERY REWRITE RULES
-- =====================================================

-- Create summary table for common aggregations
CREATE TABLE event_summary_cache (
    event_id INT PRIMARY KEY,
    total_bookings INT,
    total_revenue DECIMAL(10,2),
    last_booking_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Trigger to maintain cache
DELIMITER $$
CREATE TRIGGER trg_update_event_summary
AFTER INSERT ON Bookings
FOR EACH ROW
BEGIN
    INSERT INTO event_summary_cache (event_id, total_bookings, total_revenue, last_booking_date)
    SELECT 
        NEW.event_id,
        COUNT(*),
        SUM(tt.price),
        MAX(b.created_at)
    FROM Bookings b
    JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    WHERE b.event_id = NEW.event_id AND b.status != 'CANCELLED'
    ON DUPLICATE KEY UPDATE
        total_bookings = VALUES(total_bookings),
        total_revenue = VALUES(total_revenue),
        last_booking_date = VALUES(last_booking_date);
END$$
DELIMITER ;

-- =====================================================
-- 11. CONNECTION POOLING OPTIMIZATION
-- =====================================================

-- Check current connections
SELECT 
    USER,
    HOST,
    DB,
    COMMAND,
    TIME,
    STATE,
    INFO
FROM information_schema.PROCESSLIST
WHERE DB = 'event_koi'
ORDER BY TIME DESC;

-- Kill long-running queries
-- SELECT CONCAT('KILL ', id, ';') as kill_command
-- FROM information_schema.PROCESSLIST
-- WHERE TIME > 300 AND COMMAND != 'Sleep';

-- Connection statistics
SHOW STATUS LIKE 'Threads%';
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Max_used_connections';

-- =====================================================
-- 12. BACKUP & RECOVERY PROCEDURES
-- =====================================================

-- Create backup procedure
DELIMITER $$
CREATE PROCEDURE sp_BackupEventData(IN p_event_id INT)
BEGIN
    CREATE TABLE IF NOT EXISTS event_backup (
        backup_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT,
        backup_data JSON,
        backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT INTO event_backup (event_id, backup_data)
    SELECT 
        e.event_id,
        JSON_OBJECT(
            'event', JSON_OBJECT('title', e.title, 'description', e.description),
            'bookings', (SELECT JSON_ARRAYAGG(JSON_OBJECT('booking_id', booking_id, 'user_id', user_id))
                        FROM Bookings WHERE event_id = e.event_id),
            'tickets', (SELECT JSON_ARRAYAGG(JSON_OBJECT('name', name, 'price', price))
                       FROM TicketTypes WHERE event_id = e.event_id)
        )
    FROM Events e
    WHERE e.event_id = p_event_id;
END$$
DELIMITER ;

-- =====================================================
-- PERFORMANCE OPTIMIZATION COMPLETE
-- =====================================================
SELECT 'Performance optimization features implemented!' as Status;
