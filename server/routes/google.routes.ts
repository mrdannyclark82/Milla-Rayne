import { Router, type Express } from 'express';
import { loginOrRegisterWithGoogle } from '../authService';
import { exchangeCodeForToken, storeOAuthToken } from '../oauthService';
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

      try {
        const { accessToken, refreshToken, expiresIn, scope } =
          await exchangeCodeForToken(code as string);

        const profileResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const profile = await profileResponse.json();

        const result = await loginOrRegisterWithGoogle(
          profile.email,
          profile.id,
          profile.name
        );

        if (!result.success || !result.user) {
          return res.status(401).send(result.error);
        }

        await storeOAuthToken(
          result.user.id!,
          'google',
          accessToken,
          refreshToken,
          expiresIn,
          scope
        );

        res.cookie('session_token', result.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect('/');
      } catch (error) {
        console.error('Google login error:', error);
        res.status(500).send('Authentication failed');
      }
    })
  );

  router.get('/oauth/authenticated', (req, res) => {
    res.json({ authenticated: !!req.cookies.session_token });
  });

  // Mount routes
  app.use('/api', router);
}
