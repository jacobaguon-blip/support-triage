import crypto from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir, hostname, userInfo } from 'os'

/**
 * MCP Credentials Manager
 * Handles encryption, storage, and MCP config generation
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment or generate machine-specific key
 */
function getEncryptionKey() {
  // Option A: Environment variable
  if (process.env.MCP_ENCRYPTION_KEY) {
    const key = process.env.MCP_ENCRYPTION_KEY
    if (key.length !== 64) {
      throw new Error('MCP_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    }
    return Buffer.from(key, 'hex')
  }

  // Option B: Machine-specific key (fallback)
  const machineHostname = hostname()
  const machineUserInfo = userInfo()
  const machineString = `${machineHostname}-${machineUserInfo.username}-mcp-support-triage`
  return crypto.createHash('sha256').update(machineString).digest()
}

/**
 * Encrypt a value using AES-256-GCM
 */
export function encrypt(plaintext) {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return: iv + authTag + encrypted (all in hex)
    return iv.toString('hex') + authTag.toString('hex') + encrypted
  } catch (err) {
    console.error('Encryption error:', err.message)
    throw new Error('Failed to encrypt credentials')
  }
}

/**
 * Decrypt a value using AES-256-GCM
 */
export function decrypt(encrypted) {
  try {
    const key = getEncryptionKey()

    // Parse: iv + authTag + encrypted
    const iv = Buffer.from(encrypted.slice(0, IV_LENGTH * 2), 'hex')
    const authTag = Buffer.from(encrypted.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), 'hex')
    const encryptedText = encrypted.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (err) {
    console.error('Decryption error:', err.message)
    throw new Error('Failed to decrypt credentials')
  }
}

/**
 * Generate ~/.claude/mcp.json from stored credentials
 */
export function generateMCPConfig(credentials) {
  const mcpConfig = {
    mcpServers: {}
  }

  for (const cred of credentials) {
    if (!cred.is_enabled) continue

    try {
      let token

      // Check auth type - OAuth or API key
      if (cred.auth_type === 'oauth') {
        // Use OAuth access token
        if (!cred.encrypted_access_token) {
          console.warn(`[MCP Config] ${cred.service} configured for OAuth but no access token found`)
          continue
        }
        token = decrypt(cred.encrypted_access_token)

        // Check if token is expired
        if (cred.token_expires_at && new Date(cred.token_expires_at) < new Date()) {
          console.warn(`[MCP Config] Token for ${cred.service} is expired. Auto-refresh will attempt to renew.`)
          // Token refresh will be handled by background job in server.js
        }
      } else {
        // Use API key (default)
        if (!cred.encrypted_api_key) {
          console.warn(`[MCP Config] ${cred.service} has no API key configured`)
          continue
        }
        token = decrypt(cred.encrypted_api_key)
      }

      const config = cred.encrypted_config ? JSON.parse(decrypt(cred.encrypted_config)) : {}

      switch (cred.service) {
        case 'pylon':
          mcpConfig.mcpServers.pylon = {
            command: 'npx',
            args: ['-y', '@pylon/mcp-server'],
            env: {
              PYLON_API_KEY: token,
              ...config.env
            }
          }
          break

        case 'linear':
          mcpConfig.mcpServers.linear = {
            command: 'npx',
            args: ['-y', '@linear/mcp-server'],
            env: {
              LINEAR_API_KEY: token, // Works for both OAuth access token and API key
              ...config.env
            }
          }
          break

        case 'slack':
          mcpConfig.mcpServers.slack = {
            command: 'npx',
            args: ['-y', '@slack/mcp-server'],
            env: {
              SLACK_BOT_TOKEN: token,
              ...config.env
            }
          }
          break

        case 'notion':
          mcpConfig.mcpServers.notion = {
            command: 'npx',
            args: ['-y', '@notionhq/mcp-server'],
            env: {
              NOTION_API_KEY: token,
              ...config.env
            }
          }
          break

        default:
          console.warn(`Unknown service: ${cred.service}`)
      }
    } catch (err) {
      console.error(`Error processing ${cred.service} credentials:`, err.message)
    }
  }

  return mcpConfig
}

/**
 * Write MCP config to ~/.claude/mcp.json
 */
export function writeMCPConfig(mcpConfig) {
  try {
    const claudeDir = join(homedir(), '.claude')
    const mcpConfigPath = join(claudeDir, 'mcp.json')

    // Create .claude directory if it doesn't exist
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true })
    }

    // Backup existing config if present
    if (existsSync(mcpConfigPath)) {
      const backupPath = join(claudeDir, `mcp.json.backup.${Date.now()}`)
      const existing = readFileSync(mcpConfigPath, 'utf-8')
      writeFileSync(backupPath, existing)
      console.log(`[MCP Config] Backed up existing config to ${backupPath}`)
    }

    // Write new config
    writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2))
    console.log(`[MCP Config] Written to ${mcpConfigPath}`)

    return mcpConfigPath
  } catch (err) {
    console.error('Error writing MCP config:', err.message)
    throw new Error('Failed to write MCP configuration')
  }
}

/**
 * Test connection to a service using provided credentials
 */
export async function testConnection(service, apiKey) {
  // This is a placeholder - actual implementation would test each API
  // For now, just validate that the key is not empty
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, error: 'API key is empty' }
  }

  // TODO: Implement actual API tests for each service
  switch (service) {
    case 'pylon':
      // await fetch('https://api.usepylon.com/issues?limit=1', { headers: { Authorization: `Bearer ${apiKey}` } })
      return { success: true, message: 'Test not implemented - key saved' }

    case 'linear':
      // await fetch('https://api.linear.app/graphql', { ... })
      return { success: true, message: 'Test not implemented - key saved' }

    case 'slack':
      // await fetch('https://slack.com/api/auth.test', { ... })
      return { success: true, message: 'Test not implemented - key saved' }

    case 'notion':
      // await fetch('https://api.notion.com/v1/users/me', { ... })
      return { success: true, message: 'Test not implemented - key saved' }

    default:
      return { success: false, error: 'Unknown service' }
  }
}

/**
 * Mask an API key for display (show first 4 and last 4 chars)
 */
export function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 12) {
    return '********'
  }
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
}
