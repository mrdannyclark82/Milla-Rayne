/**
 * Assistant UI Component Integration
 * Production-ready chat interface with streaming support
 * Built on @assistant-ui/react for enterprise-grade UX
 */

import React from 'react';
// @ts-expect-error - ai/react types may not be available yet
import { useChat } from 'ai/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Send, User, Bot } from 'lucide-react';

interface AssistantUIProps {
  apiEndpoint?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
  className?: string;
}

export function AssistantUI({
  apiEndpoint = '/api/chat',
  systemPrompt,
  welcomeMessage = "Hi! I'm Milla, your AI companion. How can I help you today?",
  className = '',
}: AssistantUIProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: apiEndpoint,
    initialMessages: welcomeMessage
      ? [
          {
            id: 'welcome',
            role: 'assistant',
            content: welcomeMessage,
          },
        ]
      : [],
    body: {
      systemPrompt,
    },
  });

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Milla AI</h2>
          <p className="text-sm text-muted-foreground">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Milla is thinking...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              Error: {error.message}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-primary'
            : 'bg-gradient-to-br from-purple-500 to-pink-500'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        <div className="prose prose-sm dark:prose-invert">
          {content.split('\n').map((line, i) => (
            <p key={i} className="mb-1 last:mb-0">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Assistant Widget
 * Embeddable chat widget for any page
 */
export function AssistantWidget() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden">
          <AssistantUI />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
