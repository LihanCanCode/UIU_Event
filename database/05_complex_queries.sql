-- =====================================================
-- Event Koi - Complex SQL Queries
-- File: 05_complex_queries.sql
-- Demonstrates advanced RDBMS operations
-- ALL filtering and logic handled in database
-- =====================================================

-- =====================================================
-- 1. ADVANCED EVENT ANALYTICS WITH WINDOW FUNCTIONS
-- =====================================================

-- Get event rankings with running totals and percentiles
SELECT 
    e.event_id,
    e.title,
    c.name as category,
    COUNT(DISTINCT b.booking_id) as bookings,
    SUM(tt.price) as revenue,
    
    -- Running total of revenue
    SUM(SUM(tt.price)) OVER (
        ORDER BY e.start_time
    ) as cumulative_revenue,
    
    -- Rank within category
    RANK() OVER (
        PARTITION BY e.category_id 
        ORDER BY COUNT(DISTINCT b.booking_id) DESC
    ) as category_rank,
    
    -- Percentile ranking
    PERCENT_RANK() OVER (
        ORDER BY COUNT(DISTINCT b.booking_id)
    ) as booking_percentile,
    
    -- Moving average (last 3 events)
    AVG(COUNT(DISTINCT b.booking_id)) OVER (
        ORDER BY e.start_time
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as booking_moving_avg,
    
    -- Lead/Lag analysis
    LAG(COUNT(DISTINCT b.booking_id)) OVER (ORDER BY e.start_time) as prev_event_bookings,
    LEAD(COUNT(DISTINCT b.booking_id)) OVER (ORDER BY e.start_time) as next_event_bookings
    
FROM Events e
LEFT JOIN Categories c ON e.category_id = c.category_id
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
WHERE e.status = 'PUBLISHED'
GROUP BY e.event_id, e.title, c.name, e.category_id, e.start_time
ORDER BY revenue DESC;

-- =====================================================
-- 2. COHORT ANALYSIS - User Retention by Registration Month
-- =====================================================

WITH UserCohorts AS (
    SELECT 
        u.id,
        DATE_FORMAT(u.created_at, '%Y-%m') as cohort_month,
        u.created_at
    FROM Users u
),
BookingActivity AS (
    SELECT 
        b.user_id,
        DATE_FORMAT(b.created_at, '%Y-%m') as activity_month,
        COUNT(*) as bookings
    FROM Bookings b
    GROUP BY b.user_id, DATE_FORMAT(b.created_at, '%Y-%m')
)
SELECT 
    uc.cohort_month,
    COUNT(DISTINCT uc.id) as cohort_size,
    ba.activity_month,
    COUNT(DISTINCT ba.user_id) as active_users,
    COUNT(DISTINCT ba.user_id) * 100.0 / COUNT(DISTINCT uc.id) as retention_rate,
    PERIOD_DIFF(
        CAST(REPLACE(ba.activity_month, '-', '') AS UNSIGNED),
        CAST(REPLACE(uc.cohort_month, '-', '') AS UNSIGNED)
    ) as months_since_signup
FROM UserCohorts uc
LEFT JOIN BookingActivity ba ON uc.id = ba.user_id
GROUP BY uc.cohort_month, ba.activity_month
HAVING cohort_size > 0
ORDER BY uc.cohort_month, ba.activity_month;

-- =====================================================
-- 3. RECURSIVE CTE - Friend Network Depth Analysis
-- =====================================================

WITH RECURSIVE FriendNetwork AS (
    -- Base case: direct friends
    SELECT 
        f.user_id,
        f.friend_id,
        1 as depth,
        CAST(f.user_id AS CHAR(1000)) as path
    FROM Friendships f
    WHERE f.status = 'ACCEPTED' AND f.user_id = 18  -- Starting user
    
    UNION ALL
    
    -- Recursive case: friends of friends
    SELECT 
        fn.user_id,
        f.friend_id,
        fn.depth + 1,
        CONCAT(fn.path, '->', f.friend_id)
    FROM FriendNetwork fn
    JOIN Friendships f ON fn.friend_id = f.user_id
    WHERE f.status = 'ACCEPTED' 
      AND fn.depth < 3  -- Limit depth
      AND FIND_IN_SET(f.friend_id, REPLACE(fn.path, '->', ',')) = 0  -- Avoid cycles
)
SELECT 
    fn.depth,
    COUNT(DISTINCT fn.friend_id) as friends_at_depth,
    GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as friend_names
FROM FriendNetwork fn
JOIN Users u ON fn.friend_id = u.id
GROUP BY fn.depth
ORDER BY fn.depth;

-- =====================================================
-- 4. PIVOT TABLE - Revenue by Category and Month
-- =====================================================

SELECT 
    c.name as category,
    SUM(CASE WHEN MONTH(b.created_at) = 1 THEN tt.price ELSE 0 END) as Jan,
    SUM(CASE WHEN MONTH(b.created_at) = 2 THEN tt.price ELSE 0 END) as Feb,
    SUM(CASE WHEN MONTH(b.created_at) = 3 THEN tt.price ELSE 0 END) as Mar,
    SUM(CASE WHEN MONTH(b.created_at) = 4 THEN tt.price ELSE 0 END) as Apr,
    SUM(CASE WHEN MONTH(b.created_at) = 5 THEN tt.price ELSE 0 END) as May,
    SUM(CASE WHEN MONTH(b.created_at) = 6 THEN tt.price ELSE 0 END) as Jun,
    SUM(CASE WHEN MONTH(b.created_at) = 7 THEN tt.price ELSE 0 END) as Jul,
    SUM(CASE WHEN MONTH(b.created_at) = 8 THEN tt.price ELSE 0 END) as Aug,
    SUM(CASE WHEN MONTH(b.created_at) = 9 THEN tt.price ELSE 0 END) as Sep,
    SUM(CASE WHEN MONTH(b.created_at) = 10 THEN tt.price ELSE 0 END) as Oct,
    SUM(CASE WHEN MONTH(b.created_at) = 11 THEN tt.price ELSE 0 END) as Nov,
    SUM(CASE WHEN MONTH(b.created_at) = 12 THEN tt.price ELSE 0 END) as `Dec`,
    SUM(tt.price) as Total
FROM Categories c
LEFT JOIN Events e ON c.category_id = e.category_id
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
WHERE YEAR(b.created_at) = YEAR(NOW())
GROUP BY c.category_id, c.name
ORDER BY Total DESC;

-- =====================================================
-- 5. COMPLEX SUBQUERY - Top Performers in Each Category
-- =====================================================

SELECT 
    category,
    event_title,
    organizer,
    revenue,
    bookings,
    category_rank
FROM (
    SELECT 
        c.name as category,
        e.title as event_title,
        u.name as organizer,
        COALESCE(SUM(tt.price), 0) as revenue,
        COUNT(DISTINCT b.booking_id) as bookings,
        ROW_NUMBER() OVER (
            PARTITION BY c.category_id 
            ORDER BY COALESCE(SUM(tt.price), 0) DESC
        ) as category_rank
    FROM Events e
    JOIN Categories c ON e.category_id = c.category_id
    JOIN Users u ON e.organizer_id = u.id
    LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
    LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    WHERE e.status = 'PUBLISHED'
    GROUP BY c.category_id, c.name, e.event_id, e.title, u.name
) ranked_events
WHERE category_rank <= 3
ORDER BY category, category_rank;

-- =====================================================
-- 6. ADVANCED FILTERING - Multi-Criteria Event Search
-- =====================================================

SELECT 
    e.event_id,
    e.title,
    e.start_time,
    c.name as category,
    v.name as venue,
    v.city,
    MIN(tt.price) as min_price,
    MAX(tt.price) as max_price,
    SUM(tt.quantity - tt.sold_count) as available_tickets,
    COUNT(DISTINCT b.booking_id) as popularity,
    
    -- Relevance score based on multiple factors
    (
        -- Price match (closer to target = higher score)
        (100 - ABS(AVG(tt.price) - 1000)) * 0.3 +
        -- Availability score
        (SUM(tt.quantity - tt.sold_count) / NULLIF(SUM(tt.quantity), 0) * 100) * 0.2 +
        -- Popularity score
        (COUNT(DISTINCT b.booking_id) * 5) * 0.3 +
        -- Recency score (upcoming events score higher)
        (CASE 
            WHEN DATEDIFF(e.start_time, NOW()) BETWEEN 7 AND 30 THEN 100
            WHEN DATEDIFF(e.start_time, NOW()) BETWEEN 31 AND 60 THEN 80
            WHEN DATEDIFF(e.start_time, NOW()) BETWEEN 61 AND 90 THEN 60
            ELSE 40
        END) * 0.2
    ) as relevance_score
    
FROM Events e
JOIN Categories c ON e.category_id = c.category_id
JOIN Venues v ON e.venue_id = v.venue_id
LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'

WHERE 
    e.status = 'PUBLISHED'
    AND e.start_time > NOW()
    AND e.end_time > NOW()
    -- Price range filter
    AND EXISTS (
        SELECT 1 FROM TicketTypes tt2 
        WHERE tt2.event_id = e.event_id 
        AND tt2.price BETWEEN 500 AND 5000
    )
    -- Availability filter
    AND EXISTS (
        SELECT 1 FROM TicketTypes tt3
        WHERE tt3.event_id = e.event_id
        AND tt3.quantity > tt3.sold_count
    )
    -- Category filter (optional)
    AND (c.category_id IN (1, 2, 3) OR 1=1)  -- Replace with actual filter
    -- City filter (optional)
    AND (v.city IN ('Dhaka', 'Chittagong') OR 1=1)  -- Replace with actual filter
    -- Date range filter
    AND e.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 90 DAY)
    
GROUP BY e.event_id, e.title, e.start_time, c.name, v.name, v.city
HAVING available_tickets > 0
ORDER BY relevance_score DESC, popularity DESC
LIMIT 20;

-- =====================================================
-- 7. TIME SERIES ANALYSIS - Booking Patterns
-- =====================================================

WITH RECURSIVE DateSeries AS (
    SELECT DATE_SUB(CURDATE(), INTERVAL 90 DAY) as date
    UNION ALL
    SELECT DATE_ADD(date, INTERVAL 1 DAY)
    FROM DateSeries
    WHERE date < CURDATE()
),
DailyBookings AS (
    SELECT 
        DATE(created_at) as booking_date,
        COUNT(*) as bookings,
        SUM(CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END) as successful_bookings,
        AVG(CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END) as success_rate
    FROM Bookings
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    GROUP BY DATE(created_at)
)
SELECT 
    ds.date,
    DAYNAME(ds.date) as day_of_week,
    COALESCE(db.bookings, 0) as bookings,
    COALESCE(db.successful_bookings, 0) as successful_bookings,
    COALESCE(db.success_rate, 0) as success_rate,
    
    -- 7-day moving average
    AVG(COALESCE(db.bookings, 0)) OVER (
        ORDER BY ds.date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as booking_7day_avg,
    
    -- Week-over-week growth
    (COALESCE(db.bookings, 0) - LAG(COALESCE(db.bookings, 0), 7) OVER (ORDER BY ds.date)) * 100.0 /
    NULLIF(LAG(COALESCE(db.bookings, 0), 7) OVER (ORDER BY ds.date), 0) as wow_growth_pct
    
FROM DateSeries ds
LEFT JOIN DailyBookings db ON ds.date = db.booking_date
ORDER BY ds.date DESC;

-- =====================================================
-- 8. CUSTOMER SEGMENTATION - RFM Analysis
-- =====================================================

WITH CustomerMetrics AS (
    SELECT 
        b.user_id,
        MAX(b.created_at) as last_booking_date,
        COUNT(DISTINCT b.booking_id) as booking_frequency,
        SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END) as total_monetary_value,
        DATEDIFF(NOW(), MAX(b.created_at)) as days_since_last_booking
    FROM Bookings b
    JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    GROUP BY b.user_id
),
RFMScores AS (
    SELECT 
        user_id,
        days_since_last_booking,
        booking_frequency,
        total_monetary_value,
        
        -- Recency score (1-5, lower days = higher score)
        CASE 
            WHEN days_since_last_booking <= 30 THEN 5
            WHEN days_since_last_booking <= 60 THEN 4
            WHEN days_since_last_booking <= 90 THEN 3
            WHEN days_since_last_booking <= 180 THEN 2
            ELSE 1
        END as recency_score,
        
        -- Frequency score (1-5)
        CASE 
            WHEN booking_frequency >= 10 THEN 5
            WHEN booking_frequency >= 7 THEN 4
            WHEN booking_frequency >= 4 THEN 3
            WHEN booking_frequency >= 2 THEN 2
            ELSE 1
        END as frequency_score,
        
        -- Monetary score (1-5)
        CASE 
            WHEN total_monetary_value >= 10000 THEN 5
            WHEN total_monetary_value >= 5000 THEN 4
            WHEN total_monetary_value >= 2000 THEN 3
            WHEN total_monetary_value >= 500 THEN 2
            ELSE 1
        END as monetary_score
    FROM CustomerMetrics
)
SELECT 
    u.id,
    u.name,
    u.email,
    rfm.days_since_last_booking,
    rfm.booking_frequency,
    rfm.total_monetary_value,
    rfm.recency_score,
    rfm.frequency_score,
    rfm.monetary_score,
    (rfm.recency_score + rfm.frequency_score + rfm.monetary_score) as rfm_total,
    
    -- Customer segment
    CASE 
        WHEN rfm.recency_score >= 4 AND rfm.frequency_score >= 4 AND rfm.monetary_score >= 4 THEN 'Champions'
        WHEN rfm.recency_score >= 3 AND rfm.frequency_score >= 3 AND rfm.monetary_score >= 3 THEN 'Loyal Customers'
        WHEN rfm.recency_score >= 4 AND rfm.frequency_score <= 2 THEN 'New Customers'
        WHEN rfm.recency_score <= 2 AND rfm.frequency_score >= 3 THEN 'At Risk'
        WHEN rfm.recency_score <= 2 AND rfm.frequency_score <= 2 THEN 'Lost'
        ELSE 'Potential'
    END as customer_segment
    
FROM RFMScores rfm
JOIN Users u ON rfm.user_id = u.id
ORDER BY rfm_total DESC, total_monetary_value DESC;

-- =====================================================
-- 9. CORRELATION ANALYSIS - Sponsor Impact on Sales
-- =====================================================

SELECT 
    e.event_id,
    e.title,
    COUNT(DISTINCT s.sponsor_id) as sponsor_count,
    COALESCE(SUM(s.contribution_amount), 0) as sponsor_revenue,
    COUNT(DISTINCT b.booking_id) as ticket_sales,
    COALESCE(SUM(tt.price), 0) as ticket_revenue,
    
    -- Sponsor tier breakdown
    SUM(CASE WHEN s.tier = 'Gold' THEN 1 ELSE 0 END) as gold_sponsors,
    SUM(CASE WHEN s.tier = 'Silver' THEN 1 ELSE 0 END) as silver_sponsors,
    SUM(CASE WHEN s.tier = 'Bronze' THEN 1 ELSE 0 END) as bronze_sponsors,
    
    -- ROI metrics
    COALESCE(SUM(tt.price), 0) / NULLIF(COALESCE(SUM(s.contribution_amount), 0), 0) as revenue_per_sponsor_dollar,
    COUNT(DISTINCT b.booking_id) / NULLIF(COUNT(DISTINCT s.sponsor_id), 0) as tickets_per_sponsor
    
FROM Events e
LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
WHERE e.status = 'PUBLISHED'
GROUP BY e.event_id, e.title
HAVING sponsor_count > 0
ORDER BY revenue_per_sponsor_dollar DESC;

-- =====================================================
-- 10. PREDICTIVE QUERY - Event Success Probability
-- =====================================================

SELECT 
    e.event_id,
    e.title,
    e.start_time,
    c.name as category,
    
    -- Historical performance of similar events
    (
        SELECT AVG(booking_count)
        FROM (
            SELECT COUNT(DISTINCT b2.booking_id) as booking_count
            FROM Events e2
            LEFT JOIN Bookings b2 ON e2.event_id = b2.event_id AND b2.status != 'CANCELLED'
            WHERE e2.category_id = e.category_id
              AND e2.status = 'COMPLETED'
              AND e2.event_id != e.event_id
            GROUP BY e2.event_id
        ) similar_events
    ) as avg_similar_event_bookings,
    
    -- Current performance
    COUNT(DISTINCT b.booking_id) as current_bookings,
    DATEDIFF(e.start_time, NOW()) as days_until_event,
    
    -- Success probability score
    (
        -- Category performance weight (40%)
        (SELECT AVG(booking_count) * 0.4
         FROM (
             SELECT COUNT(DISTINCT b3.booking_id) as booking_count
             FROM Events e3
             LEFT JOIN Bookings b3 ON e3.event_id = b3.event_id
             WHERE e3.category_id = e.category_id AND e3.status = 'COMPLETED'
             GROUP BY e3.event_id
         ) cat_events
        ) +
        
        -- Current booking momentum (30%)
        (COUNT(DISTINCT b.booking_id) / NULLIF(DATEDIFF(NOW(), e.created_at), 0) * 
         DATEDIFF(e.start_time, NOW()) * 0.3) +
        
        -- Sponsor support (20%)
        (COUNT(DISTINCT s.sponsor_id) * 10 * 0.2) +
        
        -- Social engagement (10%)
        ((COUNT(DISTINCT pl.like_id) + COUNT(DISTINCT pc.comment_id)) * 0.1)
        
    ) as success_probability_score,
    
    -- Predicted final bookings
    CASE 
        WHEN DATEDIFF(e.start_time, NOW()) > 0 THEN
            COUNT(DISTINCT b.booking_id) + 
            (COUNT(DISTINCT b.booking_id) / NULLIF(DATEDIFF(NOW(), e.created_at), 0) * 
             DATEDIFF(e.start_time, NOW()))
        ELSE COUNT(DISTINCT b.booking_id)
    END as predicted_final_bookings
    
FROM Events e
JOIN Categories c ON e.category_id = c.category_id
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
LEFT JOIN PostLikes pl ON ep.post_id = pl.post_id
LEFT JOIN PostComments pc ON ep.post_id = pc.post_id
WHERE e.status = 'PUBLISHED' AND e.start_time > NOW()
GROUP BY e.event_id, e.title, e.start_time, c.name, e.category_id, e.created_at
ORDER BY success_probability_score DESC;

-- =====================================================
-- COMPLEX QUERIES COMPLETE
-- All filtering, aggregation, and business logic in SQL
-- =====================================================
SELECT 'Complex queries ready for execution!' as Status;
