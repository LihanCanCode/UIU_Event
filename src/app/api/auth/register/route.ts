import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as string;
        const phone = formData.get('phone') as string;
        const designation = formData.get('designation') as string;

        const profile_image = formData.get('profile_image') as File | null;
        const organization_id_card = formData.get('organization_id_card') as File | null;
        const proof_document = formData.get('proof_document') as File | null;

        if (!name || !email || !password || !designation || !profile_image) {
            return NextResponse.json(
                { message: 'Missing required fields: Name, Email, Password, Designation, Profile Picture' },
                { status: 400 }
            );
        }

        // Validate Role (ENFORCE ATTENDEE FOR PUBLIC REGISTRATION)
        // const validRoles = ['admin', 'organizer', 'attendee'];
        // const userRole = validRoles.includes(role) ? role : 'attendee';
        const userRole = 'attendee';

        // Helper to save file
        const saveFile = async (file: File) => {
            const buffer = Buffer.from(await file.arrayBuffer());
            // Create a pseudo-unique filename based on timestamp and random number since we don't have user_id yet
            const filename = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${file.name.replace(/\s/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public/uploads');

            // In production, ensure directory exists. Here we assume existing or ignore for MVP environment limitations if mkdir failed previously (but we ran mkdir)
            try {
                await writeFile(path.join(uploadDir, filename), buffer);
                return `/uploads/${filename}`;
            } catch (err) {
                console.error("File save error", err);
                return null;
            }
        };

        let profilePath = null, idCardPath = null, proofPath = null;

        // Save files
        if (profile_image) profilePath = await saveFile(profile_image);
        if (organization_id_card) idCardPath = await saveFile(organization_id_card);
        if (proof_document) proofPath = await saveFile(proof_document);


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL Insert
        const query = `
      INSERT INTO Users (name, email, password, role, phone, designation, profile_image, organization_id_card, proof_document, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        // Default verification: FALSE. Admin must verify.
        const [result] = await pool.execute(query, [
            name,
            email,
            hashedPassword,
            userRole,
            phone || null,
            designation,
            profilePath,
            idCardPath,
            proofPath,
            0 // is_verified = false
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
