import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Message } from "@shared/schema";

interface ConversationExchange {
  userMessage: string;
  assistantMessage: string;
  timestamp: Date;
}

interface ConversationContextType {
  recentExchanges: ConversationExchange[];
  userName: string | null;
  addExchange: (userMessage: string, assistantMessage: string) => void;
  getConversationContext: () => string[];
  getRecentMessages: () => Array<{ role: 'user' | 'assistant'; content: string }>;
  extractAndSetUserName: (message: string) => void;
  clearMemory: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function useConversationMemory() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error("useConversationMemory must be used within a ConversationProvider");
  }
  return context;
}

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [recentExchanges, setRecentExchanges] = useState<ConversationExchange[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  // Keep only the last 5 exchanges for memory
  const MAX_EXCHANGES = 5;

  const addExchange = (userMessage: string, assistantMessage: string) => {
    const newExchange: ConversationExchange = {
      userMessage,
      assistantMessage,
      timestamp: new Date()
    };

    setRecentExchanges(prev => {
      const updated = [...prev, newExchange];
      // Keep only the most recent exchanges
      return updated.slice(-MAX_EXCHANGES);
    });
  };

  const getConversationContext = (): string[] => {
    return recentExchanges.flatMap(exchange => [
      `User: ${exchange.userMessage}`,
      `Milla: ${exchange.assistantMessage}`
    ]);
  };

  // Get the last 4 individual messages (not exchanges) for AI context
  const getRecentMessages = (): Array<{ role: 'user' | 'assistant'; content: string }> => {
    const allMessages = recentExchanges.flatMap(exchange => [
      { role: 'user' as const, content: exchange.userMessage },
      { role: 'assistant' as const, content: exchange.assistantMessage }
    ]);
    return allMessages.slice(-4); // Last 4 messages
  };

  // Extract user name from message patterns
  const extractAndSetUserName = (message: string) => {
    console.log('Attempting to extract name from:', message); // Debug log
    const namePatterns = [
      /my name is ([a-zA-Z]+)/i,
      /i'm ([a-zA-Z]+)/i,
      /i am ([a-zA-Z]+)/i,
      /call me ([a-zA-Z]+)/i,
      /name's ([a-zA-Z]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();
        console.log('Name extracted:', extractedName); // Debug log
        if (extractedName.length > 1 && extractedName.length < 20) { // Reasonable name length
          setUserName(extractedName);
          console.log('userName set to:', extractedName); // Debug log
          break;
        }
      }
    }
  };

  const clearMemory = () => {
    setRecentExchanges([]);
    setUserName(null);
  };

  return (
    <ConversationContext.Provider 
      value={{
        recentExchanges,
        userName,
        addExchange,
        getConversationContext,
        getRecentMessages,
        extractAndSetUserName,
        clearMemory
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}