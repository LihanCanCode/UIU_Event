import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let query = 'SELECT id, name, email, role, is_verified, profile_image, created_at FROM Users';
        const params = [];

        if (search) {
            query += ' WHERE name LIKE ? OR email LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
