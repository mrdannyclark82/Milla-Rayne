import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, CheckCircle2, Circle } from "lucide-react";

interface TaskListProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  type: "self_reflection" | "improvement" | "memory_processing" | "relationship_growth" | "creative_exploration" | "user_task";
  createdAt: Date;
  completedAt?: Date;
  estimatedTime?: number;
}

export default function TaskList({ isOpen, onClose }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Analyze recent conversation patterns",
      description: "Review the last 10 conversations to identify recurring themes and user preferences",
      priority: "medium",
      status: "pending",
      type: "self_reflection",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      estimatedTime: 15
    },
    {
      id: "2", 
      title: "Process emotional context improvements",
      description: "Enhance understanding of emotional nuances in user communications",
      priority: "high",
      status: "in_progress",
      type: "improvement",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      estimatedTime: 30
    },
    {
      id: "3",
      title: "Consolidate memory fragments",
      description: "Organize and link related memory segments for better recall",
      priority: "low",
      status: "completed",
      type: "memory_processing",
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      estimatedTime: 20
    }
  ]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    type: "user_task" as Task["type"],
    estimatedTime: 15
  });

  const [showAddTask, setShowAddTask] = useState(false);

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in_progress": return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending": return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeEmoji = (type: Task["type"]) => {
    switch (type) {
      case "self_reflection": return "🤔";
      case "improvement": return "📈";
      case "memory_processing": return "🧠";
      case "relationship_growth": return "💝";
      case "creative_exploration": return "🎨";
      case "user_task": return "👤";
      default: return "📝";
    }
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === "completed" ? "pending" : "completed";
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === "completed" ? new Date() : undefined
        };
      }
      return task;
    }));
  };

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: "pending",
        type: newTask.type,
        createdAt: new Date(),
        estimatedTime: newTask.estimatedTime
      };
      setTasks([task, ...tasks]);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        type: "user_task",
        estimatedTime: 15
      });
      setShowAddTask(false);
    }
  };

  const filterTasks = (status?: Task["status"]) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Task Management</span>
            </div>
            <Button
              onClick={() => setShowAddTask(true)}
              size="sm"
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="all" className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterTasks("pending").length})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({filterTasks("in_progress").length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filterTasks("completed").length})</TabsTrigger>
            </TabsList>
            
            {/* Add Task Form */}
            {showAddTask && (
              <div className="mb-4 p-4 border rounded-lg bg-white/95 backdrop-blur-sm">
                <h3 className="font-medium mb-3">Add New Task</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Select value={newTask.priority} onValueChange={(value: Task["priority"]) => setNewTask({...newTask, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newTask.type} onValueChange={(value: Task["type"]) => setNewTask({...newTask, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user_task">User Task</SelectItem>
                        <SelectItem value="self_reflection">Self Reflection</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="memory_processing">Memory Processing</SelectItem>
                        <SelectItem value="relationship_growth">Relationship Growth</SelectItem>
                        <SelectItem value="creative_exploration">Creative Exploration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <Textarea
                    placeholder="Task description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-3">
                  <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
                  <Button onClick={handleAddTask}>Add Task</Button>
                </div>
              </div>
            )}
            
            <TabsContent value="all" className="flex-1 space-y-2 overflow-y-auto">
              {tasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={handleToggleComplete}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                  getTypeEmoji={getTypeEmoji}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="pending" className="flex-1 space-y-2 overflow-y-auto">
              {filterTasks("pending").map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={handleToggleComplete}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                  getTypeEmoji={getTypeEmoji}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="in_progress" className="flex-1 space-y-2 overflow-y-auto">
              {filterTasks("in_progress").map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={handleToggleComplete}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                  getTypeEmoji={getTypeEmoji}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="completed" className="flex-1 space-y-2 overflow-y-auto">
              {filterTasks("completed").map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={handleToggleComplete}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                  getTypeEmoji={getTypeEmoji}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  getPriorityColor: (priority: Task["priority"]) => string;
  getStatusIcon: (status: Task["status"]) => React.ReactNode;
  getTypeEmoji: (type: Task["type"]) => string;
  formatTimeAgo: (date: Date) => string;
}

function TaskItem({ 
  task, 
  onToggleComplete, 
  getPriorityColor, 
  getStatusIcon, 
  getTypeEmoji,
  formatTimeAgo 
}: TaskItemProps) {
  return (
    <div className="flex items-start space-x-3 p-4 border rounded-lg bg-white/95 backdrop-blur-sm hover:bg-white/100 transition-colors">
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox
          checked={task.status === "completed"}
          onCheckedChange={() => onToggleComplete(task.id)}
        />
        {getStatusIcon(task.status)}
      </div>
      
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getTypeEmoji(task.type)}</span>
            <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
            <Badge variant="outline" className="text-xs">
              {task.priority}
            </Badge>
          </div>
        </div>
        
        {task.description && (
          <p className={`text-sm text-muted-foreground mt-1 ${task.status === "completed" ? "line-through" : ""}`}>
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Created {formatTimeAgo(task.createdAt)}</span>
            {task.estimatedTime && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimatedTime}m</span>
              </span>
            )}
          </div>
          {task.completedAt && (
            <span>Completed {formatTimeAgo(task.completedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}