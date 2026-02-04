import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Messages (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        connection.release();
        return NextResponse.json({ message: 'Messages table created successfully' });
    } catch (error) {
        console.error('Error creating table:', error);
        return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
    }
}
