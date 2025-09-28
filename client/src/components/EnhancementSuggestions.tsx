import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface EnhancementSuggestionsProps {
  className?: string;
}

interface EnhancementSuggestion {
  id?: string;
  text: string;
  implemented?: boolean;
  inProgress?: boolean;
}

export default function EnhancementSuggestions({ className }: EnhancementSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<EnhancementSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installStates, setInstallStates] = useState<Record<number, 'installing' | 'installed'>>({});

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
        // Convert string suggestions to EnhancementSuggestion objects
        const enhancementSuggestions: EnhancementSuggestion[] = data.suggestions.map((suggestion: string, index: number) => ({
          id: `suggestion-${Date.now()}-${index}`,
          text: suggestion,
          implemented: false,
          inProgress: false
        }));
        setSuggestions(enhancementSuggestions);
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

  const installSuggestion = async (suggestionIndex: number, suggestion: EnhancementSuggestion) => {
    setInstallStates(prev => ({ ...prev, [suggestionIndex]: 'installing' }));
    
    try {
      const response = await fetch('http://localhost:5000/api/install-enhancement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          suggestionText: suggestion.text,
          index: suggestionIndex
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Installation response:', data);

      // Update the suggestion state to indicate it's been implemented
      setSuggestions(prev => prev.map((s, i) => 
        i === suggestionIndex ? { ...s, implemented: true, inProgress: false } : s
      ));
      
      setInstallStates(prev => ({ ...prev, [suggestionIndex]: 'installed' }));
      
      // Show success feedback
      setTimeout(() => {
        setInstallStates(prev => {
          const newState = { ...prev };
          delete newState[suggestionIndex];
          return newState;
        });
      }, 3000);

    } catch (error) {
      console.error('Error installing suggestion:', error);
      setInstallStates(prev => {
        const newState = { ...prev };
        delete newState[suggestionIndex];
        return newState;
      });
      // You could add error handling UI here
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
          {suggestions.map((suggestion, index) => {
            const installState = installStates[index];
            const isInstalled = suggestion.implemented || installState === 'installed';
            const isInstalling = installState === 'installing';
            
            return (
              <div
                key={suggestion.id || index}
                className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex-1">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-300 font-bold">{index + 1}.</span>
                      <span className={isInstalled ? 'line-through opacity-60' : ''}>{suggestion.text}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isInstalled ? (
                      <div className="flex items-center space-x-1 text-green-400 text-xs">
                        <span>✓</span>
                        <span>Installed</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => installSuggestion(index, suggestion)}
                        disabled={isInstalling}
                        variant="outline"
                        size="sm"
                        className="bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30 text-xs px-2 py-1 h-auto"
                      >
                        {isInstalling ? 'Installing...' : 'Install'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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