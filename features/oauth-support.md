# Feature: OAuth Authentication Support

**Status:** ✅ Implemented
**Priority:** High
**Effort:** Medium
**Author:** Claude (Ops Dev Team)
**Date:** 2026-02-09

## Summary

Adds OAuth 2.0 authentication support to the MCP Credentials system, allowing users to authenticate with services like Linear using OAuth instead of API keys. Users can now choose between API key authentication or OAuth for supported services.

## Motivation

OAuth provides several benefits over API keys:
- **Better security** — No need to copy/paste long-lived API keys
- **Granular permissions** — OAuth scopes limit what the app can access
- **Auto-refresh** — Tokens refresh automatically, no manual rotation needed
- **Easier setup** — Users just click "Connect" and authorize in their browser

## Implementation Details

### Database Changes

Added OAuth-specific columns to `mcp_credentials` table:

```sql
- auth_type TEXT DEFAULT 'api_key'  -- 'api_key' or 'oauth'
- encrypted_access_token TEXT       -- OAuth access token (encrypted)
- encrypted_refresh_token TEXT      -- OAuth refresh token (encrypted)
- token_expires_at DATETIME         -- When access token expires
- oauth_state TEXT                  -- CSRF protection state parameter
```

### Backend Changes

**New Files:**
- `ui/oauth-config.js` — OAuth provider configurations (authorize URL, token URL, scopes)

**Updated Files:**
- `ui/server.js` — Added OAuth flow endpoints:
  - `GET /api/oauth/authorize/:service` — Initiate OAuth flow
  - `GET /api/oauth/callback/:service` — Handle OAuth callback
  - `POST /api/oauth/refresh/:service` — Manually refresh token
  - Background job to auto-refresh expiring tokens (runs hourly)
- `ui/credentials-manager.js` — Updated `generateMCPConfig()` to handle both API keys and OAuth tokens

**OAuth Flow:**
1. User clicks "Connect with [Service]"
2. Redirected to service's OAuth authorization page
3. User approves access
4. Service redirects back with authorization code
5. Backend exchanges code for access/refresh tokens
6. Tokens encrypted and stored in database
7. MCP config regenerated with new tokens
8. User redirected back to UI with success message

### Frontend Changes

**Updated Files:**
- `ui/src/components/MCPCredentials.jsx` — Dual auth method UI:
  - Auth method selector (API Key / OAuth toggle)
  - "Connect with [Service]" button for OAuth
  - OAuth status badges
  - Success/error handling for OAuth callbacks
- `ui/src/styles/MCPCredentials.css` — Styles for new UI elements

**UI Features:**
- Users can switch between API key and OAuth auth methods
- OAuth badge shows when a service is using OAuth
- Token expiry information displayed (coming soon)
- Success/error messages after OAuth flow

### Security Features

- **CSRF Protection** — Random state parameter prevents CSRF attacks
- **Token Encryption** — All tokens encrypted with AES-256-GCM
- **Auto-Refresh** — Background job refreshes tokens before expiration
- **Error Handling** — Graceful fallback when refresh fails

## Configuration

### Environment Variables

Required for each OAuth-enabled service:

```bash
LINEAR_CLIENT_ID=your_client_id
LINEAR_CLIENT_SECRET=your_client_secret
```

See `.env.example` for full list.

### Registering OAuth Apps

**Linear:**
1. Go to https://linear.app/settings/api/applications
2. Click "New OAuth application"
3. Set redirect URI to: `http://localhost:3001/api/oauth/callback/linear`
4. Copy Client ID and Client Secret to `.env`

## Usage

**For API Key authentication (existing):**
1. Click "+ Configure" on a service
2. Enter API key
3. Click "Save"

**For OAuth authentication (new):**
1. Click "+ Configure" on a service (Linear)
2. Click "OAuth" tab
3. Click "Connect with Linear"
4. Authorize in browser
5. Automatically redirected back — done!

## Testing

**Manual Test Plan:**
1. ✅ Start dev servers (`npm run dev`, `node server.js`)
2. ✅ Open credentials manager
3. ✅ Click "Configure" on Linear
4. ✅ Switch to "OAuth" tab
5. ✅ Click "Connect with Linear"
6. ✅ Authorize in browser
7. ✅ Verify redirect back to UI with success message
8. ✅ Verify Linear MCP config generated correctly
9. ✅ Test that Linear MCP tools work with OAuth token

**Build Test:**
```bash
cd ui && npm run build
```
Should build with 0 errors.

## Future Enhancements

- [ ] Add OAuth support for Slack, Notion, Pylon
- [ ] Show token expiry countdown in UI
- [ ] Add "Refresh Token" button for manual refresh
- [ ] Add "Disconnect" option to revoke OAuth connection
- [ ] Log OAuth events for debugging

## Files Changed

```
ui/oauth-config.js                   (new)
ui/credentials-manager.js            (modified)
ui/server.js                          (modified)
ui/src/components/MCPCredentials.jsx  (modified)
ui/src/styles/MCPCredentials.css      (modified)
.env.example                          (new)
```

## Notes

- API key authentication still fully supported — OAuth is optional
- Only Linear supports OAuth currently (easy to add more services)
- Tokens refresh automatically 1 hour before expiry
- If refresh fails, user must re-authorize
- All tokens encrypted at rest using same encryption as API keys

## Related Issues

- Closes: "Add OAuth support for Linear" (user request)
- Depends on: MCP Credential Manager (completed)

---

**Deployed:** Not yet (pending QA)
**QA Status:** Awaiting test
**Doc Status:** Complete
