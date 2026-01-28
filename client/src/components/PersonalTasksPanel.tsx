import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Brain,
  Clock,
  Play,
  Check,
  Moon,
  Mirror,
  ArrowUp,
  Bug,
  Heart,
  Palette,
  Book,
  ListTodo,
  Loader2
} from 'lucide-react';

interface PersonalTask {
  id: string;
  type:
    | 'self_reflection'
    | 'improvement'
    | 'glitch_analysis'
    | 'memory_processing'
    | 'relationship_growth'
    | 'creative_exploration'
    | 'diary_entry';
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

export function PersonalTasksPanel() {
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);

  const { data: tasksData, isLoading: tasksLoading } = useQuery<{
    tasks: PersonalTask[];
    success: boolean;
  }>({
    queryKey: ['/api/personal-tasks'],
    refetchInterval: 30000,
  });

  const { data: summaryData } = useQuery<{
    summary: TaskSummary;
    success: boolean;
  }>({
    queryKey: ['/api/task-summary'],
    refetchInterval: 30000,
  });

  const tasks = tasksData?.tasks || [];
  const summary = summaryData?.summary || {
    pending: 0,
    inProgress: 0,
    completed: 0,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-400/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'low':
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'self_reflection': return <Mirror className="w-3 h-3" />;
      case 'improvement': return <ArrowUp className="w-3 h-3" />;
      case 'glitch_analysis': return <Bug className="w-3 h-3" />;
      case 'memory_processing': return <Brain className="w-3 h-3" />;
      case 'relationship_growth': return <Heart className="w-3 h-3" />;
      case 'creative_exploration': return <Palette className="w-3 h-3" />;
      case 'diary_entry': return <Book className="w-3 h-3" />;
      default: return <ListTodo className="w-3 h-3" />;
    }
  };

  const startTask = async (taskId: string) => {
    try {
      await apiRequest(`/api/personal-tasks/${taskId}/start`, {
        method: 'POST',
      });
      // Query client will automatically refetch due to invalidation if configured, or wait for interval
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const completeTask = async (taskId: string, insights: string) => {
    try {
      await apiRequest(`/api/personal-tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ insights }),
      });
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  return (
    <Card className="bg-black/40 backdrop-blur-lg border border-white/10 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Milla's Personal Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
        {/* Task Summary */}
        <div className="flex space-x-4 text-sm bg-white/5 p-3 rounded-lg border border-white/10">
          <span className="text-yellow-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {summary.pending} pending
          </span>
          <span className="text-blue-400 flex items-center gap-1">
            <Play className="w-4 h-4" />
            {summary.inProgress} in progress
          </span>
          <span className="text-green-400 flex items-center gap-1">
            <Check className="w-4 h-4" />
            {summary.completed} completed
          </span>
        </div>

        {/* Recent Tasks */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-2">
          {tasksLoading ? (
             <div className="flex justify-center p-4">
               <Loader2 className="w-6 h-6 animate-spin text-white/40" />
             </div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-8 flex flex-col items-center">
              <Moon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No personal tasks yet.</p>
              <p className="text-xs text-white/40 mt-1">
                Milla will generate tasks based on your interactions.
              </p>
            </div>
          ) : (
            tasks
              .filter(
                (task) =>
                  task.status === 'pending' || task.status === 'in_progress'
              )
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-purple-300">
                          {getTypeIcon(task.type)}
                        </span>
                        <span className="text-sm font-medium text-purple-200 truncate">
                          {task.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimatedTime} min
                        </span>
                        {task.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-300 hover:text-purple-200 text-xs h-6 px-2 hover:bg-purple-500/20"
                            onClick={() => startTask(task.id)}
                          >
                            Start
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-300 hover:text-green-200 text-xs h-6 px-2 hover:bg-green-500/20"
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
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 rounded-2xl">
            <Card className="bg-[#0f0f1a] border border-purple-500/20 p-4 max-w-md w-full shadow-2xl">
              <h4 className="text-purple-200 font-medium mb-2 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Complete Task
              </h4>
              <p className="text-sm text-gray-300 mb-3">{selectedTask.title}</p>
              <textarea
                placeholder="What insights did Milla gain from this task?"
                className="w-full bg-black/40 border border-purple-500/20 rounded p-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-purple-500/50"
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
                  className="text-gray-400 hover:text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    const textarea = e.currentTarget.parentElement
                      ?.previousElementSibling as HTMLTextAreaElement;
                    const insights = textarea?.value || '';
                    completeTask(selectedTask.id, insights);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
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
