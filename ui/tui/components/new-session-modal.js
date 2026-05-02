/**
 * New Session Modal Component
 * Modal for entering ticket number and customer name
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class NewSessionModal {
  constructor(screen, onSubmit, onCancel) {
    this.screen = screen;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.currentField = 'ticket'; // 'ticket', 'customer', or 'context'

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
      width: 60,
      height: 18,
      border: {
        type: 'line'
      },
      label: ' New Session ',
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active,
        label: theme.label
      },
      tags: true
    });

    // Instructions
    this.instructions = blessed.text({
      parent: this.modal,
      top: 1,
      left: 2,
      content: 'Leave blank for ad-hoc research (no ticket)',
      style: {
        fg: theme.accents.orange
      }
    });

    // Ticket number label
    this.ticketLabel = blessed.text({
      parent: this.modal,
      top: 3,
      left: 2,
      content: '{bold}Ticket #:{/bold}',
      tags: true,
      style: {
        fg: theme.text.primary
      }
    });

    // Ticket number input
    this.ticketInput = blessed.textbox({
      parent: this.modal,
      top: 3,
      left: 13,
      width: 40,
      height: 1,
      keys: true,
      mouse: true,
      inputOnFocus: true,
      style: theme.input
    });

    // Customer name label
    this.customerLabel = blessed.text({
      parent: this.modal,
      top: 5,
      left: 2,
      content: '{bold}Customer:{/bold}',
      tags: true,
      style: {
        fg: theme.text.primary
      }
    });

    // Customer name input
    this.customerInput = blessed.textbox({
      parent: this.modal,
      top: 5,
      left: 13,
      width: 40,
      height: 1,
      keys: true,
      mouse: true,
      inputOnFocus: true,
      style: theme.input
    });

    // Extra context label
    this.contextLabel = blessed.text({
      parent: this.modal,
      top: 7,
      left: 2,
      content: '{bold}Extra context:{/bold}',
      tags: true,
      style: {
        fg: theme.text.primary
      }
    });

    // Extra context textarea
    this.contextInput = blessed.textarea({
      parent: this.modal,
      top: 8,
      left: 2,
      width: '100%-4',
      height: 5,
      border: {
        type: 'line'
      },
      keys: true,
      mouse: true,
      inputOnFocus: true,
      style: {
        bg: theme.input.bg,
        fg: theme.input.fg,
        border: theme.border.default
      },
      scrollable: true
    });

    // Help text
    this.helpText = blessed.text({
      parent: this.modal,
      bottom: 1,
      left: 2,
      content: `{${theme.accents.blue}-fg}[Tab]{/${theme.accents.blue}-fg} Next field  {${theme.accents.blue}-fg}[Enter]{/${theme.accents.blue}-fg} Continue  {${theme.accents.blue}-fg}[Esc]{/${theme.accents.blue}-fg} Cancel`,
      tags: true,
      style: {
        fg: theme.text.secondary
      }
    });

    this.bindKeys();
    this.show();
  }

  bindKeys() {
    // Submit events for each input
    this.ticketInput.on('submit', () => {
      // Move to next field on Enter
      this.customerInput.focus();
      this.customerInput.readInput();
    });

    this.customerInput.on('submit', () => {
      // Move to context field on Enter
      this.contextInput.focus();
      this.contextInput.readInput();
    });

    this.contextInput.on('submit', () => {
      // Submit the form on Enter from context field
      this.submit();
    });

    // Cancel events
    this.ticketInput.on('cancel', () => {
      this.cancel();
    });

    this.customerInput.on('cancel', () => {
      this.cancel();
    });

    this.contextInput.on('cancel', () => {
      this.cancel();
    });

    // Escape to cancel (global)
    this.modal.key(['escape'], () => {
      this.cancel();
    });
  }

  show() {
    this.overlay.show();
    this.modal.show();

    // Focus and activate the first input
    this.ticketInput.focus();

    // Use setImmediate to ensure rendering is complete before reading input
    setImmediate(() => {
      this.ticketInput.readInput();
    });

    this.screen.render();
  }

  hide() {
    this.overlay.hide();
    this.modal.hide();
    this.screen.render();
  }

  submit() {
    const ticketNumber = this.ticketInput.getValue().trim();
    const customerName = this.customerInput.getValue().trim();
    const extraContext = this.contextInput.getValue().trim();

    // Call the onSubmit callback with the data
    if (this.onSubmit) {
      this.onSubmit({
        ticketNumber: ticketNumber || null,
        customerName: customerName || null,
        extraContext: extraContext || null
      });
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

export default NewSessionModal;
