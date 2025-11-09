/**
 * Authentication Service
 *
 * Handles user registration, login, session management
 * Uses bcrypt for password hashing and secure session tokens
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { storage } from './storage';
import type { InsertUser, User, UserSession } from '@shared/schema';

const SESSION_EXPIRY_HOURS = 24 * 7; // 7 days

/**
 * Register a new user
 */
export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: Partial<User>; error?: string }> {
  try {
    // Check if username or email already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      preferredAiModel: 'minimax', // Default AI model
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Login user and create session
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{
  success: boolean;
  user?: Partial<User>;
  sessionToken?: string;
  error?: string;
}> {
  try {
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Create session
    await storage.createUserSession({
      userId: user.id,
      sessionToken,
      expiresAt,
    });

    // Update last login
    await storage.updateUserLastLogin(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      sessionToken,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Validate session token
 */
export async function validateSession(
  sessionToken: string
): Promise<{ valid: boolean; user?: Partial<User>; session?: UserSession }> {
  try {
    const session = await storage.getUserSessionByToken(sessionToken);
    if (!session) {
      return { valid: false };
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteUserSession(session.id);
      return { valid: false };
    }

    // Get user
    const user = await storage.getUserById(session.userId);
    if (!user) {
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      session,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false };
  }
}

/**
 * Logout user (delete session)
 */
export async function logoutUser(
  sessionToken: string
): Promise<{ success: boolean }> {
  try {
    const session = await storage.getUserSessionByToken(sessionToken);
    if (session) {
      await storage.deleteUserSession(session.id);
    }
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

/**
 * Update user AI model preference
 */
export async function updateUserAIModel(
  userId: string,
  aiModel: 'minimax' | 'venice' | 'deepseek' | 'xai'
): Promise<{ success: boolean; error?: string }> {
  try {
    await storage.updateUserAIModel(userId, aiModel);
    return { success: true };
  } catch (error) {
    console.error('Update AI model error:', error);
    return { success: false, error: 'Failed to update AI model preference' };
  }
}

/**
 * Get user AI model preference
 */
export async function getUserAIModel(
  userId: string
): Promise<{ success: boolean; model?: string; error?: string }> {
  try {
    const user = await storage.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, model: user.preferredAiModel || 'minimax' };
  } catch (error) {
    console.error('Get AI model error:', error);
    return { success: false, error: 'Failed to get AI model preference' };
  }
}

/**
 * Login or register user with Google OAuth
 * If user with email exists, logs them in
 * If not, creates a new account
 */
export async function loginOrRegisterWithGoogle(
  email: string,
  googleId: string,
  name: string
): Promise<{
  success: boolean;
  user?: Partial<User>;
  sessionToken?: string;
  error?: string;
  isNewUser?: boolean;
}> {
  try {
    // Check if user exists by email
    let user = await storage.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Create new user with Google account
      // Use email username part as username, or name if available
      let username =
        name.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];

      // Check for username collision and append random numbers if needed
      let existingUser = await storage.getUserByUsername(username);
      let attempts = 0;
      while (existingUser && attempts < 5) {
        username = `${username}${Math.floor(Math.random() * 1000)}`;
        existingUser = await storage.getUserByUsername(username);
        attempts++;
      }

      if (existingUser) {
        // Extremely unlikely, but handle it
        return {
          success: false,
          error: 'Could not generate a unique username.',
        };
      }

      // Generate a random password (won't be used, but required by schema)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        preferredAiModel: 'minimax',
      });

      isNewUser = true;
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Create session
    await storage.createUserSession({
      userId: user.id,
      sessionToken,
      expiresAt,
    });

    // Update last login
    await storage.updateUserLastLogin(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      sessionToken,
      isNewUser,
    };
  } catch (error) {
    console.error('Google OAuth login/register error:', error);
    return { success: false, error: 'Failed to authenticate with Google' };
  }
}
