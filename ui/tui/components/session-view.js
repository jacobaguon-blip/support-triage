/**
 * Session View Component
 * Main content area showing agent output, summary, or response
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class SessionView {
  constructor(screen, options) {
    this.screen = screen;
    const theme = themeManager.getTheme();

    this.widget = blessed.log({
      parent: screen,
      left: options.left,
      top: options.top,
      width: options.width,
      height: options.height,
      label: ' Agent Output ',
      border: {
        type: 'line'
      },
      style: {
        bg: theme.box.bg,
        fg: theme.box.fg,
        border: theme.border.default,
        label: theme.label
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: '│',
        style: {
          fg: theme.border.default.fg
        }
      },
      keys: true,
      vi: true,
      mouse: true,
      tags: true
    });

    this.showWelcome();
  }

  showWelcome() {
    const theme = themeManager.getTheme();
    this.widget.log(`{center}{${theme.accents.blue}-fg}Support Triage Session Manager{/${theme.accents.blue}-fg}{/center}`);
    this.widget.log('');
    this.widget.log(`{center}{${theme.text.secondary}-fg}No session selected{/${theme.text.secondary}-fg}{/center}`);
    this.widget.log('');
    this.widget.log(`{center}{${theme.text.muted}-fg}Press N to create a new session{/${theme.text.muted}-fg}{/center}`);
    this.widget.log(`{center}{${theme.text.muted}-fg}Press ? for help | Press D to toggle theme{/${theme.text.muted}-fg}{/center}`);
  }

  showMessage(title, message) {
    this.widget.setLabel(` ${title} `);
    this.widget.setContent(message);
  }

  appendLog(message, timestamp = true) {
    if (timestamp) {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour12: false });
      this.widget.log(`{dim}${time}{/dim} ${message}`);
    } else {
      this.widget.log(message);
    }
  }

  showAgentOutput(agentName, messages) {
    this.widget.setLabel(` ${agentName} Agent Output `);
    this.clear();

    messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour12: false });
      const roleColor = msg.role === 'user' ? 'yellow' : 'green';

      this.widget.log(`{dim}${time}{/dim} {${roleColor}}${msg.role}{/${roleColor}}: ${msg.content}`);

      if (msg.toolUses && msg.toolUses.length > 0) {
        msg.toolUses.forEach(tool => {
          this.widget.log(`  {cyan}[Tool: ${tool.name}]{/cyan} ${tool.status || ''}`);
        });
      }
    });
  }

  showSummary(summary) {
    this.widget.setLabel(' Investigation Summary ');
    this.clear();

    // TODO: Format summary nicely
    this.widget.log('{bold}{cyan}Investigation Summary{/cyan}{/bold}');
    this.widget.log('');
    this.widget.log(summary);
  }

  showResponse(response) {
    this.widget.setLabel(' Customer Response ');
    this.clear();

    // TODO: Make editable
    this.widget.log('{bold}{cyan}Customer Response (Draft){/cyan}{/bold}');
    this.widget.log('');
    this.widget.log(response);
    this.widget.log('');
    this.widget.log('{dim}Press i to edit | Press c to copy to clipboard{/dim}');
  }

  setContent(content) {
    // Set raw content (for agent output streaming)
    this.clear();
    const lines = content.split('\n');
    lines.forEach(line => {
      this.widget.log(line);
    });
  }

  clear() {
    this.widget.setContent('');
  }

  focus() {
    this.widget.focus();
  }
}

export default SessionView;
