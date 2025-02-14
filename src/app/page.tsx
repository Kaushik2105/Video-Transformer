"use client"

import { useState, useRef, useEffect } from "react"
import { uploadFile } from "@uploadcare/upload-client"
import { FileUploaderRegular } from "@uploadcare/react-uploader/next"
import "@uploadcare/react-uploader/core.css"
import { motion, AnimatePresence } from "framer-motion"

interface VideoHistory {
  _id: string;
  fileName: string;
  sourceUrl: string;
  cloudinaryUrl: string;
  processedUrl: string;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  transformationParams: {
    num_inference_steps: number;
    aspect_ratio: string;
    resolution: string;
    num_frames: number;
    strength: number;
    requestId: string;
  };
  timestamp: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<{
    name: string;
    cloudinaryUrl?: string;
    processedUrl?: string;
  } | null>(null)
  const [prompt, setPrompt] = useState("")
  const [videoHistory, setVideoHistory] = useState<VideoHistory[]>([])
  const uploadInProgress = useRef(new Set<string>())

  useEffect(() => {
    fetchVideoHistory();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoHistory.some(video => video.status === 'processing')) {
        fetchVideoHistory();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [videoHistory]);

  const fetchVideoHistory = async () => {
    try {
      console.log('Fetching video history...');
      const response = await fetch('/api/process-video');
      
      if (response.status === 401) {
        console.log("User not authenticated");
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch video history');
      }
      
      const data = await response.json();
      console.log('Fetched video history:', data);
      setVideoHistory(data);
    } catch (error) {
      console.error('Error fetching video history:', error);
    }
  };

  const processVideo = async (cloudinaryUrl: string, fileName: string) => {
    try {
      setLoading(true);
      console.log('Starting video processing with:', {
        cloudinaryUrl,
        fileName,
        prompt
      });

      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: cloudinaryUrl,
          fileName,
          cloudinaryUrl,
          prompt: prompt.trim() || "A stylish person walking in a creative environment"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      if (!data.processedUrl) {
        throw new Error('No processed video URL received');
      }

      console.log('Processing successful:', data);
      
      setCurrentVideo(prevVideo => 
        prevVideo ? { ...prevVideo, processedUrl: data.processedUrl } : null
      );

      await fetchVideoHistory();
      
    } catch (error) {
      console.error("Video processing error:", error);
      alert('Error processing video: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: Blob, fileName: string) => {
    if (currentVideo || uploadInProgress.current.has(fileName)) {
      console.log("Skipping re-upload of:", fileName)
      return
    }

    try {
      setLoading(true)
      uploadInProgress.current?.add(fileName)
      
      // Upload to Uploadcare first
      const uploadcareResult = await uploadFile(file, {
        publicKey: "0bfee94bec33dc939465",
        store: "auto",
      })

      // Get the Uploadcare URL
      const uploadcareUrl = `https://ucarecdn.com/${uploadcareResult.uuid}/`
      
      // Upload to Cloudinary through our API route
      const cloudinaryResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: uploadcareUrl }),
      });

      if (!cloudinaryResponse.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }

      const cloudinaryResult = await cloudinaryResponse.json();

      // Add to current video
      setCurrentVideo({ 
        name: fileName, 
        cloudinaryUrl: cloudinaryResult.url 
      })

      // Process the video with fal.ai
      await processVideo(cloudinaryResult.url, fileName);

    } catch (error) {
      console.error("Upload Error:", error)
    } finally {
      setLoading(false)
      uploadInProgress.current?.delete(fileName)
    }
  }

  const handleRun = async () => {
    if (!currentVideo?.cloudinaryUrl) {
      alert("Please upload a video first");
      return;
    }

    if (!prompt.trim()) {
      alert("Please enter a transformation prompt");
      return;
    }

    try {
      setLoading(true);
      await processVideo(currentVideo.cloudinaryUrl, currentVideo.name);
    } catch (error) {
      console.error("Processing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const VideoHistoryItem = ({ video }: { video: VideoHistory }) => {
    const handleDownload = async (url: string, fileName: string) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `processed_${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading video');
      }
    };

    return (
      <div key={video._id} className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">{video.fileName}</h3>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Prompt:</strong> {video.prompt}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Status:</strong>{' '}
          <span className={`
            ${video.status === 'completed' ? 'text-green-600' : ''}
            ${video.status === 'processing' ? 'text-yellow-600' : ''}
            ${video.status === 'failed' ? 'text-red-600' : ''}
          `}>
            {video.status}
          </span>
        </p>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Processed:</strong>{' '}
          {new Date(video.timestamp).toLocaleDateString()}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <video controls className="w-full rounded mb-2">
              <source src={video.sourceUrl} type="video/mp4" />
            </video>
            <button
              onClick={() => handleDownload(video.sourceUrl, `original_${video.fileName}`)}
              className="w-full py-1 px-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download Original
            </button>
          </div>
          <div>
            {video.status === 'completed' && video.processedUrl ? (
              <>
                <video controls className="w-full rounded mb-2">
                  <source src={video.processedUrl} type="video/mp4" />
                </video>
                <button
                  onClick={() => handleDownload(video.processedUrl!, video.fileName)}
                  className="w-full py-1 px-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Download Processed
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 rounded">
                <p className="text-sm text-gray-500">
                  {video.status === 'processing' ? 'Processing...' : 'Processing failed'}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p><strong>Resolution:</strong> {video.transformationParams.resolution}</p>
          <p><strong>Aspect Ratio:</strong> {video.transformationParams.aspect_ratio}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-purple-800 mb-8">
          Video Transformation
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Upload and Prompt Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Upload & Transform</h2>
            
            {/* Upload Section */}
            <div className="mb-6">
              <FileUploaderRegular
                sourceList="local, camera, facebook, gdrive"
                cameraModes="video"
                classNameUploader="uc-light"
                pubkey="0bfee94bec33dc939465"
                onChange={(fileGroup) => {
                  fileGroup.allEntries.forEach((uploadedFile) => {
                    if (uploadedFile.status === "success" && uploadedFile.file && uploadedFile.file instanceof File) {
                      handleUpload(uploadedFile.file, uploadedFile.file.name)
                    }
                  })
                }}
              />
            </div>

            {/* Prompt Section */}
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your transformation prompt..."
                className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                rows={4}
              />
              
              <button
                onClick={handleRun}
                disabled={loading || !currentVideo?.cloudinaryUrl}
                className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors
                  ${loading || !currentVideo?.cloudinaryUrl
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                  }`}
              >
                {loading ? 'Processing...' : 'Run Transformation'}
              </button>
            </div>
          </div>

          {/* Right Side - Output Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Transformation Output</h2>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="mb-4">Processing your video...</p>
                  <div className="loader"></div>
                </div>
              </div>
            ) : currentVideo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Original Video</h3>
                    <video controls className="w-full rounded-lg">
                      <source src={currentVideo.cloudinaryUrl} type="video/mp4" />
                    </video>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Processed Video</h3>
                    {currentVideo.processedUrl ? (
                      <video controls className="w-full rounded-lg">
                        <source src={currentVideo.processedUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                        <p>Click Run to start processing</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Upload a video to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Video History Section */}
        <div className="mt-12 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Transformation History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoHistory.map((video) => (
              <VideoHistoryItem key={video._id} video={video} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

