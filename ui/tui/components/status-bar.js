/**
 * Status Bar Component
 * Bottom bar showing keybindings and status
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class StatusBar {
  constructor(screen, options) {
    this.screen = screen;
    const theme = themeManager.getTheme();

    this.widget = blessed.box({
      parent: screen,
      bottom: options.bottom,
      left: options.left,
      width: options.width,
      height: options.height,
      content: 's:search n:new d:theme j/k:nav 1-6:tabs q:quit ?:help',
      style: theme.statusBar,
      tags: true
    });
  }

  setText(text) {
    this.widget.setContent(text);
  }

  setKeybindings(bindings) {
    this.widget.setContent(bindings);
  }

  showMessage(message, duration = 3000) {
    const originalText = this.widget.getContent();
    this.widget.setContent(message);

    setTimeout(() => {
      this.widget.setContent(originalText);
      this.screen.render();
    }, duration);
  }
}

export default StatusBar;
