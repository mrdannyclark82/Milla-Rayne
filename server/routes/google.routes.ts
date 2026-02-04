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

  router.get(
    '/auth/google/callback',
    asyncHandler(async (req, res) => {
      const { code } = req.query;
      if (!code) return res.status(400).send('Code is required');

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: config.google.clientId || '',
          client_secret: config.google.clientSecret || '',
          redirect_uri: config.google.redirectUri || '',
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange failed:', error);
        return res.status(401).send('Failed to exchange authorization code');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile information from Google
      const profileResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!profileResponse.ok) {
        return res.status(401).send('Failed to fetch user profile');
      }

      const profile = await profileResponse.json();
      
      // Now call loginOrRegisterWithGoogle with the correct parameters
      const result = await loginOrRegisterWithGoogle(
        profile.email,
        profile.id,
        profile.name || profile.email.split('@')[0]
      );
      
      if (!result.success) return res.status(401).send(result.error);

      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect('/');
    })
  );

  router.get('/oauth/authenticated', (req, res) => {
    res.json({ authenticated: !!req.cookies.session_token });
  });

  // Mount routes
  app.use('/api', router);
}
