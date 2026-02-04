-- =====================================================
-- Event Koi - Advanced Database Features
-- File: 06_advanced_features.sql
-- Partitioning, Full-Text Search, JSON, Spatial Queries
-- =====================================================

-- =====================================================
-- 1. TABLE PARTITIONING (For Large Tables)
-- =====================================================

-- Partition Bookings table by year for better performance
ALTER TABLE Bookings
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p_2023 VALUES LESS THAN (2024),
    PARTITION p_2024 VALUES LESS THAN (2025),
    PARTITION p_2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Partition Messages by hash for even distribution
ALTER TABLE Messages
PARTITION BY HASH(sender_id)
PARTITIONS 4;

-- =====================================================
-- 2. FULL-TEXT SEARCH WITH RELEVANCE SCORING
-- =====================================================

-- Advanced event search with relevance ranking
SELECT 
    e.event_id,
    e.title,
    e.description,
    c.name as category,
    
    -- Full-text search score
    MATCH(e.title, e.description) AGAINST ('tech conference AI' IN NATURAL LANGUAGE MODE) as relevance_score,
    
    -- Boolean mode search (supports +, -, *)
    MATCH(e.title, e.description) AGAINST ('+tech +AI -cancelled' IN BOOLEAN MODE) as boolean_match,
    
    -- Query expansion (finds related terms)
    MATCH(e.title, e.description) AGAINST ('technology' WITH QUERY EXPANSION) as expanded_score
    
FROM Events e
JOIN Categories c ON e.category_id = c.category_id
WHERE MATCH(e.title, e.description) AGAINST ('tech conference AI' IN NATURAL LANGUAGE MODE)
  AND e.status = 'PUBLISHED'
ORDER BY relevance_score DESC
LIMIT 20;

-- =====================================================
-- 3. JSON OPERATIONS (Store & Query Complex Data)
-- =====================================================

-- Add JSON columns for flexible data
ALTER TABLE Events ADD COLUMN metadata JSON;
ALTER TABLE Users ADD COLUMN preferences JSON;
ALTER TABLE Venues ADD COLUMN amenities JSON;

-- Insert JSON data
UPDATE Events 
SET metadata = JSON_OBJECT(
    'tags', JSON_ARRAY('technology', 'networking', 'innovation'),
    'social_media', JSON_OBJECT(
        'facebook', 'https://facebook.com/event',
        'twitter', '@event'
    ),
    'requirements', JSON_ARRAY('ID card', 'Ticket'),
    'age_restriction', 18
)
WHERE event_id = 1;

-- Query JSON data
SELECT 
    event_id,
    title,
    JSON_EXTRACT(metadata, '$.tags') as tags,
    JSON_EXTRACT(metadata, '$.age_restriction') as age_limit,
    JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.social_media.facebook')) as facebook_url
FROM Events
WHERE JSON_CONTAINS(metadata, '"technology"', '$.tags')
  AND JSON_EXTRACT(metadata, '$.age_restriction') >= 18;

-- JSON aggregation
SELECT 
    category_id,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'event_id', event_id,
            'title', title,
            'tags', JSON_EXTRACT(metadata, '$.tags')
        )
    ) as events_json
FROM Events
WHERE metadata IS NOT NULL
GROUP BY category_id;

-- =====================================================
-- 4. SPATIAL QUERIES (Geo-Location Based)
-- =====================================================

-- Find venues within radius (using Haversine formula)
DELIMITER $$
CREATE FUNCTION distance_km(lat1 DECIMAL(10,8), lon1 DECIMAL(11,8), 
                            lat2 DECIMAL(10,8), lon2 DECIMAL(11,8))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE R DECIMAL(10,2) DEFAULT 6371; -- Earth radius in km
    DECLARE dLat DECIMAL(10,8);
    DECLARE dLon DECIMAL(11,8);
    DECLARE a DECIMAL(20,10);
    DECLARE c DECIMAL(20,10);
    
    SET dLat = RADIANS(lat2 - lat1);
    SET dLon = RADIANS(lon2 - lon1);
    SET a = SIN(dLat/2) * SIN(dLat/2) + 
            COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
            SIN(dLon/2) * SIN(dLon/2);
    SET c = 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END$$
DELIMITER ;

-- Find events within 10km of user location
SELECT 
    e.event_id,
    e.title,
    v.name as venue,
    v.city,
    v.latitude,
    v.longitude,
    distance_km(23.8103, 90.4125, v.latitude, v.longitude) as distance_km
FROM Events e
JOIN Venues v ON e.venue_id = v.venue_id
WHERE distance_km(23.8103, 90.4125, v.latitude, v.longitude) <= 10
  AND e.status = 'PUBLISHED'
ORDER BY distance_km ASC;

-- =====================================================
-- 5. ADVANCED INDEXING STRATEGIES
-- =====================================================

-- Composite index with included columns (covering index)
CREATE INDEX idx_events_covering ON Events(status, start_time, category_id)
INCLUDE (title, description, venue_id);

-- Functional index (index on expression)
CREATE INDEX idx_events_year_month ON Events((YEAR(start_time)), (MONTH(start_time)));

-- Descending index for ORDER BY DESC queries
CREATE INDEX idx_bookings_created_desc ON Bookings(created_at DESC);

-- Multi-column full-text index
CREATE FULLTEXT INDEX ft_event_search ON Events(title, description);
CREATE FULLTEXT INDEX ft_user_search ON Users(name, email, designation);

-- =====================================================
-- 6. MATERIALIZED VIEW SIMULATION (With Refresh)
-- =====================================================

-- Create summary table
CREATE TABLE mv_EventStatistics (
    event_id INT PRIMARY KEY,
    total_bookings INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    unique_attendees INT DEFAULT 0,
    avg_ticket_price DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_revenue (total_revenue),
    INDEX idx_bookings (total_bookings)
) ENGINE=InnoDB;

-- Refresh procedure
DELIMITER $$
CREATE PROCEDURE sp_RefreshEventStatistics()
BEGIN
    TRUNCATE TABLE mv_EventStatistics;
    
    INSERT INTO mv_EventStatistics (event_id, total_bookings, total_revenue, unique_attendees, avg_ticket_price)
    SELECT 
        e.event_id,
        COUNT(DISTINCT b.booking_id) as total_bookings,
        COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT b.user_id) as unique_attendees,
        AVG(tt.price) as avg_ticket_price
    FROM Events e
    LEFT JOIN Bookings b ON e.event_id = b.event_id
    LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    GROUP BY e.event_id;
END$$
DELIMITER ;

-- Schedule refresh (would use MySQL Event Scheduler)
CREATE EVENT evt_refresh_statistics
ON SCHEDULE EVERY 1 HOUR
DO CALL sp_RefreshEventStatistics();

-- =====================================================
-- 7. DYNAMIC PIVOT (Category Sales by Month)
-- =====================================================

DELIMITER $$
CREATE PROCEDURE sp_DynamicPivot()
BEGIN
    SET @sql = NULL;
    
    SELECT GROUP_CONCAT(DISTINCT
        CONCAT(
            'SUM(CASE WHEN c.name = ''', name, ''' THEN revenue ELSE 0 END) AS `', name, '`'
        )
    ) INTO @sql
    FROM Categories;
    
    SET @sql = CONCAT(
        'SELECT 
            DATE_FORMAT(b.created_at, ''%Y-%m'') as month,
            ', @sql, ',
            SUM(revenue) as total
        FROM (
            SELECT b.created_at, e.category_id, SUM(tt.price) as revenue
            FROM Bookings b
            JOIN Events e ON b.event_id = e.event_id
            JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
            WHERE b.status != ''CANCELLED''
            GROUP BY b.booking_id, b.created_at, e.category_id
        ) rev
        JOIN Categories c ON rev.category_id = c.category_id
        GROUP BY DATE_FORMAT(rev.created_at, ''%Y-%m'')
        ORDER BY month DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$
DELIMITER ;

-- =====================================================
-- 8. HIERARCHICAL DATA (Nested Comments)
-- =====================================================

-- Get comment thread with depth
WITH RECURSIVE CommentThread AS (
    -- Base case: top-level comments
    SELECT 
        comment_id,
        post_id,
        user_id,
        content,
        parent_comment_id,
        0 as depth,
        CAST(comment_id AS CHAR(1000)) as path
    FROM PostComments
    WHERE parent_comment_id IS NULL AND post_id = 1
    
    UNION ALL
    
    -- Recursive case: replies
    SELECT 
        pc.comment_id,
        pc.post_id,
        pc.user_id,
        pc.content,
        pc.parent_comment_id,
        ct.depth + 1,
        CONCAT(ct.path, '->', pc.comment_id)
    FROM PostComments pc
    INNER JOIN CommentThread ct ON pc.parent_comment_id = ct.comment_id
    WHERE ct.depth < 5  -- Limit depth
)
SELECT 
    ct.*,
    u.name as commenter,
    CONCAT(REPEAT('  ', ct.depth), ct.content) as indented_content
FROM CommentThread ct
JOIN Users u ON ct.user_id = u.id
ORDER BY ct.path;

-- =====================================================
-- 9. TEMPORAL QUERIES (Time-Based Analysis)
-- =====================================================

-- Events happening in specific time windows
SELECT 
    e.event_id,
    e.title,
    e.start_time,
    e.end_time,
    
    -- Time classifications
    CASE 
        WHEN e.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'This Week'
        WHEN e.start_time BETWEEN DATE_ADD(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'This Month'
        WHEN e.start_time BETWEEN DATE_ADD(NOW(), INTERVAL 30 DAY) AND DATE_ADD(NOW(), INTERVAL 90 DAY) THEN 'Next 3 Months'
        ELSE 'Later'
    END as time_window,
    
    -- Business hours check
    CASE 
        WHEN HOUR(e.start_time) BETWEEN 9 AND 17 THEN 'Business Hours'
        WHEN HOUR(e.start_time) BETWEEN 18 AND 22 THEN 'Evening'
        ELSE 'Off Hours'
    END as time_slot,
    
    -- Weekend check
    CASE DAYOFWEEK(e.start_time)
        WHEN 1 THEN 'Sunday'
        WHEN 7 THEN 'Saturday'
        ELSE 'Weekday'
    END as day_type
    
FROM Events e
WHERE e.status = 'PUBLISHED'
  AND e.start_time > NOW()
ORDER BY e.start_time;

-- =====================================================
-- 10. ADVANCED AGGREGATIONS
-- =====================================================

-- Multi-level grouping with ROLLUP
SELECT 
    COALESCE(c.name, 'ALL CATEGORIES') as category,
    COALESCE(v.city, 'ALL CITIES') as city,
    COUNT(DISTINCT e.event_id) as event_count,
    COUNT(DISTINCT b.booking_id) as booking_count,
    COALESCE(SUM(tt.price), 0) as revenue
FROM Events e
LEFT JOIN Categories c ON e.category_id = c.category_id
LEFT JOIN Venues v ON e.venue_id = v.venue_id
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
WHERE e.status = 'PUBLISHED'
GROUP BY c.name, v.city WITH ROLLUP
ORDER BY category, city;

-- GROUPING SETS (multiple groupings in one query)
SELECT 
    YEAR(b.created_at) as year,
    MONTH(b.created_at) as month,
    e.category_id,
    COUNT(*) as bookings,
    SUM(tt.price) as revenue
FROM Bookings b
JOIN Events e ON b.event_id = e.event_id
JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
WHERE b.status != 'CANCELLED'
GROUP BY 
    GROUPING SETS (
        (YEAR(b.created_at)),
        (YEAR(b.created_at), MONTH(b.created_at)),
        (e.category_id),
        (YEAR(b.created_at), e.category_id),
        ()
    )
ORDER BY year, month, category_id;

-- =====================================================
-- ADVANCED FEATURES COMPLETE
-- =====================================================
SELECT 'Advanced database features implemented!' as Status;
