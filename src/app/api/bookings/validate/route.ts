import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
    try {
        const { code, organizer_id } = await request.json();

        if (!code || !organizer_id) {
            return NextResponse.json({ message: 'Missing code or organizer ID' }, { status: 400 });
        }

        // 1. Find the ticket and related event info
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT b.booking_id, b.status, b.unique_code, b.user_id, e.title as event_title, e.organizer_id, u.name as attendee_name
             FROM Bookings b
             JOIN Events e ON b.event_id = e.event_id
             JOIN Users u ON b.user_id = u.id
             WHERE b.unique_code = ?`,
            [code]
        );

        if (rows.length === 0) {
            return NextResponse.json({ valid: false, message: 'Invalid Ticket Code' }, { status: 404 });
        }

        const ticket = rows[0];

        // 2. Check if the organizer owns this event
        if (ticket.organizer_id.toString() !== organizer_id.toString()) {
            return NextResponse.json({ valid: false, message: 'Unauthorized: You are not the organizer of this event' }, { status: 403 });
        }

        // 3. Check status
        if (ticket.status === 'USED') {
            return NextResponse.json({ valid: false, message: 'Ticket Already Used', ticket }, { status: 409 });
        }

        if (ticket.status === 'CANCELLED') {
            return NextResponse.json({ valid: false, message: 'Ticket is Cancelled', ticket }, { status: 400 });
        }

        if (ticket.status !== 'VALID') {
            return NextResponse.json({ valid: false, message: `Ticket Status: ${ticket.status}`, ticket }, { status: 400 });
        }

        // 4. Mark as USED
        await pool.execute(
            'UPDATE Bookings SET status = ? WHERE booking_id = ?',
            ['USED', ticket.booking_id]
        );

        return NextResponse.json({
            valid: true,
            message: 'Check-in Successful',
            ticket: {
                ...ticket,
                status: 'USED' // Return updated status
            }
        });

    } catch (error) {
        console.error('Error validating ticket:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
