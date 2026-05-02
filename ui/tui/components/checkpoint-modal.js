/**
 * Checkpoint Approval Modal Component
 * Shows when an agent reaches a checkpoint and needs approval
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class CheckpointModal {
  constructor(screen, checkpointData, onApprove, onReject, onFeedback, onCancel) {
    this.screen = screen;
    this.checkpointData = checkpointData; // { agentName, message }
    this.onApprove = onApprove;
    this.onReject = onReject;
    this.onFeedback = onFeedback;
    this.onCancel = onCancel;
    this.selectedAction = 'approve'; // 'approve', 'reject', 'feedback'

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
      width: 70,
      height: 20,
      border: {
        type: 'line'
      },
      label: ' 🔵 Checkpoint Approval ',
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active,
        label: theme.label
      },
      tags: true
    });

    // Agent name
    this.agentLabel = blessed.text({
      parent: this.modal,
      top: 1,
      left: 2,
      content: `{${theme.accents.purple}-fg}${this.checkpointData.agentName} Agent{/${theme.accents.purple}-fg} requests approval:`,
      tags: true,
      style: {
        fg: theme.text.primary,
        bold: true
      }
    });

    // Checkpoint message
    this.messageBox = blessed.box({
      parent: this.modal,
      top: 3,
      left: 2,
      width: '100%-4',
      height: 4,
      border: {
        type: 'line'
      },
      style: {
        bg: theme.card.bg,
        fg: theme.text.primary,
        border: theme.border.default
      },
      content: this.checkpointData.message || 'No message provided',
      tags: true,
      scrollable: true
    });

    // Action buttons
    this.actionButtons = blessed.box({
      parent: this.modal,
      top: 8,
      left: 2,
      width: '100%-4',
      height: 3,
      tags: true
    });

    this.renderActionButtons();

    // Feedback input label
    this.feedbackLabel = blessed.text({
      parent: this.modal,
      top: 12,
      left: 2,
      content: 'Your feedback (optional):',
      style: {
        fg: theme.text.secondary
      }
    });

    // Feedback text area
    this.feedbackInput = blessed.textarea({
      parent: this.modal,
      top: 13,
      left: 2,
      width: '100%-4',
      height: 3,
      border: {
        type: 'line'
      },
      style: theme.input,
      inputOnFocus: true
    });

    // Help text
    this.helpText = blessed.text({
      parent: this.modal,
      bottom: 1,
      left: 2,
      content: `{${theme.accents.blue}-fg}[A]{/${theme.accents.blue}-fg} Approve  {${theme.accents.blue}-fg}[R]{/${theme.accents.blue}-fg} Reject  {${theme.accents.blue}-fg}[F]{/${theme.accents.blue}-fg} Add Feedback  {${theme.accents.blue}-fg}[Tab]{/${theme.accents.blue}-fg} Edit  {${theme.accents.blue}-fg}[Enter]{/${theme.accents.blue}-fg} Submit  {${theme.accents.blue}-fg}[Esc]{/${theme.accents.blue}-fg} Cancel`,
      tags: true,
      style: {
        fg: theme.text.muted
      }
    });

    this.bindKeys();
    this.show();
  }

  renderActionButtons() {
    const theme = themeManager.getTheme();

    const buttons = [
      { key: 'A', label: 'Approve', action: 'approve', color: theme.accents.green },
      { key: 'R', label: 'Reject', action: 'reject', color: theme.accents.orange },
      { key: 'F', label: 'Add Feedback', action: 'feedback', color: theme.accents.blue }
    ];

    const buttonStrings = buttons.map(btn => {
      const isSelected = this.selectedAction === btn.action;
      if (isSelected) {
        return `{${btn.color}-bg}{black-fg} [${btn.key}] ${btn.label} {/black-fg}{/${btn.color}-bg}`;
      } else {
        return `{${btn.color}-fg}[${btn.key}]{/${btn.color}-fg} ${btn.label}`;
      }
    });

    this.actionButtons.setContent(buttonStrings.join('   '));
  }

  bindKeys() {
    // Select actions
    this.screen.key(['a', 'A'], () => {
      this.selectedAction = 'approve';
      this.renderActionButtons();
      this.screen.render();
    });

    this.screen.key(['r', 'R'], () => {
      this.selectedAction = 'reject';
      this.renderActionButtons();
      this.screen.render();
    });

    this.screen.key(['f', 'F'], () => {
      this.selectedAction = 'feedback';
      this.feedbackInput.focus();
      this.renderActionButtons();
      this.screen.render();
    });

    // Tab to edit feedback
    this.screen.key(['tab'], () => {
      this.feedbackInput.focus();
      this.screen.render();
    });

    // Enter to submit
    this.screen.key(['enter'], () => {
      this.submit();
    });

    // Escape to cancel
    this.screen.key(['escape'], () => {
      this.cancel();
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

  submit() {
    const feedback = this.feedbackInput.getValue().trim();

    if (this.selectedAction === 'approve') {
      if (this.onApprove) {
        this.onApprove(feedback || null);
      }
    } else if (this.selectedAction === 'reject') {
      if (this.onReject) {
        this.onReject(feedback || null);
      }
    } else if (this.selectedAction === 'feedback') {
      if (this.onFeedback) {
        this.onFeedback(feedback || '');
      }
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

export default CheckpointModal;
