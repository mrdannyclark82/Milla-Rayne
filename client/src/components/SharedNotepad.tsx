import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea'; // Assuming this path is correct
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SharedNotepadProps {
  // Props for controlling visibility, content, etc.
  isOpen: boolean;
  onClose: () => void;
}

export const SharedNotepad: React.FC<SharedNotepadProps> = ({ isOpen, onClose }) => {
  const [noteContent, setNoteContent] = useState('');

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-20 left-1/2 -translate-x-1/2 w-96 h-64 bg-neutral-100/90 backdrop-blur-md shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-neutral-900">Shared Notepad</CardTitle>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900">
          &times;
        </button>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0">
        <Textarea
          className="w-full h-full bg-white/50 border-neutral-300 text-neutral-900 placeholder:text-neutral-500 resize-none"
          placeholder="Start typing your shared notes here..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
        />
      </CardContent>
    </Card>
  );
};
