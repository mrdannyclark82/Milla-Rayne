import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface VideoAnalysisResult {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

interface VideoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisUpdate?: (results: VideoAnalysisResult[]) => void;
}

export default function VideoViewer({ isOpen, onClose, onAnalysisUpdate }: VideoViewerProps) {
  const [status, setStatus] = useState("Ready to initialize");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'statusUpdate':
          setStatus(data.status);
          break;
        case 'modelLoaded':
          setIsModelLoaded(true);
          setStatus("Model loaded - Ready to start camera");
          break;
        case 'cameraStarted':
          setIsCameraActive(true);
          setStatus("Camera active - Ready to analyze");
          break;
        case 'analysisStarted':
          setIsAnalyzing(true);
          setStatus("Analyzing video feed...");
          break;
        case 'analysisStopped':
          setIsAnalyzing(false);
          setStatus(isCameraActive ? "Analysis stopped - Camera still active" : "Camera stopped");
          break;
        case 'cameraStopped':
          setIsCameraActive(false);
          setIsAnalyzing(false);
          setStatus("Camera stopped");
          break;
        case 'analysisResults':
          if (onAnalysisUpdate && data.results) {
            onAnalysisUpdate(data.results);
            const detectedObjects = data.results.map((r: VideoAnalysisResult) => r.class).join(', ');
            if (data.results.length > 0) {
              setStatus(`Detecting: ${detectedObjects}`);
            }
          }
          break;
        case 'error':
          setStatus(`Error: ${data.message}`);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAnalysisUpdate]);

  // Send commands to iframe
  const sendCommand = (command: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ command }, window.location.origin);
    }
  };

  const initializeAnalyzer = () => {
    setStatus("Loading AI model...");
    sendCommand('initialize');
  };

  const startCamera = () => {
    setStatus("Starting camera...");
    sendCommand('startCamera');
  };

  const startAnalysis = () => {
    sendCommand('startAnalysis');
  };

  const stopAnalysis = () => {
    sendCommand('stopAnalysis');
  };

  const stopCamera = () => {
    sendCommand('stopCamera');
  };

  const handleClose = () => {
    sendCommand('stopAll');
    setIsCameraActive(false);
    setIsAnalyzing(false);
    setIsModelLoaded(false);
    setStatus("Disconnected");
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed top-0 left-0 w-96 h-full bg-white/20 backdrop-blur-lg border-r border-white/30 shadow-2xl z-40 flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/30">
            <div className="flex items-center space-x-2">
              <span>🎥</span>
              <span className="text-white font-semibold">Video Analyzer</span>
            </div>
            <div className="text-sm text-white/70">
              Status: {status}
            </div>
          </div>
          
          {/* Video viewer iframe */}
          <div className="flex-1 relative border rounded-lg overflow-hidden bg-black mb-4">
            <iframe
              ref={iframeRef}
              src="/videoviewer.html"
              className="w-full h-full"
              allow="camera"
              title="Video Analyzer"
            />
          </div>
          
          {/* Controls */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-white">
                {isCameraActive ? 'Camera Active' : 'Camera Inactive'}
              </span>
              {isAnalyzing && (
                <>
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm text-blue-200">AI Analysis Running</span>
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {!isModelLoaded && (
                <Button 
                  onClick={initializeAnalyzer} 
                  disabled={!isOpen}
                  variant="outline"
                  size="sm"
                  className="col-span-2"
                >
                  Initialize AI Model
                </Button>
              )}
              
              {isModelLoaded && !isCameraActive && (
                <Button onClick={startCamera} variant="outline" size="sm">
                  Start Camera
                </Button>
              )}
              
              {isCameraActive && !isAnalyzing && (
                <Button onClick={startAnalysis} variant="default" size="sm">
                  Start Analysis
                </Button>
              )}
              
              {isAnalyzing && (
                <Button onClick={stopAnalysis} variant="destructive" size="sm">
                  Stop Analysis
                </Button>
              )}
              
              {isCameraActive && (
                <Button onClick={stopCamera} variant="outline" size="sm">
                  Stop Camera
                </Button>
              )}
              
              <Button onClick={handleClose} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2 text-white">How to use:</h4>
            <ol className="text-xs text-white/80 space-y-1">
              <li>1. Click "Initialize AI Model" to load TensorFlow.js</li>
              <li>2. Click "Start Camera" to activate your webcam</li>
              <li>3. Click "Start Analysis" to begin AI object detection</li>
              <li>4. Chat with Milla about what she sees in your video feed</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}