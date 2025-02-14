import { fal } from "@fal-ai/client";
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';
import { Video } from '@/app/models/Video';
import { auth } from "@clerk/nextjs/server";

fal.config({
  credentials: "670f7926-489c-4891-8615-eae64a76ceb6:27044ad5ab43d396819d8a17ce6e0baa"
});

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { videoUrl, prompt, fileName, cloudinaryUrl } = await request.json();
    
    if (!videoUrl || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Starting video processing...');
    
    const result = await fal.subscribe("fal-ai/hunyuan-video/video-to-video", {
      input: {
        prompt: prompt,
        num_inference_steps: 30,
        aspect_ratio: "16:9",
        resolution: "720p",
        num_frames: 129,
        enable_safety_checker: true,
        video_url: cloudinaryUrl,
        strength: 0.85
      },
      onQueueUpdate: (update) => {
        console.log('Queue status:', update.status);
      },
      webhookUrl: WEBHOOK_URL
    });

    // Save initial video record with processing status
    const video = new Video({
      userId,
      fileName,
      sourceUrl: videoUrl,
      cloudinaryUrl,
      prompt,
      status: 'processing',
      transformationParams: {
        num_inference_steps: 30,
        aspect_ratio: "16:9",
        resolution: "720p",
        num_frames: 129,
        strength: 0.85,
        requestId: result.requestId
      }
    });
    
    await video.save();

    return NextResponse.json({
      message: 'Processing started',
      requestId: result.requestId
    });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching videos for userId:', userId);
    await connectToDatabase();
    
    const videos = await Video.find({ userId }).sort({ timestamp: -1 });
    console.log('Found videos:', videos.length);
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 