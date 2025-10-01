import React, { useState } from 'react';
import { Button } from './components/ui/button';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
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
        <div className="h-full flex flex-col">
          <div className="flex-1 flex flex-col space-y-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
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

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                disabled={isLoading}
              />
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
    </div>
  );
}

export default App;
