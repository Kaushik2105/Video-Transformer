import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';
import { Video } from '@/app/models/Video';
import { v2 as cloudinary } from 'cloudinary';

// Add webhook secret from fal.ai if they provide one
const WEBHOOK_SECRET = process.env.FAL_WEBHOOK_SECRET;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  // Add CORS headers
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, x-fal-signature',
      },
    });
  }

  try {
    const signature = request.headers.get('x-fal-signature');
    console.log('Received webhook with signature:', signature);
    
    const data = await request.json();
    console.log('Webhook received:', JSON.stringify(data, null, 2));

    if (!data.video_url || !data.requestId) {
      console.error('Invalid webhook data received:', data);
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    console.log('Processing webhook for requestId:', data.requestId);

    // Upload the processed video to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(data.video_url, {
      resource_type: "video",
      folder: "processed_videos"
    });

    console.log('Uploaded to Cloudinary:', cloudinaryResult.secure_url);

    // Update the video document in MongoDB
    await connectToDatabase();
    const updatedVideo = await Video.findOneAndUpdate(
      { 'transformationParams.requestId': data.requestId },
      { 
        processedUrl: cloudinaryResult.secure_url,
        status: 'completed'
      },
      { new: true }
    );

    if (!updatedVideo) {
      console.error('No video found with requestId:', data.requestId);
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log('Successfully updated video:', {
      id: updatedVideo._id,
      requestId: data.requestId,
      status: 'completed'
    });

    return NextResponse.json({ 
      success: true,
      videoId: updatedVideo._id
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, x-fal-signature',
    },
  });
} 