import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SqliteStorage } from '../sqliteStorage';

// Mock better-sqlite3
const mockPrepare = vi.fn();
const mockExec = vi.fn();
const mockPragma = vi.fn();
const mockClose = vi.fn();

const mockDb = {
  prepare: mockPrepare,
  exec: mockExec,
  pragma: mockPragma,
  close: mockClose,
};

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn(function () {
      return mockDb;
    }),
  };
});

// Mock fs to avoid directory creation issues
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

// Mock crypto
vi.mock('../crypto', () => ({
  isEncryptionEnabled: vi.fn().mockReturnValue(false),
  getMemoryKey: vi.fn(),
  encrypt: vi.fn((t) => t),
  decrypt: vi.fn((t) => t),
}));

describe('SqliteStorage - Token Rotation Support', () => {
  let storage: SqliteStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepare.mockReset();
    mockExec.mockReset();

    // Default mock implementation for prepare/exec to allow initialization
    mockPrepare.mockReturnValue({
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
    });

    // Initialize storage (this calls initializeDatabase which calls exec/prepare)
    storage = new SqliteStorage();
  });

  describe('getActiveUserSessions', () => {
    it('should query sessions with future expiration date', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-1',
          session_token: 'token-1',
          expires_at: '2099-01-01T00:00:00.000Z',
          created_at: '2023-01-01T00:00:00.000Z',
        },
      ];

      const mockAll = vi.fn().mockReturnValue(mockSessions);
      mockPrepare.mockReturnValue({
        all: mockAll,
      });

      const sessions = await storage.getActiveUserSessions();

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT * FROM user_sessions WHERE expires_at > CURRENT_TIMESTAMP'
        )
      );

      expect(mockAll).toHaveBeenCalled();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[0].userId).toBe('user-1');
      expect(sessions[0].expiresAt).toBeInstanceOf(Date);
    });
  });
});
