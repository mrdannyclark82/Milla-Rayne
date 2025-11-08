import { promises as fs } from 'fs';
import { join } from 'path';

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

const TASK_FILE = join(process.cwd(), 'memory', 'agent_tasks.json');

async function ensureFile(): Promise<void> {
    try {
        await fs.access(TASK_FILE);
    } catch (err) {
        await fs.writeFile(TASK_FILE, '[]', 'utf-8');
    }
}

export async function readTasks(): Promise<AgentTask[]> {
    await ensureFile();
    const raw = await fs.readFile(TASK_FILE, 'utf-8');
    try {
        return JSON.parse(raw || '[]');
    } catch (err) {
        console.warn('Failed to parse task file, resetting', err);
        await fs.writeFile(TASK_FILE, '[]', 'utf-8');
        return [];
    }
}

export async function writeTasks(tasks: AgentTask[]): Promise<void> {
    await ensureFile();
    await fs.writeFile(TASK_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

export async function addTask(task: AgentTask): Promise<void> {
    const all = await readTasks();
    all.push(task);
    await writeTasks(all);
}

export async function updateTask(taskId: string, patch: Partial<AgentTask>): Promise<AgentTask | null> {
    const all = await readTasks();
    const idx = all.findIndex((t) => t.taskId === taskId);
    if (idx === -1) return null;
    const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
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
