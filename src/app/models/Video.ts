import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  fileName: String,
  sourceUrl: String,
  cloudinaryUrl: String,
  processedUrl: String,
  prompt: String,
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  transformationParams: {
    num_inference_steps: Number,
    aspect_ratio: String,
    resolution: String,
    num_frames: Number,
    strength: Number,
    requestId: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema); 