import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming this path is correct

interface CentralDockProps {
  onToggleSharedNotepad: () => void;
}

export const CentralDock: React.FC<CentralDockProps> = ({
  onToggleSharedNotepad,
}) => {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2">
      <Button variant="outline" size="sm" onClick={onToggleSharedNotepad}>
        Shared Notepad
      </Button>
      {/* Add more buttons for other functions here */}
    </div>
  );
};
