import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { ticket_id, user_id } = await request.json();

        if (!ticket_id || !user_id) {
            return NextResponse.json({ message: 'Ticket ID and User ID required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Fetch Ticket & Event Details
            const query = `
                SELECT t.ticket_id, t.status, t.ticket_type_id, tt.price, e.start_time
                FROM Tickets t
                JOIN Events e ON t.event_id = e.event_id
                JOIN TicketTypes tt ON t.ticket_type_id = tt.ticket_type_id
                WHERE t.ticket_id = ? AND t.user_id = ?
                FOR UPDATE
            `;
            const [rows]: any = await connection.execute(query, [ticket_id, user_id]);

            if (rows.length === 0) {
                await connection.rollback();
                return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
            }

            const ticket = rows[0];

            if (ticket.status === 'CANCELLED') {
                await connection.rollback();
                return NextResponse.json({ message: 'Ticket already cancelled' }, { status: 400 });
            }

            // 2. Calculate Policy
            const eventDate = new Date(ticket.start_time);
            const now = new Date();
            const diffMs = eventDate.getTime() - now.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            let refundPercentage = 0;

            if (diffDays > 7) {
                refundPercentage = 100;
            } else if (diffDays > 2) {
                refundPercentage = 50;
            } else {
                await connection.rollback();
                return NextResponse.json({
                    message: 'Cancellation not allowed within 48 hours of the event.',
                    allowed: false
                }, { status: 403 });
            }

            const refundAmount = (Number(ticket.price) * refundPercentage) / 100;

            // 3. Update Ticket Status
            await connection.execute(
                'UPDATE Tickets SET status = "CANCELLED", refund_amount = ? WHERE ticket_id = ?',
                [refundAmount, ticket_id]
            );

            // 4. Return Stock
            await connection.execute(
                'UPDATE TicketTypes SET quantity = quantity + 1 WHERE ticket_type_id = ?',
                [ticket.ticket_type_id]
            );

            await connection.commit();

            return NextResponse.json({
                message: 'Ticket cancelled successfully',
                refundAmount: refundAmount,
                refundPercentage: refundPercentage
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Cancellation error', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
