/**
 * Session List Component - Left Sidebar
 * Shows list of all active investigations/tickets
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class SessionList {
  constructor(screen, options) {
    this.screen = screen;
    this.sessions = [];
    this.selectedIndex = 0;

    const theme = themeManager.getTheme();

    this.widget = blessed.list({
      parent: screen,
      left: options.left,
      top: options.top,
      width: options.width,
      height: options.height,
      label: ' Sessions ',
      border: {
        type: 'line'
      },
      style: {
        bg: theme.list.bg,
        fg: theme.list.fg,
        border: theme.border.default,
        selected: theme.list.selected,
        item: theme.list.item,
        label: theme.label
      },
      keys: false,      // Disable built-in key handling
      vi: false,        // Disable vi keys (we handle in app.js)
      mouse: true,
      tags: true,
      scrollable: true,
      alwaysScroll: true
    });

    // Default empty state
    this.widget.setItems([
      '{center}{dim}No sessions yet{/dim}{/center}',
      '',
      '{center}{cyan}Press N to create new session{/cyan}{/center}'
    ]);
  }

  setSessions(sessions) {
    this.sessions = sessions;
    this.render();
  }

  addSession(session) {
    this.sessions.push(session);
    this.render();
  }

  removeSession(index) {
    this.sessions.splice(index, 1);
    this.render();
  }

  selectNext() {
    if (this.sessions.length === 0) return;
    this.selectedIndex = Math.min(this.selectedIndex + 1, this.sessions.length - 1);
    this.widget.select(this.selectedIndex);
  }

  selectPrevious() {
    if (this.sessions.length === 0) return;
    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    this.widget.select(this.selectedIndex);
  }

  getSelectedSession() {
    return this.sessions[this.selectedIndex];
  }

  render() {
    if (this.sessions.length === 0) {
      this.widget.setItems([
        '{center}{dim}No sessions yet{/dim}{/center}',
        '',
        '{center}{cyan}Press N to create new session{/cyan}{/center}'
      ]);
      return;
    }

    const items = this.sessions.map((session, index) => {
      const statusIcon = this.getStatusIcon(session.status);
      const agentCount = session.agents ? session.agents.filter(a => a.status === 'completed').length : 0;
      const totalAgents = session.agents ? session.agents.length : 0;

      return [
        `{bold}${session.ticketNumber || 'No Ticket'}{/bold}`,
        `${statusIcon} ${session.customerName || 'Unknown'}`,
        `   [${agentCount}/${totalAgents}]`
      ].join('\n');
    });

    // Add "Press N for new" option at bottom
    items.push('', '{center}{dim}[Press N for new]{/dim}{/center}');

    this.widget.setItems(items);
    this.widget.select(this.selectedIndex);
  }

  getStatusIcon(status) {
    switch (status) {
      case 'completed':
        return '🟢';
      case 'running':
        return '🟡';
      case 'error':
        return '🔴';
      case 'waiting':
        return '🔵';
      default:
        return '○';
    }
  }
}

export default SessionList;
