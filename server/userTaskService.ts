import { promises as fs } from 'fs';
import { join } from 'path';

export interface UserTask {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  dueTime?: string;
  type: 'appointment' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  notifications: {
    enabled: boolean;
    reminderMinutes: number;
  };
}

let userTasks: UserTask[] = [];
const USER_TASKS_FILE = join(process.cwd(), 'memory', 'user_tasks.json');

/**
 * Initialize user tasks system
 */
export async function initializeUserTasks(): Promise<void> {
  try {
    await loadUserTasks();
    console.log('User tasks system initialized');
  } catch (error) {
    console.error('Error initializing user tasks:', error);
  }
}

/**
 * Load user tasks from file
 */
async function loadUserTasks(): Promise<void> {
  try {
    const data = await fs.readFile(USER_TASKS_FILE, 'utf-8');
    userTasks = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, start with empty array
    userTasks = [];
    await saveUserTasks();
  }
}

/**
 * Save user tasks to file
 */
async function saveUserTasks(): Promise<void> {
  try {
    await fs.writeFile(USER_TASKS_FILE, JSON.stringify(userTasks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving user tasks:', error);
    throw error;
  }
}

/**
 * Get all user tasks
 */
export function getUserTasks(): UserTask[] {
  // Update overdue status
  const now = new Date();
  userTasks.forEach(task => {
    if (task.status === 'pending' && new Date(task.dueDate) < now) {
      task.status = 'overdue';
    }
  });
  return userTasks;
}

/**
 * Create a new user task
 */
export async function createUserTask(taskData: Omit<UserTask, 'id' | 'createdAt'>): Promise<UserTask> {
  const newTask: UserTask = {
    ...taskData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  userTasks.push(newTask);
  await saveUserTasks();
  return newTask;
}

/**
 * Update an existing user task
 */
export async function updateUserTask(taskId: string, updates: Partial<UserTask>): Promise<UserTask | null> {
  const taskIndex = userTasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) {
    return null;
  }

  userTasks[taskIndex] = { ...userTasks[taskIndex], ...updates };
  await saveUserTasks();
  return userTasks[taskIndex];
}

/**
 * Delete a user task
 */
export async function deleteUserTask(taskId: string): Promise<boolean> {
  const initialLength = userTasks.length;
  userTasks = userTasks.filter(task => task.id !== taskId);
  
  if (userTasks.length < initialLength) {
    await saveUserTasks();
    return true;
  }
  return false;
}

/**
 * Get tasks that need notifications
 */
export function getTasksNeedingNotification(): UserTask[] {
  const now = new Date();
  return userTasks.filter(task => {
    if (!task.notifications.enabled || task.status !== 'pending' || !task.dueTime) {
      return false;
    }

    const taskDateTime = new Date(`${task.dueDate} ${task.dueTime}`);
    const reminderTime = new Date(taskDateTime.getTime() - (task.notifications.reminderMinutes * 60000));
    
    return now >= reminderTime && now < taskDateTime;
  });
}

/**
 * Get upcoming tasks for the next few days
 */
export function getUpcomingTasks(days: number = 7): UserTask[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return userTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return task.status === 'pending' && taskDate >= now && taskDate <= futureDate;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}