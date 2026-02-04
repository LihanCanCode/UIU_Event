import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Missing email or password' },
                { status: 400 }
            );
        }

        // Fetch user from DB
        const [rows] = await pool.execute(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );
        const users = rows as any[];

        if (users.length === 0) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const user = users[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // In a real app, we would set a session cookie or JWT here.
        // For this simple RDBMS project, we will return the user info and handle state on the client 
        // or use a simple cookie approach if needed later.
        // Let's return the user data (excluding password)

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'Login successful', user: userWithoutPassword },
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
