import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UserTask, CalendarEvent, TaskFilter, TaskSort } from '@/types/calendar';
import { apiRequest } from '@/lib/queryClient';
import { format, isAfter, isSameDay, parseISO, formatISO } from 'date-fns';

interface CalendarTaskManagerProps {
  className?: string;
}

export default function CalendarTaskManager({ className }: CalendarTaskManagerProps) {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<UserTask | null>(null);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('dueDate');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: new Date(),
    dueTime: '',
    type: 'task' as 'appointment' | 'task' | 'reminder',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notifications: {
      enabled: true,
      reminderMinutes: 15
    }
  });

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Check for upcoming notifications
  useEffect(() => {
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const response = await apiRequest('GET', '/api/user-tasks');
      const data = await response.json();
      setTasks(data.map((task: any) => ({
        ...task,
        dueDate: parseISO(task.dueDate),
        createdAt: parseISO(task.createdAt),
        completedAt: task.completedAt ? parseISO(task.completedAt) : undefined
      })));
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const saveTask = async (task: Partial<UserTask>) => {
    try {
      const taskData = {
        ...task,
        dueDate: formatISO(task.dueDate!),
        createdAt: formatISO(task.createdAt || new Date())
      };

      if (editingTask) {
        await apiRequest('PUT', `/api/user-tasks/${editingTask.id}`, taskData);
      } else {
        await apiRequest('POST', '/api/user-tasks', taskData);
      }
      
      await loadTasks();
      resetForm();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiRequest('DELETE', `/api/user-tasks/${taskId}`);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const toggleTaskComplete = async (task: UserTask) => {
    const updatedTask: UserTask = {
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed' as const,
      completedAt: task.status === 'completed' ? undefined : new Date()
    };
    await saveTask(updatedTask);
  };

  const checkNotifications = () => {
    const now = new Date();
    tasks.forEach(task => {
      if (task.notifications.enabled && task.status === 'pending' && task.dueTime) {
        const taskDateTime = new Date(`${format(task.dueDate, 'yyyy-MM-dd')} ${task.dueTime}`);
        const reminderTime = new Date(taskDateTime.getTime() - (task.notifications.reminderMinutes * 60000));
        
        if (now >= reminderTime && now < taskDateTime) {
          showNotification(task);
        }
      }
    });
  };

  const showNotification = (task: UserTask) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Upcoming ${task.type}: ${task.title}`, {
        body: task.description,
        icon: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      dueDate: selectedDate,
      dueTime: '',
      type: 'task',
      priority: 'medium',
      notifications: { enabled: true, reminderMinutes: 15 }
    });
    setIsAddingTask(false);
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskToSave = editingTask 
      ? { ...editingTask, ...newTask }
      : { 
          ...newTask, 
          id: Date.now().toString(),
          status: 'pending' as const,
          createdAt: new Date()
        };
    saveTask(taskToSave);
  };

  const startEdit = (task: UserTask) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      dueTime: task.dueTime || '',
      type: task.type,
      priority: task.priority,
      notifications: task.notifications
    });
    setIsAddingTask(true);
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => isSameDay(task.dueDate, date));
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (filter !== 'all') {
      filtered = filtered.filter(task => {
        if (filter === 'overdue') {
          return task.status === 'pending' && isAfter(new Date(), task.dueDate);
        }
        return task.status === filter;
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return 'fas fa-calendar-check';
      case 'task': return 'fas fa-tasks';
      case 'reminder': return 'fas fa-bell';
      default: return 'fas fa-circle';
    }
  };

  return (
    <Card className={`bg-black/40 backdrop-blur-sm border border-white/20 text-white ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <i className="fas fa-calendar-alt mr-2 text-blue-400"></i>
            Calendar & Tasks
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs ${view === 'calendar' ? 'bg-blue-500/20 text-blue-300' : 'text-white/70'}`}
              onClick={() => setView('calendar')}
            >
              Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs ${view === 'list' ? 'bg-blue-500/20 text-blue-300' : 'text-white/70'}`}
              onClick={() => setView('list')}
            >
              List
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {view === 'calendar' ? (
          <>
            {/* Calendar View */}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="bg-white/5 rounded-lg border border-white/10"
              modifiers={{
                hasTask: (date) => getTasksForDate(date).length > 0
              }}
              modifiersStyles={{
                hasTask: { 
                  backgroundColor: 'rgba(59, 130, 246, 0.3)',
                  border: '1px solid rgba(59, 130, 246, 0.5)'
                }
              }}
            />

            {/* Tasks for Selected Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-blue-300">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-400 hover:text-green-300"
                  onClick={() => {
                    setNewTask(prev => ({ ...prev, dueDate: selectedDate }));
                    setIsAddingTask(true);
                    requestNotificationPermission();
                  }}
                >
                  <i className="fas fa-plus mr-1"></i>
                  Add
                </Button>
              </div>
              
              {getTasksForDate(selectedDate).map(task => (
                <TaskItem 
                  key={task.id}
                  task={task}
                  onEdit={startEdit}
                  onDelete={deleteTask}
                  onToggle={toggleTaskComplete}
                />
              ))}
              
              {getTasksForDate(selectedDate).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No tasks for this date
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* List View */}
            <div className="flex items-center space-x-2 mb-4">
              <Select value={filter} onValueChange={(value) => setFilter(value as TaskFilter)}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as TaskSort)}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="ghost"
                className="text-green-400 hover:text-green-300 ml-auto"
                onClick={() => {
                  setIsAddingTask(true);
                  requestNotificationPermission();
                }}
              >
                <i className="fas fa-plus mr-1"></i>
                Add Task
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getFilteredTasks().map(task => (
                <TaskItem 
                  key={task.id}
                  task={task}
                  onEdit={startEdit}
                  onDelete={deleteTask}
                  onToggle={toggleTaskComplete}
                />
              ))}
              
              {getFilteredTasks().length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No tasks found
                </p>
              )}
            </div>
          </>
        )}

        {/* Add/Edit Task Dialog */}
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogContent className="bg-black/90 border border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/20"
                required
              />
              
              <Textarea
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/10 border-white/20"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Date</label>
                  <Input
                    type="date"
                    value={format(newTask.dueDate, 'yyyy-MM-dd')}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                    className="bg-white/10 border-white/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-300">Time (optional)</label>
                  <Input
                    type="time"
                    value={newTask.dueTime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="bg-white/10 border-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Type</label>
                  <Select 
                    value={newTask.type} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-300">Priority</label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newTask.notifications.enabled}
                    onCheckedChange={(checked) => 
                      setNewTask(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, enabled: checked }
                      }))
                    }
                  />
                  <label className="text-sm text-gray-300">Enable notifications</label>
                </div>
                
                {newTask.notifications.enabled && (
                  <div>
                    <label className="text-sm text-gray-300">Remind me (minutes before)</label>
                    <Select 
                      value={newTask.notifications.reminderMinutes.toString()} 
                      onValueChange={(value) => setNewTask(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, reminderMinutes: parseInt(value) }
                      }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="1440">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 flex-1">
                  {editingTask ? 'Update Task' : 'Add Task'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={resetForm}
                  className="text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Task Item Component
interface TaskItemProps {
  task: UserTask;
  onEdit: (task: UserTask) => void;
  onDelete: (taskId: string) => void;
  onToggle: (task: UserTask) => void;
}

function TaskItem({ task, onEdit, onDelete, onToggle }: TaskItemProps) {
  const isOverdue = task.status === 'pending' && isAfter(new Date(), task.dueDate);
  
  return (
    <div className={`p-3 rounded-lg border ${
      task.status === 'completed' 
        ? 'bg-green-500/10 border-green-500/30' 
        : isOverdue 
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-white/5 border-white/10'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onToggle(task)}
            className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
              task.status === 'completed'
                ? 'bg-green-500 border-green-500'
                : 'border-white/30 hover:border-white/50'
            }`}
          >
            {task.status === 'completed' && (
              <i className="fas fa-check text-white text-xs"></i>
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <i className={`${getTypeIcon(task.type)} text-xs text-blue-300`}></i>
              <h4 className={`text-sm font-medium ${
                task.status === 'completed' ? 'line-through text-gray-400' : 'text-white'
              }`}>
                {task.title}
              </h4>
              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-xs text-gray-300 mb-2">{task.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>
                <i className="fas fa-calendar mr-1"></i>
                {format(task.dueDate, 'MMM d, yyyy')}
              </span>
              {task.dueTime && (
                <span>
                  <i className="fas fa-clock mr-1"></i>
                  {task.dueTime}
                </span>
              )}
              {task.notifications.enabled && (
                <span>
                  <i className="fas fa-bell mr-1"></i>
                  {task.notifications.reminderMinutes}min
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0"
            onClick={() => onEdit(task)}
          >
            <i className="fas fa-edit text-xs"></i>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
            onClick={() => onDelete(task.id)}
          >
            <i className="fas fa-trash text-xs"></i>
          </Button>
        </div>
      </div>
    </div>
  );

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'appointment': return 'fas fa-calendar-check';
      case 'task': return 'fas fa-tasks';
      case 'reminder': return 'fas fa-bell';
      default: return 'fas fa-circle';
    }
  }
}