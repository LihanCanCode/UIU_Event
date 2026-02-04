import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ message: 'User ID required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // 1. LAZY CHECK: Event Reminders (simulate cron)
        // Find bookings for this user for events starting in < 24 hours 
        // AND where we haven't already created a notification for this event/type
        const [upcomingEvents] = await connection.query(`
            SELECT b.event_id, e.title, e.start_time 
            FROM Bookings b
            JOIN Events e ON b.event_id = e.event_id
            WHERE b.user_id = ? 
            AND e.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
            AND NOT EXISTS (
                SELECT 1 FROM Notifications n 
                WHERE n.user_id = ? 
                AND n.type = 'EVENT_REMINDER' 
                AND n.reference_id = e.event_id
            )
        `, [userId, userId]);

        // Insert reminders
        for (const event of (upcomingEvents as any[])) {
            await connection.execute(
                `INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, 'EVENT_REMINDER', ?, ?)`,
                [userId, event.event_id, `Reminder: "${event.title}" is coming up tomorrow at ${new Date(event.start_time).toLocaleTimeString()}!`]
            );
        }

        // 2. Fetch Notifications
        const [notifications] = await connection.query(`
            SELECT * FROM Notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        `, [userId]);

        connection.release();
        return NextResponse.json(notifications);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching notifications' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { notification_id } = await request.json();

        // Mark as read
        await pool.execute('UPDATE Notifications SET is_read = TRUE WHERE notification_id = ?', [notification_id]);

        return NextResponse.json({ message: 'Marked as read' });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
