import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    let connection;
    try {
        const { searchParams } = new URL(request.url);
        const userIdRaw = searchParams.get('user_id');

        if (!userIdRaw || userIdRaw === 'undefined' || userIdRaw === 'null') {
            return NextResponse.json({ message: 'Valid User ID required' }, { status: 400 });
        }

        const userId = parseInt(userIdRaw);
        if (isNaN(userId)) {
            return NextResponse.json({ message: 'User ID must be a number' }, { status: 400 });
        }

        connection = await pool.getConnection();

        // Count TOTAL events in the system
        const [organizedRows] = await connection.query(
            'SELECT COUNT(*) as count FROM Events'
        );

        // Count TOTAL tickets booked in the system
        const [purchasedRows] = await connection.query(
            'SELECT COUNT(*) as count FROM Bookings'
        );

        return NextResponse.json({
            organizedCount: (organizedRows as any)[0].count || 0,
            purchasedCount: (purchasedRows as any)[0].count || 0
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
