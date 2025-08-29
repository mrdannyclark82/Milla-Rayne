import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Message } from "@shared/schema";

interface ConversationExchange {
  userMessage: string;
  assistantMessage: string;
  timestamp: Date;
}

interface ConversationContextType {
  recentExchanges: ConversationExchange[];
  addExchange: (userMessage: string, assistantMessage: string) => void;
  getConversationContext: () => string[];
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

  const clearMemory = () => {
    setRecentExchanges([]);
  };

  return (
    <ConversationContext.Provider 
      value={{
        recentExchanges,
        addExchange,
        getConversationContext,
        clearMemory
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}