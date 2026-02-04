import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const cloudinary = require('cloudinary').v2;

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        // Test upload with a simple image
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        const result = await cloudinary.uploader.upload(testImage, {
            folder: 'event-koi/test'
        });

        return NextResponse.json({
            success: true,
            message: 'Cloudinary is working!',
            imageUrl: result.secure_url,
            config: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
                api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as any).message,
            config: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
                api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
            }
        }, { status: 500 });
    }
}
