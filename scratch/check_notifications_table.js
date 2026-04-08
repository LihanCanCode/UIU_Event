const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'event_koi'
        });
        console.log('Successfully connected to database');
        
        try {
            const [rows] = await connection.query("SHOW TABLES LIKE 'Notifications'");
            if (rows.length > 0) {
                console.log('Table Notifications exists');
                const [cols] = await connection.query("DESCRIBE Notifications");
                console.log('Columns:', cols);
            } else {
                console.log('Table Notifications DOES NOT EXIST');
            }
        } catch (err) {
            console.error('Error querying table:', err.message);
        } finally {
            await connection.end();
        }
    } catch (err) {
        console.error('Error connecting to MySQL:', err.message);
    }
}

checkTable();
