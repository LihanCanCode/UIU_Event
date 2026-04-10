import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const organizerId = searchParams.get('organizer_id');

        let query = `
      SELECT 
        e.event_id, 
        e.title, 
        e.description, 
        e.start_time, 
        e.end_time, 
        e.location,
        c.name AS category_name,
        u.name AS organizer_name
      FROM Events e
      LEFT JOIN Categories c ON e.category_id = c.category_id
      LEFT JOIN Users u ON e.organizer_id = u.id
    `;

        const conditions = [];
        const params = [];

        if (organizerId) {
            conditions.push('e.organizer_id = ?');
            params.push(organizerId);
        }

        const search = searchParams.get('search');
        if (search) {
            conditions.push('(e.title LIKE ? OR u.name LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY e.start_time ASC';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { organizer_id, category_id, title, description, location, start_time, end_time } = body;

        if (!organizer_id || !title || !start_time || !end_time || !location) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const query = `
      INSERT INTO Events (organizer_id, category_id, title, description, location, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        const [result] = await pool.execute(query, [
            organizer_id,
            category_id || null,
            title,
            description || '',
            location,
            start_time,
            end_time
        ]);

        const eventId = (result as any).insertId;

        return NextResponse.json(
            { message: 'Event created successfully', eventId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
