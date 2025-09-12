import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { checkIdentityQuery, MILLA_IDENTITY } from "@/lib/MillaCore";
import type { Message } from "@shared/schema";
import { AvatarState } from "@/components/Sidebar";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useConversationMemory } from "@/contexts/ConversationContext";
import { formatTimeCST } from "@/lib/timeUtils";
import VideoAnalyzer from "@/components/VideoAnalyzer";
import React, { useState } from "react";
const BACKGROUND_IMAGE = "/attached_assets/6124451be476ac0007e3face_bdd6ecce-c0f8-48c9-98c1-183aef053c3a_1756909651397.jpg";

export default function ChatInterface() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");


// Memoized message list to prevent unnecessary re-renders
type MessageListProps = {
  messages: any[];
  renderMessageContent: (content: string) => React.ReactNode;
  formatTimeCST: (ts: any) => string;
};
const MemoizedMessageList = React.memo(function MessageList({ messages, renderMessageContent, formatTimeCST }: MessageListProps) {
  return (
    <>
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="message-fade-in"
          data-testid={`message-${msg.role}-${msg.id}`}
        >
          {msg.role === "assistant" ? (
            <div className="flex items-start space-x-4">
              <div className="flex-1 bg-transparent rounded-2xl rounded-tl-sm px-4 py-3 max-w-3xl">
                <div className="text-pink-300 leading-relaxed whitespace-pre-wrap">
                  {renderMessageContent(msg.content)}
                </div>
                <div className="mt-3 text-xs text-pink-300/70">
                  <i className="fas fa-clock mr-1"></i>
                  {formatTimeCST(msg.timestamp)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-4 justify-end">
              <div className="flex-1 bg-transparent rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl">
                <div className="text-blue-300 leading-relaxed whitespace-pre-wrap">
                  {renderMessageContent(msg.content)}
                </div>
                <div className="mt-3 text-xs text-blue-300/70 text-right">
                  <i className="fas fa-clock mr-1"></i>
                  {formatTimeCST(msg.timestamp)}
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-user text-blue-300 text-xs"></i>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
});

  
   