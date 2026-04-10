import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const query = `
      SELECT 
        e.*,
        c.name AS category_name,
        u.name AS organizer_name
      FROM Events e
      LEFT JOIN Categories c ON e.category_id = c.category_id
      LEFT JOIN Users u ON e.organizer_id = u.id
      WHERE e.event_id = ?
    `;

        const [rows] = await pool.query(query, [id]);
        const events = rows as any[];

        if (events.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json(events[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, start_time, end_time, location, category_id } = body;

        const query = `
            UPDATE Events 
            SET title = ?, description = ?, start_time = ?, end_time = ?, location = ?, category_id = ?
            WHERE event_id = ?
        `;

        await pool.execute(query, [
            title,
            description,
            start_time,
            end_time,
            location,
            category_id || null,
            id
        ]);

        return NextResponse.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ message: 'Error updating event' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // In a real app we'd verify the user_id from session/token matches organizer_id
        await pool.execute('DELETE FROM Events WHERE event_id = ?', [id]);
        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting event' }, { status: 500 });
    }
}
