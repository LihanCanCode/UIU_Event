import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * ADVANCED ANALYTICS API
 * Demonstrates database-heavy operations with complex SQL queries
 * All filtering, aggregation, and business logic handled in database
 */

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');

    try {
        let result;

        switch (reportType) {
            case 'event_performance':
                result = await getEventPerformanceReport();
                break;
            case 'user_engagement':
                result = await getUserEngagementReport();
                break;
            case 'revenue_analysis':
                result = await getRevenueAnalysis();
                break;
            case 'popular_categories':
                result = await getPopularCategories();
                break;
            case 'organizer_rankings':
                result = await getOrganizerRankings();
                break;
            case 'booking_trends':
                result = await getBookingTrends();
                break;
            case 'sponsor_roi':
                result = await getSponsorROI();
                break;
            case 'social_network':
                result = await getSocialNetworkAnalysis();
                break;
            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}

/**
 * 1. EVENT PERFORMANCE REPORT
 * Complex query with multiple JOINs, aggregations, and calculated fields
 */
async function getEventPerformanceReport() {
    const query = `
        SELECT 
            e.event_id,
            e.title,
            e.status,
            c.name as category,
            v.name as venue,
            v.city,
            u.name as organizer,
            
            -- Ticket Statistics
            COUNT(DISTINCT b.booking_id) as total_bookings,
            COUNT(DISTINCT CASE WHEN b.status = 'VALID' THEN b.booking_id END) as active_bookings,
            COUNT(DISTINCT CASE WHEN b.status = 'USED' THEN b.booking_id END) as used_tickets,
            COUNT(DISTINCT CASE WHEN b.status = 'CANCELLED' THEN b.booking_id END) as cancelled_bookings,
            
            -- Revenue Calculations
            COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as gross_revenue,
            COALESCE(SUM(CASE WHEN b.status = 'CANCELLED' THEN b.refund_amount ELSE 0 END), 0) as total_refunds,
            COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) - 
            COALESCE(SUM(CASE WHEN b.status = 'CANCELLED' THEN b.refund_amount ELSE 0 END), 0) as net_revenue,
            
            -- Capacity & Utilization
            SUM(tt.quantity) as total_capacity,
            COUNT(DISTINCT b.booking_id) * 100.0 / NULLIF(SUM(tt.quantity), 0) as occupancy_rate,
            
            -- Engagement Metrics
            COUNT(DISTINCT ep.post_id) as total_posts,
            COUNT(DISTINCT pl.like_id) as total_likes,
            COUNT(DISTINCT pc.comment_id) as total_comments,
            COUNT(DISTINCT s.sponsor_id) as total_sponsors,
            COALESCE(SUM(s.contribution_amount), 0) as sponsor_revenue,
            
            -- Time-based metrics
            DATEDIFF(e.start_time, NOW()) as days_until_event,
            DATEDIFF(e.end_time, e.start_time) as event_duration_days
            
        FROM Events e
        LEFT JOIN Categories c ON e.category_id = c.category_id
        LEFT JOIN Venues v ON e.venue_id = v.venue_id
        LEFT JOIN Users u ON e.organizer_id = u.id
        LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
        LEFT JOIN Bookings b ON e.event_id = b.event_id
        LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
        LEFT JOIN PostLikes pl ON ep.post_id = pl.post_id
        LEFT JOIN PostComments pc ON ep.post_id = pc.post_id
        LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
        
        WHERE e.status = 'PUBLISHED'
        GROUP BY e.event_id, e.title, e.status, c.name, v.name, v.city, u.name, e.start_time, e.end_time
        ORDER BY net_revenue DESC, total_bookings DESC
        LIMIT 50
    `;

    const [rows] = await pool.query(query);
    return rows;
}

/**
 * 2. USER ENGAGEMENT REPORT
 * Analyzes user activity patterns with window functions
 */
async function getUserEngagementReport() {
    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.role,
            
            -- Booking Activity
            COUNT(DISTINCT b.booking_id) as total_bookings,
            COUNT(DISTINCT b.event_id) as unique_events_attended,
            COALESCE(SUM(tt.price), 0) as total_spent,
            
            -- Social Activity
            COUNT(DISTINCT f1.friendship_id) + COUNT(DISTINCT f2.friendship_id) as total_friends,
            COUNT(DISTINCT m1.message_id) + COUNT(DISTINCT m2.message_id) as total_messages,
            COUNT(DISTINCT pl.like_id) as posts_liked,
            COUNT(DISTINCT pc.comment_id) as comments_made,
            
            -- Engagement Score (weighted formula)
            (
                COUNT(DISTINCT b.booking_id) * 10 +
                COUNT(DISTINCT pl.like_id) * 2 +
                COUNT(DISTINCT pc.comment_id) * 5 +
                (COUNT(DISTINCT f1.friendship_id) + COUNT(DISTINCT f2.friendship_id)) * 3 +
                (COUNT(DISTINCT m1.message_id) + COUNT(DISTINCT m2.message_id)) * 1
            ) as engagement_score,
            
            -- Ranking within role
            RANK() OVER (
                PARTITION BY u.role 
                ORDER BY COUNT(DISTINCT b.booking_id) DESC
            ) as booking_rank_in_role,
            
            -- Last activity
            GREATEST(
                COALESCE(MAX(b.created_at), '1970-01-01'),
                COALESCE(MAX(m1.created_at), '1970-01-01'),
                COALESCE(MAX(pc.created_at), '1970-01-01')
            ) as last_activity_date
            
        FROM Users u
        LEFT JOIN Bookings b ON u.id = b.user_id
        LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
        LEFT JOIN Friendships f1 ON u.id = f1.user_id AND f1.status = 'ACCEPTED'
        LEFT JOIN Friendships f2 ON u.id = f2.friend_id AND f2.status = 'ACCEPTED'
        LEFT JOIN Messages m1 ON u.id = m1.sender_id
        LEFT JOIN Messages m2 ON u.id = m2.receiver_id
        LEFT JOIN PostLikes pl ON u.id = pl.user_id
        LEFT JOIN PostComments pc ON u.id = pc.user_id
        
        WHERE u.role IN ('attendee', 'organizer')
        GROUP BY u.id, u.name, u.email, u.role
        HAVING engagement_score > 0
        ORDER BY engagement_score DESC
        LIMIT 100
    `;

    const [rows] = await pool.query(query);
    return rows;
}

/**
 * 3. REVENUE ANALYSIS
 * Financial breakdown with running totals and growth rates
 */
async function getRevenueAnalysis() {
    const query = `
        WITH MonthlyRevenue AS (
            SELECT 
                DATE_FORMAT(b.created_at, '%Y-%m') as month,
                COUNT(DISTINCT b.booking_id) as bookings,
                SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END) as revenue,
                SUM(CASE WHEN b.status = 'CANCELLED' THEN b.refund_amount ELSE 0 END) as refunds,
                COUNT(DISTINCT b.user_id) as unique_customers
            FROM Bookings b
            JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
            WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
        )
        SELECT 
            month,
            bookings,
            revenue,
            refunds,
            revenue - refunds as net_revenue,
            unique_customers,
            revenue / NULLIF(bookings, 0) as avg_ticket_price,
            
            -- Running totals
            SUM(revenue) OVER (ORDER BY month) as cumulative_revenue,
            
            -- Month-over-month growth
            (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 / 
            NULLIF(LAG(revenue) OVER (ORDER BY month), 0) as revenue_growth_pct,
            
            -- Moving average (3-month)
            AVG(revenue) OVER (
                ORDER BY month 
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) as revenue_3month_avg
            
        FROM MonthlyRevenue
        ORDER BY month DESC
    `;

    const [rows] = await pool.query(query);
    return rows;
}

/**
 * 4. POPULAR CATEGORIES
 * Category performance with comparative analysis
 */
async function getPopularCategories() {
    const query = `
        SELECT 
            c.category_id,
            c.name as category_name,
            
            -- Event counts
            COUNT(DISTINCT e.event_id) as total_events,
            COUNT(DISTINCT CASE WHEN e.status = 'PUBLISHED' THEN e.event_id END) as published_events,
            COUNT(DISTINCT CASE WHEN e.start_time > NOW() THEN e.event_id END) as upcoming_events,
            
            -- Booking metrics
            COUNT(DISTINCT b.booking_id) as total_bookings,
            COUNT(DISTINCT b.user_id) as unique_attendees,
            COALESCE(SUM(tt.price), 0) as total_revenue,
            
            -- Average metrics
            AVG(tt.price) as avg_ticket_price,
            COUNT(DISTINCT b.booking_id) * 1.0 / NULLIF(COUNT(DISTINCT e.event_id), 0) as avg_bookings_per_event,
            
            -- Market share
            COUNT(DISTINCT b.booking_id) * 100.0 / (
                SELECT COUNT(*) FROM Bookings
            ) as market_share_pct,
            
            -- Engagement
            COUNT(DISTINCT ep.post_id) as total_posts,
            COUNT(DISTINCT pl.like_id) as total_likes,
            COUNT(DISTINCT s.sponsor_id) as total_sponsors,
            
            -- Popularity score
            (
                COUNT(DISTINCT b.booking_id) * 5 +
                COUNT(DISTINCT pl.like_id) * 2 +
                COUNT(DISTINCT s.sponsor_id) * 10
            ) as popularity_score
            
        FROM Categories c
        LEFT JOIN Events e ON c.category_id = e.category_id
        LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
        LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
        LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
        LEFT JOIN PostLikes pl ON ep.post_id = pl.post_id
        LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
        
        GROUP BY c.category_id, c.name
        ORDER BY popularity_score DESC, total_revenue DESC
    `;

    const [rows] = await pool.query(query);
    return rows;
}

/**
 * 5. ORGANIZER RANKINGS
 * Comprehensive organizer performance metrics
 */
async function getOrganizerRankings() {
    const query = `
        SELECT 
            u.id as organizer_id,
            u.name as organizer_name,
            u.email,
            u.is_verified,
            
            -- Event metrics
            COUNT(DISTINCT e.event_id) as total_events,
            COUNT(DISTINCT CASE WHEN e.status = 'PUBLISHED' THEN e.event_id END) as published_events,
            COUNT(DISTINCT CASE WHEN e.start_time > NOW() THEN e.event_id END) as upcoming_events,
            
            -- Financial metrics
            COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as total_revenue,
            COALESCE(AVG(tt.price), 0) as avg_ticket_price,
            COUNT(DISTINCT b.booking_id) as total_tickets_sold,
            
            -- Audience reach
            COUNT(DISTINCT b.user_id) as unique_attendees,
            COUNT(DISTINCT b.booking_id) * 1.0 / NULLIF(COUNT(DISTINCT e.event_id), 0) as avg_tickets_per_event,
            
            -- Sponsorship
            COUNT(DISTINCT s.sponsor_id) as total_sponsors,
            COALESCE(SUM(s.contribution_amount), 0) as sponsor_revenue,
            
            -- Engagement
            COUNT(DISTINCT ep.post_id) as posts_created,
            COUNT(DISTINCT pl.like_id) as likes_received,
            COUNT(DISTINCT pc.comment_id) as comments_received,
            
            -- Quality metrics
            COUNT(DISTINCT CASE WHEN b.status = 'CANCELLED' THEN b.booking_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT b.booking_id), 0) as cancellation_rate,
            
            -- Overall score
            (
                COUNT(DISTINCT b.booking_id) * 10 +
                COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) / 1000 +
                COUNT(DISTINCT s.sponsor_id) * 50 +
                COUNT(DISTINCT pl.like_id) * 2
            ) as organizer_score,
            
            -- Ranking
            DENSE_RANK() OVER (ORDER BY COUNT(DISTINCT b.booking_id) DESC) as sales_rank,
            DENSE_RANK() OVER (ORDER BY COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) DESC) as revenue_rank
            
        FROM Users u
        LEFT JOIN Events e ON u.id = e.organizer_id
        LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
        LEFT JOIN Bookings b ON e.event_id = b.event_id
        LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
        LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
        LEFT JOIN PostLikes pl ON ep.post_id = pl.post_id
        LEFT JOIN PostComments pc ON ep.post_id = pc.post_id
        
        WHERE u.role = 'organizer'
        GROUP BY u.id, u.name, u.email, u.is_verified
        ORDER BY organizer_score DESC
        LIMIT 50
    `;

    const [rows] = await pool.query(query);
    return rows;
}

/**
 * 6. BOOKING TRENDS
 * Time-series analysis of booking patterns
 */
async function getBookingTrends() {
    const query = `
        SELECT 
            DATE(b.created_at) as booking_date,
            DAYNAME(b.created_at) as day_of_week,
            HOUR(b.created_at) as hour_of_day,
            
            COUNT(*) as total_bookings,
            COUNT(DISTINCT b.user_id) as unique_users,
            COUNT(DISTINCT b.event_id) as unique_events,
            
            SUM(tt.price) as revenue,
            AVG(tt.price) as avg_ticket_price,
            
            -- Status breakdown
            SUM(CASE WHEN b.status = 'VALID' THEN 1 ELSE 0 END) as valid_bookings,
            SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
            SUM(CASE WHEN b.status = 'USED' THEN 1 ELSE 0 END) as used_bookings,
            
            -- Cumulative metrics
            SUM(COUNT(*)) OVER (ORDER BY DATE(b.created_at)) as cumulative_bookings,
            
            -- Moving averages
            AVG(COUNT(*)) OVER (
                ORDER BY DATE(b.created_at)
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as booking_7day_avg
            
        FROM Bookings b
        JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
        WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY DATE(b.created_at), DAYNAME(b.created_at), HOUR(b.created_at)
        ORDER BY booking_date DESC, hour_of_day DESC
        LIMIT 1000
    `;

    const [rows] = await pool.query(query);
    return rows;
}

/**
 * 7. SPONSOR ROI ANALYSIS
 * Sponsorship effectiveness metrics
 */
async function getSponsorROI() {
    const query = `
        SELECT 
            s.sponsor_id,
            s.name as sponsor_name,
            s.tier,
            s.contribution_amount,
            s.status,
            e.title as event_title,
            c.name as event_category,
            
            -- Event performance
            COUNT(DISTINCT b.booking_id) as event_bookings,
            COUNT(DISTINCT b.user_id) as event_attendees,
            COALESCE(SUM(tt.price), 0) as event_revenue,
            
            -- Visibility metrics
            COUNT(DISTINCT ep.post_id) as event_posts,
            COUNT(DISTINCT pl.like_id) as total_likes,
            COUNT(DISTINCT pc.comment_id) as total_comments,
            
            -- ROI calculations
            COUNT(DISTINCT b.user_id) * 1.0 / NULLIF(s.contribution_amount, 0) as attendees_per_dollar,
            (COUNT(DISTINCT pl.like_id) + COUNT(DISTINCT pc.comment_id)) * 1.0 / 
            NULLIF(s.contribution_amount, 0) as engagement_per_dollar,
            
            -- Sponsor value score
            (
                COUNT(DISTINCT b.user_id) * 100 +
                COUNT(DISTINCT pl.like_id) * 10 +
                COUNT(DISTINCT pc.comment_id) * 20
            ) * 1.0 / NULLIF(s.contribution_amount, 0) as sponsor_value_score
            
        FROM Sponsors s
        JOIN Events e ON s.event_id = e.event_id
        LEFT JOIN Categories c ON e.category_id = c.category_id
        LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
        LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
        LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
        LEFT JOIN PostLikes pl ON ep.post_id = pl.post_id
        LEFT JOIN PostComments pc ON ep.post_id = pc.post_id
        
        WHERE s.status = 'APPROVED'
        GROUP BY s.sponsor_id, s.name, s.tier, s.contribution_amount, s.status, e.title, c.name
        ORDER BY sponsor_value_score DESC
        LIMIT 100
    `;

    const [rows] = await pool.query(query);
    return rows;
}

/**
 * 8. SOCIAL NETWORK ANALYSIS
 * Friend network patterns and influence
 */
async function getSocialNetworkAnalysis() {
    const query = `
        WITH UserConnections AS (
            SELECT 
                u.id,
                u.name,
                COUNT(DISTINCT f1.friendship_id) + COUNT(DISTINCT f2.friendship_id) as friend_count,
                COUNT(DISTINCT m1.message_id) + COUNT(DISTINCT m2.message_id) as message_count
            FROM Users u
            LEFT JOIN Friendships f1 ON u.id = f1.user_id AND f1.status = 'ACCEPTED'
            LEFT JOIN Friendships f2 ON u.id = f2.friend_id AND f2.status = 'ACCEPTED'
            LEFT JOIN Messages m1 ON u.id = m1.sender_id
            LEFT JOIN Messages m2 ON u.id = m2.receiver_id
            GROUP BY u.id, u.name
        )
        SELECT 
            uc.id,
            uc.name,
            uc.friend_count,
            uc.message_count,
            
            -- Network influence
            COUNT(DISTINCT b.booking_id) as bookings_made,
            COUNT(DISTINCT pl.like_id) as likes_given,
            COUNT(DISTINCT pc.comment_id) as comments_made,
            
            -- Influence score
            (
                uc.friend_count * 10 +
                uc.message_count * 2 +
                COUNT(DISTINCT pl.like_id) * 3 +
                COUNT(DISTINCT pc.comment_id) * 5
            ) as influence_score,
            
            -- Network tier
            CASE 
                WHEN uc.friend_count >= 20 THEN 'Super Connector'
                WHEN uc.friend_count >= 10 THEN 'Active Networker'
                WHEN uc.friend_count >= 5 THEN 'Social'
                ELSE 'Casual'
            END as network_tier,
            
            -- Ranking
            DENSE_RANK() OVER (ORDER BY uc.friend_count DESC) as network_rank
            
        FROM UserConnections uc
        LEFT JOIN Bookings b ON uc.id = b.user_id
        LEFT JOIN PostLikes pl ON uc.id = pl.user_id
        LEFT JOIN PostComments pc ON uc.id = pc.user_id
        
        GROUP BY uc.id, uc.name, uc.friend_count, uc.message_count
        HAVING uc.friend_count > 0
        ORDER BY influence_score DESC
        LIMIT 100
    `;

    const [rows] = await pool.query(query);
    return rows;
}
