import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Palette,
  Wand2,
  Check,
  ChevronDown,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';

interface CreativeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  model: string;
  timestamp: Date;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: React.ReactNode }[] = [
  { value: '1:1', label: 'Square', icon: <Square className="w-4 h-4" /> },
  { value: '16:9', label: 'Landscape', icon: <RectangleHorizontal className="w-4 h-4" /> },
  { value: '9:16', label: 'Portrait', icon: <RectangleVertical className="w-4 h-4" /> },
  { value: '4:3', label: 'Standard', icon: <RectangleHorizontal className="w-4 h-4" /> },
  { value: '3:4', label: 'Photo', icon: <RectangleVertical className="w-4 h-4" /> },
];

const IMAGE_MODELS = [
  { value: 'flux', label: 'Flux', description: 'High quality, balanced' },
  { value: 'flux-realism', label: 'Flux Realism', description: 'Photorealistic images' },
  { value: 'flux-anime', label: 'Flux Anime', description: 'Anime/manga style' },
  { value: 'flux-3d', label: 'Flux 3D', description: '3D rendered images' },
  { value: 'turbo', label: 'Turbo', description: 'Fast generation' },
];

const STYLE_PRESETS = [
  'Photorealistic',
  'Digital Art',
  'Oil Painting',
  'Watercolor',
  'Anime/Manga',
  'Pixel Art',
  'Minimalist',
  'Surrealist',
  '3D Render',
  'Sketch',
  'Cyberpunk',
  'Fantasy',
];

export const CreativeStudio: React.FC<CreativeStudioProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  // State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [model, setModel] = useState('flux');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate image
  const generateImage = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    // Build enhanced prompt with style
    const enhancedPrompt = selectedStyle
      ? `${prompt}, ${selectedStyle} style`
      : prompt;

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          aspectRatio,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats from various image generation backends
      // (Pollinations uses 'url', some use 'imageUrl', others use 'image')
      const imageUrl = data.url || data.imageUrl || data.image;
      
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        url: imageUrl,
        prompt: enhancedPrompt,
        aspectRatio,
        model,
        timestamp: new Date(),
      };

      setGeneratedImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
    } catch (e) {
      console.error('Image generation error:', e);
      setError(e instanceof Error ? e.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, aspectRatio, model, selectedStyle]);

  // Download image
  const downloadImage = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `milla-creative-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  // Copy image URL
  const copyImageUrl = async (image: GeneratedImage) => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy error:', e);
    }
  };

  // Delete image from history
  const deleteImage = (imageId: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  };

  // Clear all history
  const clearHistory = () => {
    setGeneratedImages([]);
    setSelectedImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-4 z-50 flex flex-col bg-[#0f0f1a]/98 backdrop-blur-lg rounded-xl border border-cyan-500/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a12]/60">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Creative Studio</h2>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            AI Image Generation
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 border-r border-white/10 bg-black/20 flex flex-col p-4 gap-4">
          {/* Prompt Input */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Prompt</label>
            <textarea
              placeholder="Describe the image you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-28 p-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Style Presets */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => (
                <Badge
                  key={style}
                  className={`cursor-pointer transition-colors ${
                    selectedStyle === style
                      ? 'bg-purple-500/40 text-purple-200 border-purple-500/50'
                      : 'bg-black/40 text-white/60 border-white/10 hover:border-white/30'
                  }`}
                  onClick={() =>
                    setSelectedStyle(selectedStyle === style ? null : style)
                  }
                >
                  {style}
                </Badge>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Aspect Ratio</label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <Button
                  key={ratio.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 ${
                    aspectRatio === ratio.value
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-black/40 text-white/60 border border-white/10'
                  }`}
                >
                  {ratio.icon}
                  <span className="text-xs">{ratio.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Model</label>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_MODELS.map((m) => (
                <Button
                  key={m.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setModel(m.value)}
                  className={`flex flex-col items-start p-3 h-auto ${
                    model === m.value
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-black/40 text-white/60 border border-white/10'
                  }`}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-xs opacity-60">{m.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-6"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Image
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Center Panel - Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-8 bg-black/20">
            {selectedImage ? (
              <div className="relative max-w-full max-h-full">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => downloadImage(selectedImage)}
                    className="bg-black/60 hover:bg-black/80 text-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => copyImageUrl(selectedImage)}
                    className="bg-black/60 hover:bg-black/80 text-white"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-1 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy URL'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-white/40">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No image selected</p>
                <p className="text-sm">Generate an image or select from history</p>
              </div>
            )}
          </div>

          {/* Prompt info */}
          {selectedImage && (
            <div className="p-4 border-t border-white/10 bg-black/40">
              <p className="text-sm text-white/70 mb-1">Prompt:</p>
              <p className="text-white">{selectedImage.prompt}</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-black/40 text-white/60 border-white/10">
                  {selectedImage.aspectRatio}
                </Badge>
                <Badge className="bg-black/40 text-white/60 border-white/10">
                  {selectedImage.model}
                </Badge>
                <Badge className="bg-black/40 text-white/60 border-white/10">
                  {selectedImage.timestamp.toLocaleTimeString()}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - History */}
        <div className="w-64 border-l border-white/10 bg-black/20 flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm text-white/70">History</span>
            {generatedImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-6 px-2 text-xs text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 p-2">
            {generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40 p-4 text-center">
                <Wand2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No images yet</p>
                <p className="text-xs">Generated images will appear here</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {generatedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage?.id === image.id
                        ? 'border-purple-500'
                        : 'border-transparent hover:border-white/20'
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image.id);
                        }}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default CreativeStudio;
