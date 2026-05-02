/**
 * Search Modal Component
 * Search for investigations by ticket number, customer, or keywords
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class SearchModal {
  constructor(screen, db, onSelect, onCancel) {
    this.screen = screen;
    this.db = db;
    this.onSelect = onSelect;
    this.onCancel = onCancel;
    this.searchResults = [];
    this.selectedIndex = 0;

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
      label: ' 🔍 Search Investigations ',
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active,
        label: theme.label
      },
      tags: true
    });

    // Search input label
    this.searchLabel = blessed.text({
      parent: this.modal,
      top: 1,
      left: 2,
      content: 'Search:',
      style: {
        fg: theme.text.primary,
        bold: true
      }
    });

    // Search input
    this.searchInput = blessed.textbox({
      parent: this.modal,
      top: 1,
      left: 11,
      width: '100%-13',
      height: 1,
      inputOnFocus: true,
      style: theme.input
    });

    // Results list
    this.resultsList = blessed.list({
      parent: this.modal,
      top: 3,
      left: 1,
      width: '100%-2',
      height: '100%-5',
      keys: true,
      vi: true,
      mouse: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.text.primary,
        selected: theme.list.selected,
        item: theme.list.item
      },
      tags: true,
      scrollable: true
    });

    // Help text
    this.helpText = blessed.text({
      parent: this.modal,
      bottom: 1,
      left: 2,
      content: `{${theme.accents.blue}-fg}[↑/↓]{/${theme.accents.blue}-fg} Navigate  {${theme.accents.blue}-fg}[Enter]{/${theme.accents.blue}-fg} Open  {${theme.accents.blue}-fg}[Esc]{/${theme.accents.blue}-fg} Cancel`,
      tags: true,
      style: {
        fg: theme.text.muted
      }
    });

    // Show initial placeholder
    this.resultsList.setItems(['{center}{dim}Enter search query and press Enter{/dim}{/center}']);

    this.bindKeys();
    this.show();
  }

  bindKeys() {
    // Search on enter in input field
    this.searchInput.key(['enter'], async () => {
      const query = this.searchInput.getValue().trim();
      if (query) {
        await this.performSearch(query);
      }
    });

    // Navigate results
    this.resultsList.key(['up', 'k'], () => {
      this.resultsList.up(1);
      this.selectedIndex = this.resultsList.selected;
      this.screen.render();
    });

    this.resultsList.key(['down', 'j'], () => {
      this.resultsList.down(1);
      this.selectedIndex = this.resultsList.selected;
      this.screen.render();
    });

    // Select result
    this.resultsList.key(['enter'], () => {
      this.selectResult();
    });

    // Escape to cancel
    this.screen.key(['escape'], () => {
      this.cancel();
    });

    // Focus search input on tab
    this.screen.key(['tab'], () => {
      this.searchInput.focus();
      this.screen.render();
    });
  }

  async performSearch(query) {
    const theme = themeManager.getTheme();
    this.resultsList.setItems(['{center}{dim}Searching...{/dim}{/center}']);
    this.screen.render();

    try {
      // Get all investigations from database
      const investigations = await this.db.getAllInvestigations();

      // Filter by query
      const lowerQuery = query.toLowerCase();
      this.searchResults = investigations.filter(inv => {
        const ticketMatch = inv.id?.toString().toLowerCase().includes(lowerQuery);
        const customerMatch = inv.customer_name?.toLowerCase().includes(lowerQuery);
        const classificationMatch = inv.classification?.toLowerCase().includes(lowerQuery);

        return ticketMatch || customerMatch || classificationMatch;
      });

      if (this.searchResults.length === 0) {
        this.resultsList.setItems(['{center}{dim}No results found{/dim}{/center}']);
      } else {
        const items = this.searchResults.map((inv, index) => {
          const statusIcon = this.getStatusIcon(inv.status);
          const ticketNum = inv.id || 'unknown';
          const customer = inv.customer_name || 'Unknown';
          const classification = inv.classification || 'N/A';

          return [
            `{${theme.accents.blue}-fg}${ticketNum}{/${theme.accents.blue}-fg} - ${customer}`,
            `   {${theme.text.secondary}-fg}${classification}{/${theme.text.secondary}-fg}  ${statusIcon} {${theme.text.muted}-fg}${inv.status}{/${theme.text.muted}-fg}`
          ].join('\n');
        });

        this.resultsList.setItems(items);
        this.resultsList.select(0);
        this.selectedIndex = 0;
      }
    } catch (error) {
      this.resultsList.setItems([`{center}{red}Error: ${error.message}{/red}{/center}`]);
    }

    this.resultsList.focus();
    this.screen.render();
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

  selectResult() {
    if (this.searchResults.length > 0 && this.selectedIndex < this.searchResults.length) {
      const selected = this.searchResults[this.selectedIndex];
      if (this.onSelect) {
        this.onSelect(selected);
      }
      this.destroy();
    }
  }

  show() {
    this.overlay.show();
    this.modal.show();
    this.searchInput.focus();
    this.screen.render();
  }

  hide() {
    this.overlay.hide();
    this.modal.hide();
    this.screen.render();
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

export default SearchModal;
