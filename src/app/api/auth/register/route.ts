import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields: Name, Email, Password' },
                { status: 400 }
            );
        }

        const userRole = 'organizer';

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL Insert
        const query = `
            INSERT INTO Users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            name,
            email,
            hashedPassword,
            userRole
        ]);

        return NextResponse.json(
            { message: 'User registered successfully', userId: (result as any).insertId },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { message: 'Email already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
