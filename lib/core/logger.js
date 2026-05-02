/**
 * Structured Logger
 * Logs to JSON Lines format for easy parsing and tailing
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

class Logger {
  constructor(logFile) {
    this.logFile = logFile;

    // Ensure log directory exists
    const logDir = path.dirname(logFile);
    fs.mkdirSync(logDir, { recursive: true });

    // Create write stream
    this.stream = fs.createWriteStream(logFile, { flags: 'a' });
  }

  /**
   * Log a structured message
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} msg - Log message
   * @param {Object} data - Additional structured data
   */
  log(level, msg, data = {}) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...data
    };

    const line = JSON.stringify(entry) + '\n';
    this.stream.write(line);

    // Also console.log for immediate feedback
    if (level === 'error') {
      console.error(`[${level.toUpperCase()}] ${msg}`, data);
    } else if (level === 'warn') {
      console.warn(`[${level.toUpperCase()}] ${msg}`, data);
    } else {
      console.log(`[${level.toUpperCase()}] ${msg}`);
    }
  }

  info(msg, data) {
    this.log('info', msg, data);
  }

  warn(msg, data) {
    this.log('warn', msg, data);
  }

  error(msg, data) {
    this.log('error', msg, data);
  }

  debug(msg, data) {
    this.log('debug', msg, data);
  }

  close() {
    this.stream.end();
  }
}

/**
 * Create a logger for an investigation
 * @param {number|string} investigationId - Investigation ID
 * @param {string} type - Log type ('main' or agent name like 'slack')
 * @returns {Logger}
 */
export function createInvestigationLogger(investigationId, type = 'main') {
  const logsDir = path.join(os.homedir(), 'support-triage', 'logs');
  const logFile = path.join(logsDir, `${investigationId}-${type}.jsonl`);
  return new Logger(logFile);
}

/**
 * Read log entries from a log file
 * @param {string} logFile - Path to log file
 * @param {Object} options - Options
 * @returns {Array} Array of log entries
 */
export function readLogEntries(logFile, options = {}) {
  const { tail = null, follow = false } = options;

  if (!fs.existsSync(logFile)) {
    return [];
  }

  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.trim().split('\n').filter(line => line.length > 0);

  let entries = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return { ts: new Date().toISOString(), level: 'error', msg: 'Parse error', raw: line };
    }
  });

  if (tail && tail > 0) {
    entries = entries.slice(-tail);
  }

  return entries;
}

/**
 * Follow a log file (like tail -f)
 * @param {string} logFile - Path to log file
 * @param {Function} callback - Called for each new line
 */
export function followLog(logFile, callback) {
  // Ensure file exists
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
  }

  const watcher = fs.watch(logFile, (eventType) => {
    if (eventType === 'change') {
      // Read new lines
      // This is simplified - in production you'd track file position
      const entries = readLogEntries(logFile, { tail: 10 });
      entries.forEach(callback);
    }
  });

  // Initial read
  const entries = readLogEntries(logFile);
  entries.forEach(callback);

  return watcher;
}

export default Logger;
