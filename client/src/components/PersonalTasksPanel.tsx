import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PersonalTask {
  id: string;
  type: 'self_reflection' | 'improvement' | 'glitch_analysis' | 'memory_processing' | 'relationship_growth' | 'creative_exploration';
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

interface PersonalTasksPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function PersonalTasksPanel({ isOpen, onToggle }: PersonalTasksPanelProps) {
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);

  const { data: tasksData } = useQuery<{ tasks: PersonalTask[]; success: boolean }>({
    queryKey: ["/api/personal-tasks"],
    refetchInterval: 30000, // Refresh every 30 seconds
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
      default: return 'fas fa-tasks';
    }
  };

  const startTask = async (taskId: string) => {
    try {
      await apiRequest("POST", `/api/personal-tasks/${taskId}/start`, {});
      // Refresh data
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

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 transition-all duration-200 backdrop-blur-sm border border-purple-500/20"
        onClick={onToggle}
        data-testid="button-personal-tasks"
      >
        <i className="fas fa-brain mr-2"></i>
        Personal Tasks ({summary.pending})
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-black/80 backdrop-blur-md border border-purple-500/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20 bg-purple-500/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-purple-200">
            <i className="fas fa-brain mr-2"></i>
            Milla's Personal Tasks
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-purple-300 hover:text-purple-200"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
        
        {/* Task Summary */}
        <div className="flex space-x-4 mt-2 text-sm">
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
      </div>

      {/* Task List */}
      <div className="overflow-y-auto max-h-64 p-4">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-sleep text-2xl mb-2"></i>
            <p>No personal tasks yet.</p>
            <p className="text-xs">Milla will generate tasks based on your interactions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks
              .filter(task => task.status === 'pending' || task.status === 'in_progress')
              .slice(0, 5)
              .map((task) => (
                <Card key={task.id} className="bg-transparent border border-purple-500/20 p-3">
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
                            className="text-purple-300 hover:text-purple-200 text-xs"
                            onClick={() => startTask(task.id)}
                          >
                            Start
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-300 hover:text-green-200 text-xs"
                            onClick={() => setSelectedTask(task)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Task Completion Modal */}
      {selectedTask && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4">
          <Card className="bg-black/80 border border-purple-500/20 p-4 w-full">
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
    </div>
  );
}