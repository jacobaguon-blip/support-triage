/**
 * triage logs command
 * View investigation logs
 */

import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import { readLogEntries, followLog } from '../../core/logger.js';

export default async function logsCommand(id, options) {
  const { agent, follow, tail } = options;

  const logsDir = path.join(os.homedir(), 'support-triage', 'logs');
  let logFile;

  if (agent) {
    logFile = path.join(logsDir, `${id}-agent-${agent}.jsonl`);
  } else {
    logFile = path.join(logsDir, `${id}-main.jsonl`);
  }

  if (!fs.existsSync(logFile)) {
    console.error(`Log file not found: ${logFile}`);
    console.error('');
    console.error('Available logs:');
    const files = fs.readdirSync(logsDir).filter(f => f.startsWith(`${id}-`));
    files.forEach(f => console.error(`  ${f}`));
    process.exit(1);
  }

  if (follow) {
    // Use native tail -f for following logs
    console.log(`Following ${agent ? agent + ' agent' : 'main'} log for investigation #${id}...`);
    console.log(`(Press Ctrl+C to stop)`);
    console.log('');

    const tailProcess = spawn('tail', ['-f', logFile], {
      stdio: 'inherit'
    });

    tailProcess.on('exit', (code) => {
      process.exit(code);
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      tailProcess.kill();
      process.exit(0);
    });

  } else {
    // Read and display log entries
    const entries = readLogEntries(logFile, { tail: parseInt(tail) });

    if (entries.length === 0) {
      console.log('No log entries found');
      return;
    }

    console.log(`Showing last ${entries.length} entries from ${agent ? agent + ' agent' : 'main'} log:`);
    console.log('');

    entries.forEach(entry => {
      const levelColor = {
        info: '\x1b[36m',    // cyan
        warn: '\x1b[33m',    // yellow
        error: '\x1b[31m',   // red
        debug: '\x1b[90m'    // gray
      }[entry.level] || '';
      const reset = '\x1b[0m';

      const timestamp = entry.ts || '';
      const level = entry.level ? entry.level.toUpperCase().padEnd(5) : 'INFO ';
      const msg = entry.msg || JSON.stringify(entry);

      console.log(`${timestamp} ${levelColor}${level}${reset} ${msg}`);

      // Show additional data if present
      const dataKeys = Object.keys(entry).filter(k => !['ts', 'level', 'msg'].includes(k));
      if (dataKeys.length > 0) {
        const data = {};
        dataKeys.forEach(k => data[k] = entry[k]);
        console.log(`  ${JSON.stringify(data)}`);
      }
    });

    console.log('');
    console.log(`Total entries: ${entries.length}`);
    console.log('');
    console.log('To follow log in real-time:');
    console.log(`  triage logs ${id}${agent ? ` --agent ${agent}` : ''} -f`);
    console.log('');
  }
}
