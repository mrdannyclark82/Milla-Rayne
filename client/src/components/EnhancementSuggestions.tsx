import React, { useState } from "react";

/**
 * EnhancementSuggestions component fetches and displays AI-generated project enhancement suggestions.
 */
const EnhancementSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const res = await fetch("/api/suggest-enhancements", {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4">AI Enhancement Suggestions</h2>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={fetchSuggestions}
        disabled={loading}
      >
        {loading ? "Loading..." : "Get Suggestions"}
      </button>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {suggestions && (
        <div className="mt-6 whitespace-pre-line border-t pt-4 text-gray-800">
          {suggestions}
        </div>
      )}
    </div>
  );
};

export default EnhancementSuggestions;
