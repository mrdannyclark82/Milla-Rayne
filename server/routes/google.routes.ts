import { Router, type Express } from 'express';
import { loginOrRegisterWithGoogle } from '../authService';
import { config } from '../config';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Google OAuth and Services Routes
 */
export function registerGoogleRoutes(app: Express) {
  const router = Router();

  router.get('/auth/google/url', (req, res) => {
    const scope = ['profile', 'email', 'https://www.googleapis.com/auth/tasks'];
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.clientId}&redirect_uri=${encodeURIComponent(config.google.redirectUri || '')}&response_type=code&scope=${encodeURIComponent(scope.join(' '))}&access_type=offline&prompt=consent`;
    res.json({ url });
  });

  router.get('/auth/google/callback', asyncHandler(async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('Code is required');
    
    const result = await loginOrRegisterWithGoogle(code as string);
    if (!result.success) return res.status(401).send(result.error);

    res.cookie('session_token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect('/');
  }));

  router.get('/oauth/authenticated', (req, res) => {
    res.json({ authenticated: !!req.cookies.session_token });
  });

  // Mount routes
  app.use('/api', router);
}
