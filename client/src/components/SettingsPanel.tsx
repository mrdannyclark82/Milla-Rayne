import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AvatarCustomizer } from "./AvatarCustomizer";

type AvatarSettings = {
  style: 'realistic' | 'anime' | 'artistic' | 'minimal';
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  outfit: 'casual' | 'elegant' | 'professional' | 'intimate';
  expression: 'loving' | 'playful' | 'mysterious' | 'gentle';
  background: 'gradient' | 'solid' | 'nature' | 'abstract';
  lighting: number;
  glow: number;
};

interface SettingsPanelProps {
  children?: React.ReactNode;
  voiceEnabled?: boolean;
  onVoiceToggle?: (enabled: boolean) => void;
  speechRate?: number;
  onSpeechRateChange?: (rate: number) => void;
}

export default function SettingsPanel({ 
  children, 
  voiceEnabled = false, 
  onVoiceToggle,
  speechRate = 1.0,
  onSpeechRateChange 
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>({
    style: 'realistic',
    hairColor: 'auburn',
    eyeColor: 'green',
    skinTone: 'warm',
    outfit: 'elegant',
    expression: 'loving',
    background: 'gradient',
    lighting: 75,
    glow: 60
  });

  const handleVoiceToggle = () => {
    onVoiceToggle?.(!voiceEnabled);
  };

  const handleSpeechRateChange = () => {
    const newRate = speechRate >= 1.5 ? 0.75 : speechRate + 0.25;
    onSpeechRateChange?.(newRate);
  };

  const getSpeechRateLabel = () => {
    if (speechRate <= 0.75) return "Slow";
    if (speechRate >= 1.5) return "Fast";
    return "Normal";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {/* Appearance Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-palette mr-2 text-purple-400"></i>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Theme</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                    <i className="fas fa-sun mr-1"></i>
                    Light
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white bg-white/20">
                    <i className="fas fa-moon mr-1"></i>
                    Dark
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Background Blur</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-sliders-h mr-1"></i>
                  Adjust
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Chat Transparency</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-adjust mr-1"></i>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Customization Section */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <AvatarCustomizer 
              currentSettings={avatarSettings}
              onSettingsChange={setAvatarSettings}
            />
          </div>

          {/* Personality Tuning Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-brain mr-2 text-blue-400"></i>
                Personality Tuning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Communication Style</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-comments mr-1"></i>
                  Adaptive
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Formality Level</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-balance-scale mr-1"></i>
                  Balanced
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Response Length</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-text-width mr-1"></i>
                  Medium
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Emotional Intelligence</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-heart mr-1"></i>
                  High
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Settings Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-volume-up mr-2 text-green-400"></i>
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Voice Responses</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-white/30 text-white/70 hover:text-white ${voiceEnabled ? 'bg-green-600/20 border-green-400/50 text-green-300' : ''}`}
                  onClick={handleVoiceToggle}
                  data-testid="button-voice-toggle"
                >
                  <i className={`fas ${voiceEnabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
                  {voiceEnabled ? 'On' : 'Off'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Voice Input</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-microphone mr-1"></i>
                  Available
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Speech Rate</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/30 text-white/70 hover:text-white"
                  onClick={handleSpeechRateChange}
                  data-testid="button-speech-rate"
                >
                  <i className="fas fa-tachometer-alt mr-1"></i>
                  {getSpeechRateLabel()}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Tasks Section */}
          <PersonalTasksSection />
        </div>

        <Separator className="bg-white/20" />

        {/* Footer */}
        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-white/30 text-white/70 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setIsOpen(false)}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Personal Tasks Section Component
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

interface TaskSummary {
  pending: number;
  inProgress: number;
  completed: number;
}

function PersonalTasksSection() {
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);

  const { data: tasksData } = useQuery<{ tasks: PersonalTask[]; success: boolean }>({
    queryKey: ["/api/personal-tasks"],
    refetchInterval: 30000,
  });

  const { data: summaryData } = useQuery<{ summary: TaskSummary; success: boolean }>({
    queryKey: ["/api/task-summary"],
    refetchInterval: 30000,
  });

  const tasks = tasksData?.tasks || [];
  const summary = summaryData?.summary || { pending: 0, inProgress: 0, completed: 0 };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'self_reflection': return 'fas fa-mirror';
      case 'improvement': return 'fas fa-arrow-up';
      case 'glitch_analysis': return 'fas fa-bug';
      case 'memory_processing': return 'fas fa-brain';
      case 'relationship_growth': return 'fas fa-heart';
      case 'creative_exploration': return 'fas fa-palette';
      case 'diary_entry': return 'fas fa-book';
      default: return 'fas fa-tasks';
    }
  };

  const startTask = async (taskId: string) => {
    try {
      await apiRequest("POST", `/api/personal-tasks/${taskId}/start`, {});
      window.location.reload();
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const completeTask = async (taskId: string, insights: string) => {
    try {
      await apiRequest("POST", `/api/personal-tasks/${taskId}/complete`, { insights });
      setSelectedTask(null);
      window.location.reload();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <i className="fas fa-brain mr-2 text-purple-400"></i>
          Milla's Personal Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Summary */}
        <div className="flex space-x-4 text-sm">
          <span className="text-yellow-400">
            <i className="fas fa-clock mr-1"></i>
            {summary.pending} pending
          </span>
          <span className="text-blue-400">
            <i className="fas fa-play mr-1"></i>
            {summary.inProgress} in progress
          </span>
          <span className="text-green-400">
            <i className="fas fa-check mr-1"></i>
            {summary.completed} completed
          </span>
        </div>
        
        {/* Recent Tasks */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              <i className="fas fa-sleep text-xl mb-2"></i>
              <p className="text-sm">No personal tasks yet.</p>
              <p className="text-xs">Milla will generate tasks based on your interactions.</p>
            </div>
          ) : (
            tasks
              .filter(task => task.status === 'pending' || task.status === 'in_progress')
              .slice(0, 3)
              .map((task) => (
                <div key={task.id} className="bg-white/5 border border-white/10 rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <i className={`${getTypeIcon(task.type)} text-purple-300 text-xs`}></i>
                        <span className="text-sm font-medium text-purple-200">{task.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2 line-clamp-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          <i className="fas fa-clock mr-1"></i>
                          {task.estimatedTime} min
                        </span>
                        {task.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-300 hover:text-purple-200 text-xs h-6"
                            onClick={() => startTask(task.id)}
                          >
                            Start
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-300 hover:text-green-200 text-xs h-6"
                            onClick={() => setSelectedTask(task)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Task Completion Modal */}
        {selectedTask && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <Card className="bg-black/80 border border-purple-500/20 p-4 max-w-md w-full">
              <h4 className="text-purple-200 font-medium mb-2">Complete Task</h4>
              <p className="text-sm text-gray-300 mb-3">{selectedTask.title}</p>
              <textarea
                placeholder="What insights did Milla gain from this task?"
                className="w-full bg-transparent border border-purple-500/20 rounded p-2 text-sm text-white placeholder:text-gray-400 resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    const insights = (e.target as HTMLTextAreaElement).value;
                    completeTask(selectedTask.id, insights);
                  }
                }}
              />
              <div className="flex justify-end space-x-2 mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                    const insights = textarea?.value || "";
                    completeTask(selectedTask.id, insights);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Complete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}