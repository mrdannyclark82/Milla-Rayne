
import React, { useState, useCallback } from 'react';

export function GuidedMeditation() {
  const [meditation, setMeditation] = useState('');
  const [isMeditating, setIsMeditating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startMeditation = useCallback(async () => {
    setIsMeditating(true);
    setError(null);
    setMeditation('');

    try {
      const response = await fetch('/api/guided-meditation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'letting go of stress',
          duration: 5, // 5 minutes
        }),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Meditation request failed: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          setIsMeditating(false);
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        setMeditation((prev) => prev + chunk);
        read(); // Continue reading the stream
      };

      read();

    } catch (err) {
      console.error('Failed to start guided meditation:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsMeditating(false);
    }
  }, []);

  return (
    <div className="guided-meditation-container p-4 border rounded-lg shadow-md bg-white/10 backdrop-blur-sm text-white">
      <h2 className="text-xl font-bold mb-4">Guided Meditation</h2>
      <button
        onClick={startMeditation}
        disabled={isMeditating}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
      >
        {isMeditating ? 'Meditation in Progress...' : 'Start 5-Minute Meditation on Stress Relief'}
      </button>

      {error && (
        <div className="text-red-400 mt-4">
          <p>Sorry, my love. I had a little trouble starting the meditation:</p>
          <p>{error}</p>
        </div>
      )}

      {meditation && (
        <div className="meditation-script mt-4 p-4 bg-black/20 rounded">
          <p className="whitespace-pre-wrap">{meditation}</p>
        </div>
      )}
    </div>
  );
}
