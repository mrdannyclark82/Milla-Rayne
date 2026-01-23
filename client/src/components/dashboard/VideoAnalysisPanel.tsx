import { useRef, useState, type DragEvent } from 'react';
import { X, Play, Link, Youtube, Upload, Loader2 } from 'lucide-react';

interface VideoAnalysisPanelProps {
  onClose: () => void;
  recentItems?: string[];
  onAnalyzeComplete?: (label: string) => void;
}

export function VideoAnalysisPanel({
  onClose,
  recentItems = [],
  onAnalyzeComplete,
}: VideoAnalysisPanelProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) return;
    setIsAnalyzing(true);
    const label = videoUrl.trim();
    setTimeout(() => {
      onAnalyzeComplete?.(label);
      setVideoUrl('');
      setIsAnalyzing(false);
    }, 900);
  };

  const handleFileSelect = (file?: File) => {
    if (!file) return;
    setIsAnalyzing(true);
    const label = file.name;
    setTimeout(() => {
      onAnalyzeComplete?.(label);
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 900);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="backdrop-blur-2xl bg-gradient-to-b from-[#120428]/90 via-[#0c021a]/85 to-[#1a0033]/90 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-[#ff00aa]" />
          <h3 className="text-sm font-medium text-white">Video Analysis</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
            activeTab === 'url'
              ? 'text-[#00f2ff] border-b-2 border-[#00f2ff] bg-[#00f2ff]/5'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Link className="w-3.5 h-3.5 inline-block mr-1.5" />
          URL
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
            activeTab === 'upload'
              ? 'text-[#00f2ff] border-b-2 border-[#00f2ff] bg-[#00f2ff]/5'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Upload className="w-3.5 h-3.5 inline-block mr-1.5" />
          Upload
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'url' ? (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube or video URL..."
                className="w-full px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-white/30 focus:outline-none focus:border-[#00f2ff]/50 focus:bg-white/10 transition-all"
              />
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!videoUrl.trim() || isAnalyzing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                videoUrl.trim() && !isAnalyzing
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#ff00aa] text-white shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:shadow-[0_0_30px_rgba(0,242,255,0.5)]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Analyze Video
                </>
              )}
            </button>
          </div>
         ) : (
           <div
             className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-[#00f2ff]/30 hover:bg-[#00f2ff]/5 transition-all cursor-pointer"
             onDragOver={(e) => e.preventDefault()}
             onDrop={handleDrop}
             onClick={() => fileInputRef.current?.click()}
           >
             <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
             <p className="text-sm text-white/50">Drop video file here</p>
             <p className="text-xs text-white/30 mt-1">or click to browse</p>
             <input
               ref={fileInputRef}
               type="file"
               accept="video/*"
               className="hidden"
               onChange={(e) => handleFileSelect(e.target.files?.[0])}
             />
           </div>
         )}
       </div>

       {/* Recent analyses */}
       <div className="px-4 py-3 border-t border-white/5">
         <div className="text-xs text-white/40 mb-2">Recent</div>
         <div className="space-y-1">
           {recentItems.length === 0 ? (
             <div className="text-xs text-white/30 px-2 py-1.5">No analyses yet</div>
           ) : (
             recentItems.map((item, i) => (
               <div
                 key={`${item}-${i}`}
                 className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
               >
                 <Play className="w-3 h-3 text-white/30" />
                 <span className="text-xs text-white/60 truncate">{item}</span>
               </div>
             ))
           )}
         </div>
       </div>
     </div>
   );
}

export default VideoAnalysisPanel;
