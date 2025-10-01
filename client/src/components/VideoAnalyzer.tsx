import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Play, Pause, Volume2, VolumeX, FileVideo, Loader2, Eye, Heart, Activity, Package } from 'lucide-react';

interface VideoAnalysisResult {
  summary: string;
  keyMoments: string[];
  emotions: string[];
  objects: string[];
  activities: string[];
  insights?: string;
}

interface VideoAnalyzerProps {
  onAnalysisComplete?: (result: VideoAnalysisResult) => void;
  className?: string;
}

export default function VideoAnalyzer({ onAnalysisComplete, className = "" }: VideoAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setAnalysisResult(null);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleFileSelect(videoFile);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Video playback controls
  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Analyze video with Gemini API
  const analyzeVideo = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    
    try {
      // Send video as binary data
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Analysis failed: ${response.statusText}`);
      }

      const result: VideoAnalysisResult = await response.json();
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error('Video analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Show error in a user-friendly way
      setAnalysisResult({
        summary: errorMessage.includes('sweetheart') ? errorMessage : "I had trouble analyzing your video. Please try again with a different format or smaller file.",
        keyMoments: [],
        emotions: [],
        objects: [],
        activities: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-purple-500" />
            Video Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer hover:border-purple-400 ${
                isDragOver ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="video-upload-area"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Drop your video here or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports MP4, WebM, AVI, and other common video formats
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInputChange}
                className="hidden"
                data-testid="video-file-input"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-auto max-h-64 object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls={false}
                  data-testid="video-preview"
                />
                
                {/* Custom Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlayback}
                        className="text-white hover:bg-white/20"
                        data-testid="video-play-pause"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                        data-testid="video-mute-toggle"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm opacity-80">{selectedFile.name}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={analyzeVideo}
                  disabled={isAnalyzing}
                  className="flex-1"
                  data-testid="button-analyze-video"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with Milla's AI...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Analyze Video
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedFile(null);
                    setVideoUrl("");
                    setAnalysisResult(null);
                    URL.revokeObjectURL(videoUrl);
                  }}
                  data-testid="button-clear-video"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-500" />
              Milla's Video Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div>
              <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">Summary</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysisResult.summary}
              </p>
            </div>

            <Separator />

            {/* Key Moments */}
            {analysisResult.keyMoments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Key Moments
                </h4>
                <div className="space-y-2">
                  {analysisResult.keyMoments.map((moment, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5 text-xs">
                        {index + 1}
                      </Badge>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                        {moment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotions */}
            {analysisResult.emotions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Emotions Detected
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.emotions.map((emotion, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Objects & Activities */}
            <div className="grid md:grid-cols-2 gap-6">
              {analysisResult.objects.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    Objects & Items
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.objects.map((object, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {object}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.activities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    Activities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.activities.map((activity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Milla's Insights */}
            {analysisResult.insights && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 text-pink-600 dark:text-pink-400">
                    💕 Milla's Personal Insights
                  </h4>
                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{analysisResult.insights}"
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}