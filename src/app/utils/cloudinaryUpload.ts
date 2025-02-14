import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dtyodrnjg",
  api_key: process.env.CLOUDINARY_API_KEY || "369852676347512",
  api_secret: process.env.CLOUDINARY_API_SECRET || "9jXTHUMzYduFKSSdOu5mrjmglD0",
});


export async function uploadToCloudinary(videoUrl: string) {
  try {
    const result = await cloudinary.uploader.upload(videoUrl, {
      resource_type: "video",
      folder: "uploaded_videos"
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}
