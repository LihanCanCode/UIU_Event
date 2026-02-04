import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Notifications (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('MESSAGE', 'EVENT_REMINDER', 'NEW_EVENT') NOT NULL,
                reference_id INT, -- message_id OR event_id
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        connection.release();
        return NextResponse.json({ message: 'Notifications table created successfully' });
    } catch (error) {
        console.error('Error creating table:', error);
        return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
    }
}
