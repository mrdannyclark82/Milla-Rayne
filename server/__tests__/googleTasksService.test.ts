import { describe, it, expect, vi } from 'vitest';
import {
  addNoteToGoogleTasks,
  listTasks,
  completeTask,
} from '../googleTasksService';
import * as oauth from '../oauthService';

vi.mock('../oauthService');

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Google Tasks Service', () => {
  describe('addNoteToGoogleTasks', () => {
    it('should return task on successful creation', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch
        .mockResolvedValueOnce({
          // for getDefaultTaskList
          ok: true,
          json: () => Promise.resolve({ items: [{ id: 'task_list_id' }] }),
        })
        .mockResolvedValueOnce({
          // for addNoteToGoogleTasks
          ok: true,
          json: () => Promise.resolve({ id: 'task_id', title: 'Test Task' }),
        });

      const result = await addNoteToGoogleTasks('Test Task', 'Test Content');

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task_id');
    });
  });

  describe('listTasks', () => {
    it('should return tasks on successful request', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch
        .mockResolvedValueOnce({
          // for getDefaultTaskList
          ok: true,
          json: () => Promise.resolve({ items: [{ id: 'task_list_id' }] }),
        })
        .mockResolvedValueOnce({
          // for listTasks
          ok: true,
          json: () =>
            Promise.resolve({ items: [{ id: 'task_id', title: 'Test Task' }] }),
        });

      const result = await listTasks();

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
    });
  });

  describe('completeTask', () => {
    it('should return success on successful completion', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch
        .mockResolvedValueOnce({
          // for getDefaultTaskList
          ok: true,
          json: () => Promise.resolve({ items: [{ id: 'task_list_id' }] }),
        })
        .mockResolvedValueOnce({
          // for completeTask
          ok: true,
          json: () => Promise.resolve({}),
        });

      const result = await completeTask('task_id');

      expect(result.success).toBe(true);
    });
  });
});
