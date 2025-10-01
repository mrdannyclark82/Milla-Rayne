import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);

  // Initialize speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Try to select a female voice by default
      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('victoria')
      );

      setSelectedVoice(femaleVoice || voices[0] || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Speak the response if voice is enabled
      if (voiceEnabled && selectedVoice) {
        speakMessage(assistantMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
    }
  };



  return (
    <div className="min-h-screen bg-black">
      {/* Portrait Image - Left Side */}
      <div className="fixed top-0 left-0 w-2/3 h-screen flex items-center justify-center bg-gray-900">
        <img
          src="/milla_new.jpg"
          alt="Milla Portrait"
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            console.log('Image failed to load');
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = '<div class="text-white text-2xl">Image not found</div>';
          }}
        />
      </div>

      {/* Chat Interface - Fixed Right Side */}
      <div className="fixed top-0 right-0 w-1/3 h-screen p-4 bg-black">
        <div className="h-full flex flex-col space-y-4">
          {/* Voice controls */}
          <div className="flex gap-2 justify-end">
            <Button
              onClick={toggleVoice}
              variant={voiceEnabled ? "default" : "outline"}
              size="sm"
              title="Toggle voice output"
            >
              {voiceEnabled ? '🔊' : '🔇'} Voice {voiceEnabled ? 'On' : 'Off'}
            </Button>
            <Button
              onClick={toggleListening}
              variant={isListening ? "default" : "outline"}
              size="sm"
              disabled={isLoading}
              title="Click to speak"
              className={isListening ? 'animate-pulse' : ''}
            >
              {isListening ? '🎤' : '🎙️'} {isListening ? 'Listening...' : 'Speak'}
            </Button>
          </div>

          {/* Messages - Fixed height with scrolling */}
          <div className="h-[calc(100vh-180px)] overflow-y-auto space-y-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center">
                Start a conversation with Milla...
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${msg.role === 'user'
                    ? 'bg-blue-600 ml-auto max-w-[80%] text-white'
                    : 'bg-gray-700 mr-auto max-w-[80%] text-white'
                    }`}
                >
                  <p className="text-sm font-semibold mb-1 text-gray-300">
                    {msg.role === 'user' ? 'You' : 'Milla'}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Input - Fixed at bottom */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message or click the microphone to speak..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <Button
              onClick={toggleListening}
              variant={isListening ? "default" : "outline"}
              disabled={isLoading}
              title="Click to speak"
              className={isListening ? 'animate-pulse' : ''}
            >
              {isListening ? '🎤' : '🎙️'}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
