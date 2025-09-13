import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>🎥</span>
            <span>Video Analyzer</span>
            <div className="ml-auto text-sm text-muted-foreground">
              Status: {status}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          {/* Video viewer iframe */}
          <div className="flex-1 relative border rounded-lg overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              src="/videoviewer.html"
              className="w-full h-full"
              allow="camera"
              title="Video Analyzer"
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-sm">
                {isCameraActive ? 'Camera Active' : 'Camera Inactive'}
              </span>
              {isAnalyzing && (
                <>
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm text-blue-600">AI Analysis Running</span>
                </>
              )}
            </div>
            
            <div className="flex space-x-2">
              {!isModelLoaded && (
                <Button 
                  onClick={initializeAnalyzer} 
                  disabled={!isOpen}
                  variant="outline"
                >
                  Initialize AI Model
                </Button>
              )}
              
              {isModelLoaded && !isCameraActive && (
                <Button onClick={startCamera} variant="outline">
                  Start Camera
                </Button>
              )}
              
              {isCameraActive && !isAnalyzing && (
                <Button onClick={startAnalysis} variant="default">
                  Start Analysis
                </Button>
              )}
              
              {isAnalyzing && (
                <Button onClick={stopAnalysis} variant="destructive">
                  Stop Analysis
                </Button>
              )}
              
              {isCameraActive && (
                <Button onClick={stopCamera} variant="outline">
                  Stop Camera
                </Button>
              )}
              
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="p-4 border rounded-lg bg-muted/5">
            <h4 className="text-sm font-medium mb-2">How to use:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Click "Initialize AI Model" to load TensorFlow.js</li>
              <li>2. Click "Start Camera" to activate your webcam</li>
              <li>3. Click "Start Analysis" to begin AI object detection</li>
              <li>4. Chat with Milla about what she sees in your video feed</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}