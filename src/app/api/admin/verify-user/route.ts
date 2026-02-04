import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request) {
    try {
        const { user_id, is_verified } = await request.json();

        if (!user_id || is_verified === undefined) {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        await pool.execute(
            'UPDATE Users SET is_verified = ? WHERE id = ?',
            [is_verified ? 1 : 0, user_id]
        );

        return NextResponse.json({ message: 'User verification status updated' });
    } catch (error) {
        console.error('Verify user error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
