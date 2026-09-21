import { promises as fs } from 'fs';
import { join, dirname } from 'path';

export interface AgentTask {
  taskId: string;
  supervisor: string;
  agent: string;
  action: string;
  payload: any;
  metadata?: any;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  result?: any;
}

function taskFilePath(): string {
  return (
    process.env.AGENT_TASKS_FILE ||
    join(process.cwd(), 'memory', 'agent_tasks.json')
  );
}

async function ensureFile(): Promise<void> {
  const TASK_FILE = taskFilePath();
  try {
    await fs.access(TASK_FILE);
  } catch (err) {
    await fs.mkdir(dirname(TASK_FILE), { recursive: true }).catch(() => {});
    await fs.writeFile(TASK_FILE, '[]', 'utf-8');
  }
}

export async function readTasks(): Promise<AgentTask[]> {
  await ensureFile();
  const TASK_FILE = taskFilePath();
  const raw = await fs.readFile(TASK_FILE, 'utf-8');
  try {
    return JSON.parse(raw || '[]');
  } catch (err) {
    // Don't wipe the file on parse errors — concurrent readers can see torn
    // writes; resetting here races with writers and loses tasks.
    console.warn('Failed to parse task file', err);
    return [];
  }
}

export async function writeTasks(tasks: AgentTask[]): Promise<void> {
  await ensureFile();
  const TASK_FILE = taskFilePath();
  const tmp = `${TASK_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(tasks, null, 2), 'utf-8');
  await fs.rename(tmp, TASK_FILE);
}

export async function upsertTask(task: AgentTask): Promise<AgentTask> {
  const all = await readTasks();
  const idx = all.findIndex((t) => t.taskId === task.taskId);
  const saved = {
    ...task,
    updatedAt: new Date().toISOString(),
  };
  if (idx === -1) {
    all.push(saved);
  } else {
    all[idx] = { ...all[idx], ...saved };
  }
  await writeTasks(all);
  return idx === -1 ? saved : all[idx];
}

export async function addTask(task: AgentTask): Promise<void> {
  const all = await readTasks();
  all.push(task);
  await writeTasks(all);
}

export async function updateTask(
  taskId: string,
  patch: Partial<AgentTask>
): Promise<AgentTask | null> {
  const all = await readTasks();
  const idx = all.findIndex((t) => t.taskId === taskId);
  if (idx === -1) return null;
  const updated = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await writeTasks(all);
  return updated;
}

export async function getTask(taskId: string): Promise<AgentTask | null> {
  const all = await readTasks();
  return all.find((t) => t.taskId === taskId) || null;
}

export async function listTasks(): Promise<AgentTask[]> {
  return readTasks();
}
