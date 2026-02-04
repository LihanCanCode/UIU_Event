# 🔐 Admin Panel Access Guide

## Admin Login Credentials

### Primary Admin Account
- **Email:** `admin@eventkoi.com`
- **Password:** `admin123`
- **Role:** Admin

### Secondary Admin Account
- **Email:** `sarah.admin@eventkoi.com`
- **Password:** `admin123` (same password set)

---

## 📍 How to Access Admin Panel

### Step 1: Login
1. Go to: **http://localhost:3000/login**
2. Enter admin credentials:
   - Email: `admin@eventkoi.com`
   - Password: `admin123`
3. Click "Login"

### Step 2: Access Admin Dashboard
After successful login, navigate to:
- **http://localhost:3000/dashboard/admin**

Or from the regular dashboard, if there's an admin link.

---

## 🎛️ Admin Panel Features

Your admin panel includes:

### 1. **Dashboard Overview**
- Total users count
- Total events count
- Pending verification requests
- System statistics

### 2. **User Management**
- View all users
- Verify organizer accounts
- Delete users
- Manage user roles

### 3. **Event Management**
- View all events
- Monitor event status
- Event analytics

### 4. **Verification Requests**
- Approve/reject organizer verification requests
- Review submitted documents
- Manage role changes

### 5. **Analytics** (Database-Heavy Features)
- Event performance metrics
- User engagement statistics
- Revenue analysis
- Category performance
- Organizer rankings
- Booking trends
- Sponsor ROI

---

## 🔧 Admin API Endpoints

The admin panel uses these database-heavy API endpoints:

```
GET  /api/admin/requests          - Get pending verification requests
POST /api/admin/verify-user       - Verify a user account
GET  /api/admin/stats             - Get dashboard statistics
GET  /api/admin/users             - Get all users
GET  /api/admin/events            - Get all events
GET  /api/analytics?type=...      - Get advanced analytics
```

---

## 📊 Database Queries Used by Admin Panel

The admin panel demonstrates **database-heavy** operations:

### User Statistics
```sql
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'organizer' THEN 1 END) as organizers,
    COUNT(CASE WHEN is_verified = FALSE THEN 1 END) as pending_verifications
FROM Users;
```

### Event Analytics
```sql
SELECT 
    e.event_id,
    e.title,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    SUM(tt.price) as revenue,
    e.status
FROM Events e
LEFT JOIN Bookings b ON e.event_id = b.event_id
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
GROUP BY e.event_id;
```

### Revenue Analysis (Uses Views)
```sql
SELECT * FROM vw_RevenueReport;
SELECT * FROM vw_OrganizerPerformance;
SELECT * FROM vw_PopularEvents;
```

---

## 🚀 Quick Start

```bash
# 1. Make sure your app is running
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Login with admin credentials
Email: admin@eventkoi.com
Password: admin123

# 4. Navigate to admin panel
http://localhost:3000/dashboard/admin
```

---

## 🔒 Security Notes

- Admin accounts have full access to all system features
- Only users with `role = 'admin'` can access the admin panel
- The admin panel checks user role on page load
- Non-admin users are redirected to regular dashboard

---

## 📝 Admin Tasks You Can Perform

### ✅ User Verification
1. Go to "Verification Requests" tab
2. Review organizer applications
3. Click "Approve" or "Reject"
4. User receives notification

### ✅ User Management
1. View all registered users
2. See user roles and verification status
3. Delete problematic accounts
4. Monitor user activity

### ✅ Event Monitoring
1. View all events (published, draft, cancelled)
2. See event organizers
3. Monitor event performance
4. Track booking statistics

### ✅ Analytics Review
1. Access advanced analytics
2. View revenue trends
3. Analyze category performance
4. Track organizer rankings
5. Monitor booking patterns

---

## 🎯 Testing the Admin Panel

### Test Scenario 1: Verify an Organizer
```
1. Login as admin
2. Go to admin panel
3. Check "Verification Requests"
4. Approve a pending organizer
5. Verify the user can now create events
```

### Test Scenario 2: View Analytics
```
1. Login as admin
2. Navigate to Analytics tab
3. Select different report types:
   - Event Performance
   - User Engagement
   - Revenue Analysis
   - Organizer Rankings
4. Review database-generated insights
```

### Test Scenario 3: User Management
```
1. Login as admin
2. Go to Users tab
3. View all registered users
4. Check user roles and verification status
5. Test delete functionality (be careful!)
```

---

## 💡 Pro Tips

1. **Database-Heavy Approach**: All analytics are computed in SQL, not JavaScript
2. **Real-time Data**: Admin panel fetches live data from database
3. **Complex Queries**: Uses views, stored procedures, and advanced SQL
4. **Performance**: Indexed queries for fast dashboard loading

---

**Your admin panel is ready to use!** 🎉

Access it at: **http://localhost:3000/dashboard/admin**
