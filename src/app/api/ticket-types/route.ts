import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
        return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM TicketTypes WHERE event_id = ? ORDER BY price ASC',
            [event_id]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching ticket types:', error);
        return NextResponse.json({ error: 'Failed to fetch ticket types' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event_id, name, price, quantity } = body;

        if (!event_id || !name || price === undefined || !quantity) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const query = `
      INSERT INTO TicketTypes (event_id, name, price, quantity)
      VALUES (?, ?, ?, ?)
    `;

        const [result] = await pool.execute(query, [
            event_id,
            name,
            price,
            quantity
        ]);

        return NextResponse.json(
            { message: 'Ticket type created successfully', ticketTypeId: (result as any).insertId },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating ticket type:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
