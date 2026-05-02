/**
 * New Session Modal Component (Simplified)
 * Uses blessed's built-in prompt instead of complex textbox widgets
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class NewSessionModal {
  constructor(screen, onSubmit, onCancel) {
    this.screen = screen;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;

    this.data = {
      ticketNumber: null,
      customerName: null,
      extraContext: null
    };

    this.start();
  }

  async start() {
    // Step 1: Ask for ticket number
    await this.promptTicketNumber();
  }

  promptTicketNumber() {
    const theme = themeManager.getTheme();

    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 'shrink',
      border: 'line',
      label: ' Ticket Number ',
      tags: true,
      keys: true,
      vi: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active
      },
      // Explicitly set input field colors
      inputStyle: {
        bg: 'white',
        fg: 'black'
      }
    });

    prompt.input(
      'Enter ticket number (or leave blank for ad-hoc):',
      '',
      (err, value) => {
        if (err) {
          this.cancel();
          return;
        }

        this.data.ticketNumber = value?.trim() || null;
        this.promptCustomerName();
      }
    );

    this.screen.render();
  }

  promptCustomerName() {
    const theme = themeManager.getTheme();

    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 'shrink',
      border: 'line',
      label: ' Customer Name ',
      tags: true,
      keys: true,
      vi: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active
      },
      // Explicitly set input field colors
      inputStyle: {
        bg: 'white',
        fg: 'black'
      }
    });

    prompt.input(
      'Enter customer name (optional):',
      '',
      (err, value) => {
        if (err) {
          this.cancel();
          return;
        }

        this.data.customerName = value?.trim() || null;
        this.promptExtraContext();
      }
    );

    this.screen.render();
  }

  promptExtraContext() {
    const theme = themeManager.getTheme();

    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 70,
      height: 'shrink',
      border: 'line',
      label: ' Extra Context ',
      tags: true,
      keys: true,
      vi: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active
      },
      // Explicitly set input field colors
      inputStyle: {
        bg: 'white',
        fg: 'black'
      }
    });

    prompt.input(
      'Enter extra context (optional):',
      '',
      (err, value) => {
        if (err) {
          this.cancel();
          return;
        }

        this.data.extraContext = value?.trim() || null;
        this.submit();
      }
    );

    this.screen.render();
  }

  submit() {
    if (this.onSubmit) {
      this.onSubmit(this.data);
    }
  }

  cancel() {
    if (this.onCancel) {
      this.onCancel();
    }
  }
}

export default NewSessionModal;
