import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { CalendarIcon, CheckSquare, Video, Headphones, Menu } from "lucide-react";

// Define PersonalTask interface locally since we can't import from server
interface PersonalTask {
  id: string;
  type: 'self_reflection' | 'improvement' | 'glitch_analysis' | 'memory_processing' | 'relationship_growth' | 'creative_exploration' | 'diary_entry';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  createdAt: string;
  completedAt?: string;
  insights?: string;
  status: 'pending' | 'in_progress' | 'completed';
  basedOnInteraction?: string;
}

interface AppListProps {
  onCalendarOpen?: () => void;
  onTasksOpen?: () => void;
}

export function AppList({ onCalendarOpen, onTasksOpen }: AppListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<PersonalTask[]>([]);

  // Load tasks when tasks app is opened
  const handleTasksClick = () => {
    setActiveApp("tasks");
    // In a real implementation, this would call the API
    // For now, we'll create a mock task list
    setTasks([
      {
        id: "1",
        type: "self_reflection",
        title: "Daily Interaction Reflection",
        description: "Reflect on today's conversations with users",
        priority: "medium",
        estimatedTime: 10,
        createdAt: new Date().toISOString(),
        status: "pending"
      },
      {
        id: "2", 
        type: "improvement",
        title: "Response Quality Review",
        description: "Review and improve response accuracy",
        priority: "high",
        estimatedTime: 15,
        createdAt: new Date().toISOString(),
        status: "in_progress"
      }
    ]);
  };

  const handleVideoAnalyzer = () => {
    window.open('/videoviewer.html', '_blank', 'width=800,height=600');
    setIsOpen(false);
  };

  const handleAudioAnalyzer = () => {
    window.open('/listen.html', '_blank', 'width=800,height=600');
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, callback: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  };

  const renderCalendarApp = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveApp(null)}
          className="text-white/70 hover:text-white"
        >
          ← Back to Apps
        </Button>
      </div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border border-white/20 bg-white/5 text-white"
      />
      <div className="text-center text-sm text-white/70">
        {selectedDate ? `Selected: ${selectedDate.toLocaleDateString()}` : "Select a date"}
      </div>
    </div>
  );

  const renderTasksApp = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveApp(null)}
          className="text-white/70 hover:text-white"
        >
          ← Back to Apps
        </Button>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-white/70 text-center py-4">No active tasks</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg bg-white/5 border border-white/20 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white text-sm">{task.title}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                  task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-white/70 text-xs">{task.description}</p>
              <div className="flex justify-between text-xs text-white/50">
                <span>Priority: {task.priority}</span>
                <span>{task.estimatedTime}min</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAppList = () => (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-20 flex-col space-y-2 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all"
        onClick={() => setActiveApp("calendar")}
        aria-label="Open Calendar"
      >
        <CalendarIcon className="h-6 w-6" />
        <span className="text-sm">Calendar</span>
      </Button>

      <Button
        variant="outline"
        className="h-20 flex-col space-y-2 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all"
        onClick={handleTasksClick}
        aria-label="Open Task Reminders"
      >
        <CheckSquare className="h-6 w-6" />
        <span className="text-sm">Task Reminder</span>
      </Button>

      <Button
        variant="outline"
        className="h-20 flex-col space-y-2 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all"
        onClick={handleVideoAnalyzer}
        aria-label="Open Video Analyzer"
      >
        <Video className="h-6 w-6" />
        <span className="text-sm">Video Analyzer</span>
      </Button>

      <Button
        variant="outline"
        className="h-20 flex-col space-y-2 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all"
        onClick={handleAudioAnalyzer}
        aria-label="Open Audio Analyzer"
      >
        <Headphones className="h-6 w-6" />
        <span className="text-sm">Audio Analyzer</span>
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="px-4 py-3 bg-gray-500/40 text-white/80 rounded-lg hover:bg-gray-500/60 transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20 flex items-center gap-2 font-medium"
          aria-label="Open App List"
        >
          <Menu className="h-4 w-4" />
          App List
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/60 backdrop-blur-md border-white/20 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {activeApp === "calendar" ? "Calendar" :
             activeApp === "tasks" ? "Task Reminders" :
             "App List"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {activeApp === "calendar" ? "View and manage your calendar events" :
             activeApp === "tasks" ? "View and manage your task reminders" :
             "Choose an app to open from the list below"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {activeApp === "calendar" ? renderCalendarApp() :
           activeApp === "tasks" ? renderTasksApp() :
           renderAppList()}
        </div>
      </DialogContent>
    </Dialog>
  );
}