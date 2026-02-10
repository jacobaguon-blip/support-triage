/**
 * OAuth Configuration for MCP Services
 *
 * Each service that supports OAuth needs:
 * - authorizeUrl: Where to send users to authorize
 * - tokenUrl: Where to exchange code for tokens
 * - scope: What permissions to request
 * - redirectUri: Where OAuth provider sends user back
 */

export const OAUTH_CONFIGS = {
  linear: {
    authorizeUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    scope: 'read write',
    redirectUri: 'http://localhost:3001/api/oauth/callback/linear'
  }
  // Add more services as needed:
  // slack: { ... },
  // notion: { ... }
}

/**
 * Check if a service supports OAuth
 */
export function supportsOAuth(service) {
  return service in OAUTH_CONFIGS
}

/**
 * Get OAuth configuration for a service
 */
export function getOAuthConfig(service) {
  return OAUTH_CONFIGS[service] || null
}
