import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { post_id, user_id, content } = await request.json();

        if (!content) return NextResponse.json({ message: 'Content required' }, { status: 400 });

        await pool.execute('INSERT INTO PostComments (post_id, user_id, content) VALUES (?, ?, ?)', [post_id, user_id, content]);

        return NextResponse.json({ message: 'Comment added' });
    } catch (error) {
        return NextResponse.json({ message: 'Error adding comment' }, { status: 500 });
    }
}
