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

/**
 * ZKP-based authentication (Decentralized future implementation)
 * 
 * This function demonstrates how Zero-Knowledge Proof authentication would work
 * in a decentralized, self-sovereign identity system. The user proves their
 * identity without revealing sensitive PII.
 * 
 * Future Integration:
 * - This will replace traditional password-based authentication
 * - Users will prove identity ownership via ZKP instead of passwords
 * - Sensitive data remains encrypted in decentralized vault
 * - No centralized token server required
 * 
 * @param userId - User identifier
 * @param zkProof - Zero-Knowledge Proof from user
 * @returns Authentication result with session if successful
 */
export async function loginUserWithZKP(
  userId: string,
  zkProof: string
): Promise<{
  success: boolean;
  user?: Partial<User>;
  sessionToken?: string;
  error?: string;
}> {
  try {
    console.log(`[Auth] Attempting ZKP authentication for user: ${userId}`);
    
    // Import decentralization service
    const { verifyIdentityZKP } = await import('./decentralizationService');
    
    // Verify identity using Zero-Knowledge Proof
    // This checks HE-encrypted vault data without revealing PII
    const isVerified = await verifyIdentityZKP(userId, zkProof);
    
    if (!isVerified) {
      console.warn(`[Auth] ZKP verification failed for user: ${userId}`);
      return { 
        success: false, 
        error: 'Identity verification failed - invalid ZK proof' 
      };
    }
    
    // Retrieve user record (for session creation)
    const user = await storage.getUserById(userId);
    if (!user) {
      return { 
        success: false, 
        error: 'User not found' 
      };
    }
    
    // Generate session token (traditional approach for now)
    // In pure decentralized system, this would be a self-signed JWT
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
    
    console.log(`[Auth] ✅ ZKP authentication successful for user: ${userId}`);
    console.log(`[Auth] Note: Verified identity without exposing PII from HE-encrypted vault`);
    
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
    console.error('[Auth] ZKP authentication error:', error);
    return { 
      success: false, 
      error: 'ZKP authentication failed' 
    };
  }
}

/**
 * Conceptual hook for future decentralized authentication
 * 
 * This demonstrates how ZKP verification would integrate into the login flow:
 * 
 * 1. User generates ZK proof locally (client-side)
 * 2. Proof is sent to server instead of password
 * 3. Server verifies proof against HE-encrypted vault data
 * 4. Access granted without revealing sensitive PII
 * 
 * Benefits:
 * - No passwords stored on server
 * - User controls their identity data
 * - Verification without data exposure
 * - Decentralized, self-sovereign identity
 * 
 * Future: This would replace centralized token checks entirely
 */
export function conceptualZKPAuthenticationFlow(): void {
  console.log('[Auth] Conceptual ZKP Authentication Flow:');
  console.log('[Auth] 1. User creates ZK proof locally (proves identity ownership)');
  console.log('[Auth] 2. Proof sent to server instead of password');
  console.log('[Auth] 3. Server verifies using verifyIdentityZKP()');
  console.log('[Auth] 4. HE-encrypted vault data checked without decryption');
  console.log('[Auth] 5. Access granted - PII never exposed');
  console.log('[Auth] Future: Replace centralized JWT with decentralized DID tokens');
}

/**
 * P1.4: OAuth Token Refresh Stub
 * Placeholder for automatic token rotation to improve security
 * 
 * In production, this would:
 * 1. Check if access token is expiring soon
 * 2. Use refresh token to get new access token
 * 3. Update user session with new tokens
 * 4. Rotate refresh token periodically
 */
export async function refreshAccessTokenIfExpired(
  userId: string,
  accessToken: string,
  refreshToken?: string
): Promise<{ success: boolean; newAccessToken?: string; error?: string }> {
  // Stub implementation - to be completed with actual OAuth provider integration
  console.log(`[Auth] Token refresh check for user ${userId}`);
  
  try {
    // TODO: Implement actual token refresh logic with OAuth provider
    // For now, return success if token exists
    if (!accessToken) {
      return { success: false, error: 'No access token provided' };
    }
    
    // Mock token expiration check (in production, decode JWT and check exp claim)
    const mockTokenAge = Date.now(); // Placeholder
    const mockTokenExpiry = mockTokenAge + (3600 * 1000); // 1 hour
    const timeUntilExpiry = mockTokenExpiry - Date.now();
    
    // Refresh if token expires in less than 5 minutes
    if (timeUntilExpiry < 5 * 60 * 1000) {
      console.log('[Auth] Token expiring soon, would refresh here');
      
      // TODO: Call OAuth provider refresh endpoint
      // const newTokens = await oauthProvider.refreshToken(refreshToken);
      // await storage.updateUserSession(userId, newTokens);
      
      // Return mock success for now
      return {
        success: true,
        newAccessToken: accessToken, // In production, return new token
      };
    }
    
    return { success: true, newAccessToken: accessToken };
  } catch (error) {
    console.error('[Auth] Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

/**
 * P1.4: Token Rotation Scheduler
 * Automatically checks and refreshes tokens for active sessions
 * Should be called periodically (e.g., every 30 minutes)
 */
export async function scheduleTokenRotation(): Promise<void> {
  console.log('[Auth] Starting token rotation scheduler...');
  
  // TODO: Get all active sessions from storage
  // TODO: For each session, check if token needs refresh
  // TODO: Call refreshAccessTokenIfExpired for expiring tokens
  
  // Stub: Log that scheduler would run
  console.log('[Auth] Token rotation scheduler initialized (stub)');
  
  // In production, set up interval:
  // setInterval(async () => {
  //   const sessions = await storage.getActiveSessions();
  //   for (const session of sessions) {
  //     await refreshAccessTokenIfExpired(session.userId, session.accessToken, session.refreshToken);
  //   }
  // }, 30 * 60 * 1000); // Every 30 minutes
}


