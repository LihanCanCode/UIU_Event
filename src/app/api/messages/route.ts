import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const friendId = searchParams.get('friend_id');

        if (!userId || !friendId) {
            return NextResponse.json({ message: 'User ID and Friend ID required' }, { status: 400 });
        }

        const query = `
            SELECT 
                m.*,
                u.name as sender_name,
                u.profile_image as sender_image
            FROM Messages m
            JOIN Users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `;

        const [messages] = await pool.query(query, [userId, friendId, friendId, userId]);

        return NextResponse.json(messages);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { sender_id, receiver_id, content } = await request.json();

        if (!content) return NextResponse.json({ message: 'Content required' }, { status: 400 });

        const [result] = await pool.execute(
            'INSERT INTO Messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [sender_id, receiver_id, content]
        );

        // Get Sender Name
        const [senderRows] = await pool.query('SELECT name FROM Users WHERE id = ?', [sender_id]);
        const senderName = (senderRows as any[])[0]?.name || 'Someone';

        // Insert Notification
        await pool.execute(
            'INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, "MESSAGE", ?, ?)',
            [receiver_id, (result as any).insertId, `New message from ${senderName}`]
        );

        return NextResponse.json({ message: 'Message sent' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error sending message' }, { status: 500 });
    }
}
