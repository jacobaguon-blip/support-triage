/**
 * Agent Tabs Component
 * Shows 6 tabs: Slack, Linear, Pylon, Codebase, Summary, Response
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class AgentTabs {
  constructor(screen, options) {
    this.screen = screen;
    this.selectedIndex = 0;
    this.theme = themeManager.getTheme();

    // Tab definitions
    this.tabs = [
      { name: 'Slack', icon: '💬', status: 'pending' },
      { name: 'Linear', icon: '📋', status: 'pending' },
      { name: 'Pylon', icon: '🎫', status: 'pending' },
      { name: 'Codebase', icon: '💻', status: 'pending' },
      { name: 'Summary', icon: '📊', status: null },
      { name: 'Response', icon: '💬', status: null }
    ];

    // Use a simple box instead of listbar to avoid complexity
    this.widget = blessed.box({
      parent: screen,
      left: options.left,
      top: options.top,
      width: options.width,
      height: options.height,
      tags: true,
      style: {
        bg: this.theme.card.bg,
        fg: this.theme.card.fg
      }
    });

    this.render();
  }

  setAgentStatus(agentIndex, status) {
    if (agentIndex >= 0 && agentIndex < 4) {
      this.tabs[agentIndex].status = status;
      this.render();
    }
  }

  selectTab(index) {
    if (index >= 0 && index < this.tabs.length) {
      this.selectedIndex = index;
      this.render();
    }
  }

  selectNext() {
    this.selectedIndex = (this.selectedIndex + 1) % this.tabs.length;
    this.render();
  }

  selectPrevious() {
    this.selectedIndex = (this.selectedIndex - 1 + this.tabs.length) % this.tabs.length;
    this.render();
  }

  getStatusIcon(status) {
    switch (status) {
      case 'completed':
        return '🟢';
      case 'running':
        return '🟡';
      case 'error':
        return '🔴';
      case 'checkpoint':
        return '🔵';
      case 'pending':
        return '○';
      default:
        return '';
    }
  }

  render() {
    const selectedBg = this.theme.list.selected.bg;
    const selectedFg = this.theme.list.selected.fg;
    const mutedFg = this.theme.text.muted;

    const tabStrings = this.tabs.map((tab, index) => {
      const statusIcon = tab.status ? this.getStatusIcon(tab.status) : '';
      const label = statusIcon ? `${tab.icon} ${tab.name} ${statusIcon}` : `${tab.icon} ${tab.name}`;

      // Highlight selected tab
      if (index === this.selectedIndex) {
        return `{${selectedBg}-bg}{${selectedFg}-fg} ${label} {/${selectedFg}-fg}{/${selectedBg}-bg}`;
      } else {
        return `{${mutedFg}-fg} ${label} {/${mutedFg}-fg}`;
      }
    });

    this.widget.setContent('  ' + tabStrings.join('  '));
  }

  getSelectedTab() {
    return this.tabs[this.selectedIndex];
  }

  getSelectedIndex() {
    return this.selectedIndex;
  }

  setTabStatus(tabIndex, status) {
    // Alias for setAgentStatus for consistency
    this.setAgentStatus(tabIndex, status);
  }
}

export default AgentTabs;
