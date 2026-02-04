import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS EventPosts (
                post_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS PostLikes (
                like_id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES EventPosts(post_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (post_id, user_id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS PostComments (
                comment_id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES EventPosts(post_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        connection.release();
        return NextResponse.json({ message: 'Blog tables created successfully' });
    } catch (error) {
        console.error('Error creating tables:', error);
        return NextResponse.json({ error: 'Failed to create tables' }, { status: 500 });
    }
}
