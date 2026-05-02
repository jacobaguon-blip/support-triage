/**
 * TUI Logger
 * Logs all TUI events, errors, and state changes to a file
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

class Logger {
  constructor() {
    this.logDir = path.join(os.homedir(), 'support-triage', 'logs');
    fs.mkdirSync(this.logDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(this.logDir, `tui-${timestamp}.log`);
    this.stream = fs.createWriteStream(this.logFile, { flags: 'a' });

    this.log('info', 'Logger initialized', { logFile: this.logFile });
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };

    const line = JSON.stringify(entry) + '\n';
    this.stream.write(line);

    // Also log to console for debugging
    if (level === 'error') {
      console.error(`[TUI ${level.toUpperCase()}]`, message, data);
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  // Log UI events
  event(eventType, data) {
    this.log('event', eventType, data);
  }

  // Log screen state
  screenState(state, data) {
    this.log('screen', state, data);
  }

  close() {
    this.stream.end();
  }
}

// Singleton instance
export const logger = new Logger();
export default logger;
