import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
    try {
        const { user_id } = await request.json();

        // Check if pending request exists
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM RoleRequests WHERE user_id = ? AND status = "PENDING"',
            [user_id]
        );

        if (existing.length > 0) {
            return NextResponse.json({ message: 'Request already pending' }, { status: 400 });
        }

        await pool.execute(
            'INSERT INTO RoleRequests (user_id, requested_role) VALUES (?, "organizer")',
            [user_id]
        );

        return NextResponse.json({ message: 'Request submitted successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error submitting request:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
