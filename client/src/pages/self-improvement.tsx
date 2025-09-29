/**
 * Self-Improvement Tracking Page
 * 
 * Dedicated page for viewing and managing Milla's recursive self-improvement
 * system. Provides comprehensive insights into improvement cycles, analytics,
 * and current system status.
 */

import { SelfImprovementTracker } from "@/components/SelfImprovementTracker";

const BACKGROUND_IMAGE = "/background.jpg";

export default function SelfImprovementPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <a 
                href="/" 
                className="text-white hover:text-white/80 transition-colors"
              >
                ← Back to Home
              </a>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-white text-xl font-semibold">
                Milla's Self-Improvement System
              </h1>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="container mx-auto px-6 py-8">
          <div 
            className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            <SelfImprovementTracker />
          </div>
        </div>
      </div>
    </div>
  );
}