import { Router, type Express } from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  validateSession 
} from '../authService';

/**
 * Auth Routes - User Authentication
 */
export function registerAuthRoutes(app: Express) {
  const router = Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required',
        });
      }

      const result = await registerUser(username, email, password);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  });

  // Login user
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
      }

      const result = await loginUser(username, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      // Set session cookie
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  });

  // Logout user
  router.post('/logout', async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;

      if (sessionToken) {
        await logoutUser(sessionToken);
      }

      res.clearCookie('session_token');
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  });

  // Check auth status
  router.get('/status', async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;

      if (!sessionToken) {
        return res.json({ authenticated: false });
      }

      const result = await validateSession(sessionToken);

      if (!result.valid) {
        res.clearCookie('session_token');
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: result.user,
      });
    } catch (error) {
      console.error('Auth status check error:', error);
      res.json({ authenticated: false });
    }
  });

  // Mount the router under /api/auth
  app.use('/api/auth', router);
}
