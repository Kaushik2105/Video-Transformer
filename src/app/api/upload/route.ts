import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();
    
    const result = await cloudinary.uploader.upload(videoUrl, {
      resource_type: "video",
      folder: "uploaded_videos"
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Cloudinary' },
      { status: 500 }
    );
  }
} 