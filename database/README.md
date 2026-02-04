# Event Koi - Database Setup Guide

This directory contains all SQL files for setting up and managing the Event Koi database.

## 📁 File Structure

```
database/
├── 01_schema.sql              # Complete database schema with tables, indexes, constraints
├── 02_procedures_triggers.sql # Stored procedures and triggers for automation
├── 03_views_indexes.sql       # Views and performance indexes
├── 04_seed.sql                # Sample data (50 users, 30 events, 200+ bookings)
├── 05_complex_queries.sql     # Advanced SQL queries demonstrating RDBMS power
├── 06_advanced_features.sql   # Partitioning, full-text search, JSON, spatial queries
├── 07_performance_optimization.sql # Query optimization, monitoring, caching
└── README.md                  # This file
```

## 🚀 Setup Instructions

### 1. Create Database
```bash
mysql -u root -p
CREATE DATABASE event_koi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_koi;
```

### 2. Execute SQL Files in Order
```bash
# Schema (tables, indexes, constraints)
mysql -u root -p event_koi < 01_schema.sql

# Stored procedures and triggers
mysql -u root -p event_koi < 02_procedures_triggers.sql

# Views and performance indexes
mysql -u root -p event_koi < 03_views_indexes.sql

# Sample data
mysql -u root -p event_koi < 04_seed.sql

# Advanced features (optional)
mysql -u root -p event_koi < 06_advanced_features.sql

# Performance optimization (optional)
mysql -u root -p event_koi < 07_performance_optimization.sql
```

### 3. Test Complex Queries
```bash
# Run individual queries from 05_complex_queries.sql
mysql -u root -p event_koi < 05_complex_queries.sql
```

## 📊 What Each File Contains

### **01_schema.sql**
- ✅ 13 normalized tables (3NF compliance)
- ✅ Foreign key constraints
- ✅ Check constraints
- ✅ Composite indexes
- ✅ Full-text search indexes
- ✅ Spatial indexes (for venue locations)

**Tables:**
- Users, Categories, Venues, Events
- TicketTypes, Bookings, Sponsors
- EventPosts, PostLikes, PostComments
- Friendships, Messages, Notifications

### **02_procedures_triggers.sql**
- ✅ 4 Stored Procedures:
  - `sp_BookTicket` - Transaction-safe ticket booking
  - `sp_CancelBooking` - Refund calculation & cancellation
  - `sp_GetEventStats` - Event performance metrics
  - `sp_GetUserActivity` - User engagement summary

- ✅ 7 Triggers:
  - Auto-notifications on bookings
  - Event update notifications
  - Friendship acceptance alerts
  - Message notifications
  - Sponsor approval notifications
  - Validation triggers

### **03_views_indexes.sql**
- ✅ 7 Materialized Views:
  - `vw_EventSummary` - Complete event overview
  - `vw_UserDashboard` - User activity dashboard
  - `vw_PopularEvents` - Trending events
  - `vw_RevenueReport` - Financial analytics
  - `vw_OrganizerPerformance` - Organizer rankings
  - `vw_UpcomingEvents` - Future events with availability
  - `vw_SocialNetwork` - Social graph analysis

- ✅ Performance Indexes:
  - Composite indexes for common queries
  - Covering indexes for specific use cases
  - Partial indexes for filtered queries

### **04_seed.sql**
- ✅ 50 Users (2 Admins, 15 Organizers, 33 Attendees)
- ✅ 15 Categories
- ✅ 20 Venues across Bangladesh
- ✅ 30 Events (20 Future, 5 Past, 5 Draft)
- ✅ 90+ Ticket Types
- ✅ 200+ Bookings
- ✅ 40 Sponsors
- ✅ 50 Event Posts
- ✅ 100+ Likes & Comments
- ✅ 60+ Friendships
- ✅ 100+ Messages
- ✅ 150+ Notifications

### **05_complex_queries.sql**
- ✅ 10 Advanced SQL Queries:
  1. **Window Functions** - Rankings, running totals, moving averages
  2. **Cohort Analysis** - User retention tracking
  3. **Recursive CTEs** - Friend network depth analysis
  4. **Pivot Tables** - Revenue by category/month
  5. **Complex Subqueries** - Top performers per category
  6. **Multi-Criteria Filtering** - Advanced event search with relevance scoring
  7. **Time Series Analysis** - Booking patterns & trends
  8. **RFM Segmentation** - Customer segmentation (Recency, Frequency, Monetary)
  9. **Correlation Analysis** - Sponsor impact on sales
  10. **Predictive Analytics** - Event success probability

### **06_advanced_features.sql**
- ✅ **Table Partitioning:**
  - Range partitioning by year
  - Hash partitioning for distribution
  
- ✅ **Full-Text Search:**
  - Natural language mode
  - Boolean mode with operators
  - Query expansion
  - Relevance scoring
  
- ✅ **JSON Operations:**
  - Store complex data structures
  - Query JSON fields
  - JSON aggregations
  - Extract nested values
  
- ✅ **Spatial Queries:**
  - Distance calculations (Haversine formula)
  - Geo-location based search
  - Find events within radius
  
- ✅ **Advanced Features:**
  - Materialized view simulation
  - Dynamic pivot tables
  - Hierarchical data (nested comments)
  - Temporal queries
  - Multi-level aggregations (ROLLUP, GROUPING SETS)

### **07_performance_optimization.sql**
- ✅ **Query Analysis:**
  - EXPLAIN ANALYZE
  - Query profiling
  - Execution plan analysis
  
- ✅ **Index Optimization:**
  - Index usage analysis
  - Find unused indexes
  - Detect duplicate indexes
  - Covering indexes
  
- ✅ **Query Optimization:**
  - Subquery optimization
  - JOIN optimization
  - Batch operations
  - Query rewrite techniques
  
- ✅ **Caching:**
  - Query result caching
  - Summary table caching
  - Cache invalidation
  
- ✅ **Monitoring:**
  - Table size analysis
  - Slow query detection
  - Lock contention analysis
  - Connection monitoring
  
- ✅ **Maintenance:**
  - Partition management
  - Statistics updates
  - Table optimization
  - Backup procedures

## 🎯 Key RDBMS Features Demonstrated

### **Normalization**
- All tables in 3NF (Third Normal Form)
- No redundant data
- Proper foreign key relationships

### **Constraints**
- Primary Keys
- Foreign Keys with CASCADE
- UNIQUE constraints
- CHECK constraints
- NOT NULL constraints

### **Indexes**
- B-Tree indexes (default)
- Full-text indexes (for search)
- Spatial indexes (for geo-queries)
- Composite indexes
- Partial indexes

### **Advanced SQL**
- Window Functions (`RANK`, `DENSE_RANK`, `ROW_NUMBER`, `PARTITION BY`)
- Common Table Expressions (CTEs)
- Recursive CTEs
- Subqueries (correlated and non-correlated)
- Aggregations (`GROUP BY`, `HAVING`)
- Joins (INNER, LEFT, RIGHT, CROSS)
- Set Operations (`UNION`, `INTERSECT`, `EXCEPT`)

### **Stored Procedures**
- Transaction management
- Error handling
- Business logic encapsulation
- Output parameters

### **Triggers**
- BEFORE triggers (validation)
- AFTER triggers (automation)
- Row-level triggers
- Cascading operations

### **Views**
- Complex aggregations
- Pre-computed metrics
- Security (data hiding)
- Query simplification

## 📈 Performance Optimization

### **Indexing Strategy**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_events_status_start ON Events(status, start_time);
CREATE INDEX idx_bookings_user_status ON Bookings(user_id, status);

-- Covering indexes
CREATE INDEX idx_tickettypes_event_price ON TicketTypes(event_id, price, quantity, sold_count);

-- Partial indexes
CREATE INDEX idx_active_bookings ON Bookings(event_id, user_id) WHERE status = 'VALID';
```

### **Query Optimization**
- All filtering in SQL (not in application code)
- Use of indexes for WHERE clauses
- Proper JOIN order
- LIMIT clauses for pagination
- Avoiding SELECT *

## 🔒 Security Features

- Password hashing (handled in application)
- Role-based access control (ENUM roles)
- Foreign key constraints prevent orphaned records
- Triggers validate business rules
- Stored procedures encapsulate sensitive logic

## 📊 Sample Queries

### Get Event Performance
```sql
CALL sp_GetEventStats(1);
```

### Book a Ticket
```sql
CALL sp_BookTicket(18, 1, 1, @booking_id, @unique_code, @status);
SELECT @booking_id, @unique_code, @status;
```

### Get Popular Events
```sql
SELECT * FROM vw_PopularEvents LIMIT 10;
```

### Revenue Analysis
```sql
SELECT * FROM vw_RevenueReport;
```

## 🎓 Learning Outcomes

This database demonstrates:
- ✅ Professional database design
- ✅ Advanced SQL techniques
- ✅ Performance optimization
- ✅ Business logic in database
- ✅ Data integrity & constraints
- ✅ Scalable architecture

## 📝 Notes

- All timestamps use `TIMESTAMP` for automatic timezone handling
- Character set: `utf8mb4` (supports emojis and international characters)
- Collation: `utf8mb4_unicode_ci` (case-insensitive)
- Engine: `InnoDB` (supports transactions and foreign keys)

## 🔧 Maintenance

### Backup
```bash
mysqldump -u root -p event_koi > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -u root -p event_koi < backup_20250113.sql
```

### Analyze Tables
```sql
ANALYZE TABLE Events, Bookings, Users;
```

### Optimize Tables
```sql
OPTIMIZE TABLE Events, Bookings, Users;
```

---

**This database showcases enterprise-level RDBMS implementation with ALL business logic handled in the database layer!** 🚀
