const fs = require('fs');
let content = fs.readFileSync('server/authService.ts', 'utf8');

// Insert import
if (!content.includes("from './oauthService'")) {
  content = content.replace(
    "import type { InsertUser, User, UserSession } from '@shared/schema';",
    "import type { InsertUser, User, UserSession } from '@shared/schema';\nimport { getValidAccessToken } from './oauthService';"
  );
}

const newImplementation = `export async function refreshAccessTokenIfExpired(
  userId: string,
  accessToken: string,
  refreshToken?: string
): Promise<{ success: boolean; newAccessToken?: string; error?: string }> {
  // Delegate to OAuth service which handles expiration check and refresh
  console.log(\`[Auth] Token refresh check for user \${userId}\`);

  try {
    // Check if token is valid or needs refresh using oauthService
    // This handles:
    // 1. Fetching token from DB
    // 2. Checking expiration
    // 3. Refreshing if needed
    // 4. Updating DB
    const validToken = await getValidAccessToken(userId, 'google');

    if (validToken) {
      return {
        success: true,
        newAccessToken: validToken,
      };
    }

    return { success: false, error: 'Could not retrieve valid access token' };
  } catch (error) {
    console.error('[Auth] Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}`;

const lines = content.split('\n');
// Find start line
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export async function refreshAccessTokenIfExpired(')) {
    startLine = i;
    break;
  }
}

if (startLine === -1) {
  console.error('Could not find function start line');
  process.exit(1);
}

// Find end line (the closing brace for the function)
let braceCount = 0;
let endLine = -1;
for (let i = startLine; i < lines.length; i++) {
  const line = lines[i];
  braceCount += (line.match(/{/g) || []).length;
  braceCount -= (line.match(/}/g) || []).length;
  // Initialize braceCount only after we find the first brace if it's on the same line as definition
  // But here definition spans multiple lines usually.
  // Wait, my brace counting logic assumes startLine has the opening brace or subsequent lines do.
  // The function signature ends with  usually.

  if (braceCount === 0 && i > startLine) {
    // Basic heuristic, might fail if brace count starts at 0 and doesn't increment immediately
    // We need to be careful.
    // Let's assume the function body starts with {
    // If the first line has {, braceCount becomes 1.
  }
}

// Let's improve brace counting.
braceCount = 0;
endLine = -1;
let foundOpen = false;

for (let i = startLine; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/{/g) || []).length;
  const closes = (line.match(/}/g) || []).length;

  if (opens > 0) foundOpen = true;

  braceCount += opens;
  braceCount -= closes;

  if (foundOpen && braceCount === 0) {
    endLine = i;
    break;
  }
}

if (endLine === -1) {
  console.error('Could not find function end line');
  process.exit(1);
}

console.log('Replacing lines ' + (startLine + 1) + ' to ' + (endLine + 1));

// Remove old lines and insert new lines
const newLines = newImplementation.split('\n');
lines.splice(startLine, endLine - startLine + 1, ...newLines);

content = lines.join('\n');
fs.writeFileSync('server/authService.ts', content);
