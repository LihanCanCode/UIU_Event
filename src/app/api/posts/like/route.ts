import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { post_id, user_id } = await request.json();

        // Check if already liked
        const [existing] = await pool.query('SELECT * FROM PostLikes WHERE post_id = ? AND user_id = ?', [post_id, user_id]);

        if ((existing as any[]).length > 0) {
            // Unlike
            await pool.execute('DELETE FROM PostLikes WHERE post_id = ? AND user_id = ?', [post_id, user_id]);
            return NextResponse.json({ message: 'Unliked' });
        } else {
            // Like
            await pool.execute('INSERT INTO PostLikes (post_id, user_id) VALUES (?, ?)', [post_id, user_id]);
            return NextResponse.json({ message: 'Liked' });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Error toggling like' }, { status: 500 });
    }
}
