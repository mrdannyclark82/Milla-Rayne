import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { registerAuthRoutes } from './auth.routes';
import * as authService from '../authService';

vi.mock('../authService');

describe('Auth Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    registerAuthRoutes(app);
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = { username: 'testuser', email: 'test@example.com', password: 'password123' };
      vi.spyOn(authService, 'registerUser').mockResolvedValue({
        success: true,
        user: { id: '1', username: 'testuser', email: 'test@example.com' } as any,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(authService.registerUser).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user and set a cookie', async () => {
      vi.spyOn(authService, 'loginUser').mockResolvedValue({
        success: true,
        sessionToken: 'mock-token',
        user: { id: '1', username: 'testuser' } as any,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.header['set-cookie']).toBeDefined();
      expect(response.header['set-cookie'][0]).toContain('session_token=mock-token');
    });

    it('should return 401 for invalid credentials', async () => {
      vi.spyOn(authService, 'loginUser').mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the session cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['session_token=some-token']);

      expect(response.status).toBe(200);
      expect(response.header['set-cookie'][0]).toContain('session_token=;');
      expect(authService.logoutUser).toHaveBeenCalledWith('some-token');
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return authenticated status if valid session', async () => {
      vi.spyOn(authService, 'validateSession').mockResolvedValue({
        valid: true,
        user: { id: '1', username: 'testuser' } as any,
      });

      const response = await request(app)
        .get('/api/auth/status')
        .set('Cookie', ['session_token=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return unauthenticated status if no session', async () => {
      const response = await request(app).get('/api/auth/status');
      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
    });
  });
});
