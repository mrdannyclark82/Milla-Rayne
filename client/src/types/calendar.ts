export interface UserTask {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  dueTime?: string;
  type: 'appointment' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  createdAt: Date;
  completedAt?: Date;
  notifications: {
    enabled: boolean;
    reminderMinutes: number; // minutes before due time
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'appointment' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

export type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue';
export type TaskSort = 'dueDate' | 'priority' | 'created' | 'title';