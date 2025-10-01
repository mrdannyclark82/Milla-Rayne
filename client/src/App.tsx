import React, { useState, useEffect } from 'react';
import Avatar3D from './components/Avatar3D';
import InteractiveAvatar from './components/InteractiveAvatar';
import { DynamicAvatar } from './components/DynamicAvatar';
import LivingAvatar from './components/LivingAvatar';
import AvatarSidebar from './components/AvatarSidebar';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';

type AvatarType = '3d' | 'interactive' | 'dynamic' | 'living';

function App() {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>('interactive');
  const [avatarState, setAvatarState] = useState<"neutral" | "thinking" | "responding" | "listening">('neutral');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarSettings] = useState({
    style: 'realistic' as const,
    hairColor: '#1a1a1a',
    eyeColor: '#2563eb',
    skinTone: '#f0d9c4',
    outfit: 'elegant' as const,
    expression: 'loving' as const,
    background: 'gradient' as const,
    lighting: 70,
    glow: 50
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAvatarState('thinking');
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
      setAvatarState('responding');
      setIsSpeaking(true);

      // Simulate speaking duration
      setTimeout(() => {
        setIsSpeaking(false);
        setAvatarState('neutral');
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setAvatarState('neutral');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAvatar = () => {
    const commonProps = {
      avatarState,
      personalityMode: 'loving'
    };

    switch (selectedAvatar) {
      case '3d':
        return <Avatar3D {...commonProps} isSpeaking={isSpeaking} />;
      case 'interactive':
        return <InteractiveAvatar {...commonProps} />;
      case 'dynamic':
        return <DynamicAvatar {...commonProps} settings={avatarSettings} />;
      case 'living':
        return <LivingAvatar {...commonProps} />;
      default:
        return <InteractiveAvatar {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900">
      <div className="container mx-auto p-4">
        <header className="text-center py-6">
          <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-2">
            Milla Rayne
          </h1>
          <p className="text-lg text-purple-600 dark:text-purple-300">
            Your AI Companion
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Display */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Avatar Display</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedAvatar === 'interactive' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAvatar('interactive')}
                    >
                      Interactive
                    </Button>
                    <Button
                      variant={selectedAvatar === '3d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAvatar('3d')}
                    >
                      3D
                    </Button>
                    <Button
                      variant={selectedAvatar === 'dynamic' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAvatar('dynamic')}
                    >
                      Dynamic
                    </Button>
                    <Button
                      variant={selectedAvatar === 'living' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAvatar('living')}
                    >
                      Living
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center min-h-[400px]">
                  {renderAvatar()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AvatarSidebar />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="mt-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Chat with Milla</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages */}
                <div className="h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      Start a conversation with Milla...
                    </p>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-purple-100 dark:bg-purple-900 ml-auto max-w-[80%]'
                            : 'bg-pink-100 dark:bg-pink-900 mr-auto max-w-[80%]'
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">
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
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
