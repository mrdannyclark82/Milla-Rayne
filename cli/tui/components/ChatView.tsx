import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const ChatView: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages?limit=10`);
      if (Array.isArray(response.data)) {
        setHistory(response.data.reverse()); // Assuming API returns newest first? CLI implementation showed slice(-5).
        // Let's assume standard order or fix later. CLI says `messages.slice(-5).forEach` implying they are in order.
        setHistory(response.data);
      }
    } catch (e) {
      // Ignore initial load error
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, { message: userMsg.content });
      const reply = response.data.response || response.data;

      const assistantMsg: Message = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setHistory(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1} flexDirection="column" justifyContent="flex-end" overflow="hidden">
        {history.slice(-15).map((msg, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Text color={msg.role === 'user' ? 'cyan' : 'magenta'} bold>
              {msg.role === 'user' ? 'You' : 'Milla'}:
            </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))}
        {isLoading && (
            <Box>
                <Text color="magenta"><Spinner type="dots" /> Milla is thinking...</Text>
            </Box>
        )}
        {error && <Text color="red">Error: {error}</Text>}
      </Box>

      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text color="cyan">You: </Text>
        <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  );
};
