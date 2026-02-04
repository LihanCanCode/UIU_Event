import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Friendships (
                friendship_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id_1 INT NOT NULL,
                user_id_2 INT NOT NULL,
                status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id_1) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id_2) REFERENCES Users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_friendship (user_id_1, user_id_2)
            )
        `);

        connection.release();
        return NextResponse.json({ message: 'Friendship table created successfully' });
    } catch (error) {
        console.error('Error creating table:', error);
        return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
    }
}
