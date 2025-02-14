# Video Transformation Tool

A Next.js application for uploading and transforming videos using AI-powered processing.

## Features

- 🔐 User authentication with Clerk
- 📤 Video upload to Cloudinary
- 🤖 AI-powered video transformation with fal.ai
- 📥 Processed video storage and retrieval
- 📊 Video metadata management with MongoDB

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/video-transformation-tool.git
   cd video-transformation-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   MONGODB_URI=your_mongodb_uri
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   FAL_API_KEY=your_fal_api_key
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Sign in to access the video transformation features

## API Endpoints

### POST /api/upload
Upload a video to Cloudinary

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4"
}
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/.../video.mp4",
  "publicId": "uploaded_videos/..."
}
```

### POST /api/process-video
Process a video with AI transformation

**Request Body:**
```json
{
  "videoUrl": "https://res.cloudinary.com/.../video.mp4",
  "prompt": "Transform this video into a cartoon style",
  "fileName": "example.mp4"
}
```

**Response:**
```json
{
  "message": "Processing started",
  "requestId": "12345"
}
```

### POST /api/webhook
Webhook endpoint for processed video notifications

**Request Body:**
```json
{
  "video_url": "https://processed.video.mp4",
  "requestId": "12345"
}
```

## Technologies

- [Next.js](https://nextjs.org/) - React framework
- [Cloudinary](https://cloudinary.com/) - Video storage and processing
- [MongoDB](https://www.mongodb.com/) - Database for video metadata
- [Clerk](https://clerk.dev/) - User authentication
- [fal.ai](https://fal.ai/) - AI video processing

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
