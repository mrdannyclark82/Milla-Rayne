/**
 * Test OAuth Service Implementation
 *
 * This script tests the OAuth service to ensure tokens can be stored and retrieved correctly.
 */

import { storage } from '../server/storage';

async function testOAuthService() {
  console.log('🧪 Testing OAuth Service...\n');

  try {
    // Test 1: Check OAuth token storage methods exist
    console.log('✓ Test 1: Checking storage methods exist');
    if (typeof (storage as any).createOAuthToken !== 'function') {
      throw new Error('createOAuthToken method not found');
    }
    if (typeof (storage as any).getOAuthToken !== 'function') {
      throw new Error('getOAuthToken method not found');
    }
    if (typeof (storage as any).updateOAuthToken !== 'function') {
      throw new Error('updateOAuthToken method not found');
    }
    if (typeof (storage as any).deleteOAuthToken !== 'function') {
      throw new Error('deleteOAuthToken method not found');
    }
    console.log('  All storage methods exist ✓\n');

    // Test 2: Create a test token
    console.log('✓ Test 2: Creating test OAuth token');
    const testToken = {
      userId: 'default-user', // Use existing default user
      provider: 'google',
      accessToken: 'test_access_token_encrypted',
      refreshToken: 'test_refresh_token_encrypted',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      scope:
        'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/keep',
    };

    const created = await (storage as any).createOAuthToken(testToken);
    if (!created || !created.id) {
      throw new Error('Failed to create OAuth token');
    }
    console.log('  Token created with ID:', created.id);
    console.log('  Provider:', created.provider);
    console.log('  Expires at:', created.expiresAt);
    console.log('  ✓\n');

    // Test 3: Retrieve the token
    console.log('✓ Test 3: Retrieving OAuth token');
    const retrieved = await (storage as any).getOAuthToken(
      'default-user',
      'google'
    );
    if (!retrieved) {
      throw new Error('Failed to retrieve OAuth token');
    }
    if (retrieved.accessToken !== testToken.accessToken) {
      throw new Error('Retrieved token does not match created token');
    }
    console.log('  Token retrieved successfully ✓');
    console.log(
      '  Access token matches:',
      retrieved.accessToken === testToken.accessToken
    );
    console.log(
      '  Refresh token matches:',
      retrieved.refreshToken === testToken.refreshToken
    );
    console.log('  ✓\n');

    // Test 4: Update the token
    console.log('✓ Test 4: Updating OAuth token');
    const updatedToken = {
      accessToken: 'updated_access_token_encrypted',
      refreshToken: 'updated_refresh_token_encrypted',
      expiresAt: new Date(Date.now() + 7200000), // 2 hours from now
      scope: testToken.scope,
    };
    await (storage as any).updateOAuthToken(created.id, updatedToken);

    const afterUpdate = await (storage as any).getOAuthToken(
      'default-user',
      'google'
    );
    if (afterUpdate.accessToken !== updatedToken.accessToken) {
      throw new Error('Token was not updated correctly');
    }
    console.log('  Token updated successfully ✓');
    console.log('  New access token:', afterUpdate.accessToken);
    console.log('  ✓\n');

    // Test 5: Delete the token
    console.log('✓ Test 5: Deleting OAuth token');
    await (storage as any).deleteOAuthToken(created.id);

    const afterDelete = await (storage as any).getOAuthToken(
      'default-user',
      'google'
    );
    if (afterDelete !== null) {
      throw new Error('Token was not deleted correctly');
    }
    console.log('  Token deleted successfully ✓\n');

    console.log('✅ All OAuth service tests passed!\n');
  } catch (error) {
    console.error('❌ OAuth service test failed:', error);
    process.exit(1);
  }
}

// Run tests
testOAuthService()
  .then(() => {
    console.log('Test complete. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
