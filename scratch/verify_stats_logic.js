const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function verifyStats() {
    try {
        const userId = 1; // Admin Master usually has ID 1 in seed data
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'event_koi'
        });
        
        console.log(`Checking stats for user ${userId}...`);
        
        const [organizedRows] = await connection.query(
            'SELECT COUNT(*) as count FROM Events WHERE organizer_id = ?',
            [userId]
        );
        const organizedCount = (organizedRows as any)[0].count;

        const [purchasedRows] = await connection.query(
            'SELECT COUNT(*) as count FROM Bookings WHERE user_id = ?',
            [userId]
        );
        const purchasedCount = (purchasedRows as any)[0].count;
        
        console.log(`Real DB values: Organized: ${organizedCount}, Purchased: ${purchasedCount}`);
        
        await connection.end();
    } catch (err) {
        console.error('Verification error:', err.message);
    }
}

verifyStats();
