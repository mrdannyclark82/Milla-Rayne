import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface EnhancementSuggestionsProps {
  className?: string;
}

export default function EnhancementSuggestions({ className }: EnhancementSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/suggest-enhancements');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setError(null);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMsg);
      console.error('Error fetching enhancement suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          ✨ AI Enhancement Suggestions
        </h3>
        <Button 
          onClick={fetchSuggestions}
          disabled={loading}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {loading ? 'Generating...' : 'Get Suggestions'}
        </Button>
      </div>

      {error && (
        <div className="text-red-300 text-sm text-center p-2 bg-red-900/20 rounded">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-sm text-white/90 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start space-x-2">
                <span className="text-blue-300 font-bold">{index + 1}.</span>
                <span>{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <div className="text-white/60 text-sm text-center p-4">
          Click "Get Suggestions" to see AI-powered enhancement ideas for this project!
        </div>
      )}
    </div>
  );
}