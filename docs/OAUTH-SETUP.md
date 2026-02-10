# OAuth Setup Guide

This guide explains how to set up OAuth authentication for MCP services in the Support Triage System.

## Overview

The Support Triage System now supports both **API Key** and **OAuth** authentication for MCP services. OAuth provides better security, automatic token refresh, and easier setup.

**Supported Services:**
- ✅ **Linear** — OAuth enabled
- 🔜 Pylon — Coming soon
- 🔜 Slack — Coming soon
- 🔜 Notion — Coming soon

---

## Setting Up Linear OAuth

### Step 1: Create a Linear OAuth Application

1. Go to [Linear Settings → API → Applications](https://linear.app/settings/api/applications)
2. Click **"New OAuth application"**
3. Fill in the details:
   - **Application name:** Support Triage System
   - **Description:** Internal tool for technical support ticket investigation
   - **Callback URL:** `http://localhost:3001/api/oauth/callback/linear`
   - **Scopes:** Select `read` and `write`
4. Click **"Create"**
5. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables

Create or edit `.env` in the project root:

```bash
# Linear OAuth
LINEAR_CLIENT_ID=lin_oauth_xxxxxxxxxxxxx
LINEAR_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** Never commit `.env` to git. It's already in `.gitignore`.

### Step 3: Restart the Server

```bash
cd ui
node server.js
```

You should see: `OAuth token auto-refresh enabled (checks every hour)`

### Step 4: Connect via UI

1. Open the app: `http://localhost:3000`
2. Click **Settings** (gear icon)
3. Find **Linear** and click **"+ Configure"**
4. Click the **"OAuth"** tab
5. Click **"Connect with Linear"**
6. You'll be redirected to Linear's authorization page
7. Click **"Authorize"**
8. You'll be redirected back to the app with a success message

Done! Linear is now connected via OAuth.

---

## How OAuth Works

### Authorization Flow

```
User clicks "Connect"
   ↓
Redirected to Linear
   ↓
User authorizes
   ↓
Linear redirects back with code
   ↓
Backend exchanges code for tokens
   ↓
Tokens encrypted and stored
   ↓
MCP config regenerated
   ↓
Done!
```

### Token Management

- **Access Token:** Used for API calls, expires in ~1 week
- **Refresh Token:** Used to get new access tokens, never expires
- **Auto-Refresh:** Background job checks every hour for expiring tokens
- **Encryption:** All tokens encrypted with AES-256-GCM before storage

### Security Features

- **CSRF Protection** — Random state parameter prevents attack
- **Encrypted Storage** — Tokens encrypted at rest in SQLite
- **Auto-Refresh** — Tokens refresh before expiration
- **Secure Redirect** — Callback URL validated

---

## Switching Between API Key and OAuth

You can switch authentication methods at any time:

### From API Key to OAuth:
1. Open Settings → MCP Credentials
2. Click **"Edit"** on the service
3. Switch to **"OAuth"** tab
4. Click **"Connect with [Service]"**

Your old API key will be preserved but not used.

### From OAuth to API Key:
1. Open Settings → MCP Credentials
2. Click **"Edit"** on the service
3. Switch to **"API Key"** tab
4. Enter new API key
5. Click **"Save"**

---

## Troubleshooting

### "Missing LINEAR_CLIENT_ID environment variable"

**Cause:** Environment variables not loaded.

**Fix:**
1. Ensure `.env` exists in project root
2. Restart the server: `node server.js`
3. Check server logs for "OAuth token auto-refresh enabled"

### "OAuth authorization failed"

**Cause:** Incorrect redirect URI or OAuth app misconfigured.

**Fix:**
1. Verify callback URL in Linear app settings matches exactly:
   ```
   http://localhost:3001/api/oauth/callback/linear
   ```
2. Ensure Client ID and Secret are correct in `.env`
3. Restart server and try again

### "Token refresh failed. Re-authorization may be required."

**Cause:** Refresh token expired or revoked.

**Fix:**
1. Open Settings → MCP Credentials
2. Click **"Edit"** on Linear
3. Click **"Connect with Linear"** again to re-authorize

### "Invalid state parameter"

**Cause:** CSRF protection triggered (possible attack or stale state).

**Fix:**
1. Close all browser tabs for the app
2. Clear browser cache
3. Try connecting again

---

## Adding OAuth Support for Other Services

To add OAuth support for additional services (Slack, Notion, etc.):

### 1. Register OAuth App

Register an OAuth app with the service provider. Get Client ID and Secret.

### 2. Add Configuration

Edit `ui/oauth-config.js`:

```javascript
export const OAUTH_CONFIGS = {
  linear: { /* existing */ },
  slack: {
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scope: 'channels:read chat:write',
    redirectUri: 'http://localhost:3001/api/oauth/callback/slack'
  }
}
```

### 3. Add Environment Variables

Add to `.env`:

```bash
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
```

### 4. Update Frontend

Edit `ui/src/components/MCPCredentials.jsx`:

```javascript
const services = [
  { id: 'slack', name: 'Slack', description: '...', supportsOAuth: true },
  // ...
]
```

### 5. Test

1. Restart server
2. Open Settings → MCP Credentials
3. Configure Slack via OAuth
4. Verify MCP config generated correctly

---

## Security Best Practices

✅ **Do:**
- Store Client ID and Secret in `.env` (never in code)
- Use different OAuth apps for dev/staging/prod
- Regularly check Linear app settings for unauthorized apps
- Revoke OAuth access if you suspect compromise

❌ **Don't:**
- Commit `.env` to git
- Share Client Secret publicly
- Use production OAuth apps for development
- Disable CSRF protection

---

## API Reference

### GET /api/oauth/authorize/:service

Initiates OAuth flow by redirecting user to service's authorization page.

**Parameters:**
- `service` — Service name (e.g., `linear`)

**Returns:** HTTP redirect to OAuth provider

---

### GET /api/oauth/callback/:service

Handles OAuth callback, exchanges code for tokens, stores encrypted tokens.

**Parameters:**
- `code` — Authorization code (from OAuth provider)
- `state` — CSRF token (from OAuth provider)
- `service` — Service name (e.g., `linear`)

**Returns:** HTTP redirect to UI with success/error message

---

### POST /api/oauth/refresh/:service

Manually refreshes an OAuth token.

**Parameters:**
- `service` — Service name (e.g., `linear`)

**Returns:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "expiresAt": "2026-02-16 14:30:00"
}
```

---

## FAQ

**Q: Can I use both API key and OAuth for the same service?**

A: No, you must choose one. The system will use whichever method is currently configured.

**Q: What happens if my OAuth token expires?**

A: The background job automatically refreshes tokens 1 hour before expiration. If refresh fails, you'll need to re-authorize.

**Q: Can I revoke OAuth access?**

A: Yes, go to Linear Settings → API → Applications → Revoke. Then re-authorize in the Support Triage app.

**Q: Is OAuth more secure than API keys?**

A: Yes, because:
- Tokens expire and refresh automatically
- You can revoke access without changing passwords
- Scopes limit what the app can access
- No long-lived credentials to copy/paste

**Q: Do I need OAuth for all services?**

A: No, OAuth is optional. API keys still work fine if you prefer them.

---

**Need help?** Open a bug report or ask in Slack.
