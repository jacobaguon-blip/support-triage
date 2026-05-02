/**
 * Ticket Summary Modal Component
 * Shows Pylon ticket details before launching agents
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class TicketSummaryModal {
  constructor(screen, ticketData, onContinue, onCancel) {
    this.screen = screen;
    this.ticketData = ticketData;
    this.onContinue = onContinue;
    this.onCancel = onCancel;

    this.createModal();
  }

  createModal() {
    const theme = themeManager.getTheme();

    // Overlay background
    this.overlay = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: 'black',
        fg: 'white',
        transparent: true
      }
    });

    // Modal box
    this.modal = blessed.box({
      parent: this.overlay,
      top: 'center',
      left: 'center',
      width: 80,
      height: 20,
      border: {
        type: 'line'
      },
      label: ` Ticket ${this.ticketData.ticketNumber || 'Summary'} `,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active,
        label: theme.label
      },
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true
    });

    // Build summary content
    const content = this.buildSummaryContent();
    this.modal.setContent(content);

    // Help text
    this.helpText = blessed.text({
      parent: this.modal,
      bottom: 0,
      left: 2,
      content: `{${theme.accents.blue}-fg}[Enter]{/${theme.accents.blue}-fg} Continue  {${theme.accents.blue}-fg}[Esc]{/${theme.accents.blue}-fg} Cancel`,
      tags: true,
      style: {
        fg: theme.text.secondary
      }
    });

    this.bindKeys();
    this.show();
  }

  buildSummaryContent() {
    const t = this.ticketData;
    const theme = themeManager.getTheme();

    const lines = [
      '',
      `{${theme.accents.purple}-fg}Customer:{/${theme.accents.purple}-fg} ${t.customerName || 'Unknown'}`,
      `{${theme.accents.purple}-fg}Priority:{/${theme.accents.purple}-fg} ${t.priority || 'Not set'}`,
      `{${theme.accents.purple}-fg}Created:{/${theme.accents.purple}-fg} ${t.created ? new Date(t.created).toLocaleDateString() : 'Unknown'}`,
      '',
      `{${theme.accents.purple}-fg}Title:{/${theme.accents.purple}-fg}`,
      `${t.title || 'No title'}`,
      '',
      `{${theme.accents.purple}-fg}Description:{/${theme.accents.purple}-fg}`,
      `${t.description || 'No description'}`,
      ''
    ];

    if (t.threadCount) {
      lines.push(`{${theme.accents.purple}-fg}Thread:{/${theme.accents.purple}-fg} ${t.threadCount} messages (last: ${t.lastMessage || 'unknown'})`);
      lines.push('');
    }

    lines.push(`{${theme.text.muted}-fg}Press Enter to continue to skill selection{/${theme.text.muted}-fg}`);

    return lines.join('\n');
  }

  bindKeys() {
    // Enter to continue
    this.modal.key(['enter'], () => {
      this.continue();
    });

    // Escape to cancel
    this.screen.key(['escape'], () => {
      this.cancel();
    });

    // Scroll with vi keys
    this.modal.key(['j', 'down'], () => {
      this.modal.scroll(1);
      this.screen.render();
    });

    this.modal.key(['k', 'up'], () => {
      this.modal.scroll(-1);
      this.screen.render();
    });
  }

  show() {
    this.overlay.show();
    this.modal.show();
    this.modal.focus();
    this.screen.render();
  }

  hide() {
    this.overlay.hide();
    this.modal.hide();
    this.screen.render();
  }

  continue() {
    if (this.onContinue) {
      this.onContinue();
    }
    this.destroy();
  }

  cancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.destroy();
  }

  destroy() {
    this.screen.remove(this.overlay);
    this.screen.render();
  }
}

export default TicketSummaryModal;
