import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT 
                r.request_id,
                r.user_id,
                r.requested_role,
                r.status,
                r.created_at,
                u.name,
                u.email
            FROM RoleRequests r
            JOIN Users u ON r.user_id = u.id
            WHERE r.status = 'PENDING'
            ORDER BY r.created_at DESC
        `;
        const [rows] = await pool.query(query);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { request_id, status } = await request.json(); // status: 'APPROVED' or 'REJECTED'

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        // Get the request details to find the user_id
        const [reqRows] = await pool.query<any[]>('SELECT * FROM RoleRequests WHERE request_id = ?', [request_id]);
        if (reqRows.length === 0) {
            return NextResponse.json({ message: 'Request not found' }, { status: 404 });
        }
        const requestData = reqRows[0];

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update request status
            await connection.execute(
                'UPDATE RoleRequests SET status = ? WHERE request_id = ?',
                [status, request_id]
            );

            // If approved, update user role
            if (status === 'APPROVED') {
                await connection.execute(
                    'UPDATE Users SET role = ?, is_verified = 1 WHERE id = ?',
                    [requestData.requested_role, requestData.user_id]
                );
            }

            await connection.commit();
            return NextResponse.json({ message: `Request ${status.toLowerCase()}` });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
