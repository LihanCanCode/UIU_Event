import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_koi',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // SSL configuration for cloud databases (like Aiven, Azure, AWS)
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined
});

export default pool;
