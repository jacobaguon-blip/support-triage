/**
 * Skill Selector Modal Component
 * Modal for selecting which skill to use
 */

import blessed from 'blessed';
import { themeManager } from '../theme.js';

class SkillSelectorModal {
  constructor(screen, onSelect, onCancel) {
    this.screen = screen;
    this.onSelect = onSelect;
    this.onCancel = onCancel;
    this.selectedIndex = 0;

    this.skills = [
      {
        id: 'troubleshoot',
        name: 'Troubleshoot',
        description: 'Full investigation (4 agents)',
        agents: ['Slack', 'Linear', 'Pylon', 'Codebase']
      },
      {
        id: 'featurerequest',
        name: 'Feature Request / Bug Validation',
        description: 'Check duplicates (3 agents)',
        agents: ['Slack', 'Linear', 'Pylon']
      },
      {
        id: 'kbarticle',
        name: 'Knowledge Base Article',
        description: 'Gather info (3 agents)',
        agents: ['Linear', 'Pylon', 'Codebase']
      },
      {
        id: 'research',
        name: 'Research / Investigate',
        description: 'General research (3 agents)',
        agents: ['Slack', 'Linear', 'Codebase']
      },
      {
        id: 'adhoc',
        name: 'Ad-hoc Single Agent',
        description: 'Quick question (1 agent)',
        agents: ['User selects']
      }
    ];

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
      height: 18,
      border: {
        type: 'line'
      },
      label: ' Select Skill ',
      style: {
        bg: theme.modal.bg,
        fg: theme.modal.fg,
        border: theme.border.active,
        label: theme.label
      },
      tags: true
    });

    // Skill list
    this.list = blessed.list({
      parent: this.modal,
      top: 1,
      left: 1,
      width: '100%-2',
      height: '100%-3',
      keys: true,
      vi: true,
      mouse: true,
      style: {
        bg: theme.modal.bg,
        fg: theme.text.primary,
        selected: theme.list.selected,
        item: theme.list.item
      },
      tags: true
    });

    // Populate list
    const items = this.skills.map((skill, index) => {
      return [
        `{${theme.accents.blue}-fg}${index + 1}. ${skill.name}{/${theme.accents.blue}-fg}`,
        `   {${theme.text.secondary}-fg}${skill.description}{/${theme.text.secondary}-fg}`,
        `   {${theme.text.muted}-fg}Agents: ${skill.agents.join(', ')}{/${theme.text.muted}-fg}`
      ].join('\n');
    });

    this.list.setItems(items);
    this.list.select(0);

    // Help text
    this.helpText = blessed.text({
      parent: this.modal,
      bottom: 0,
      left: 2,
      content: `{${theme.accents.blue}-fg}[1-5]{/${theme.accents.blue}-fg} Select  {${theme.accents.blue}-fg}[↑/↓]{/${theme.accents.blue}-fg} Navigate  {${theme.accents.blue}-fg}[Enter]{/${theme.accents.blue}-fg} Confirm  {${theme.accents.blue}-fg}[Esc]{/${theme.accents.blue}-fg} Cancel`,
      tags: true,
      style: {
        fg: theme.text.secondary
      }
    });

    this.bindKeys();
    this.show();
  }

  bindKeys() {
    // Number keys 1-5 for quick selection
    for (let i = 1; i <= 5; i++) {
      this.screen.key([i.toString()], () => {
        this.selectedIndex = i - 1;
        this.submit();
      });
    }

    // Arrow keys
    this.list.key(['up', 'k'], () => {
      this.list.up(1);
      this.selectedIndex = this.list.selected;
      this.screen.render();
    });

    this.list.key(['down', 'j'], () => {
      this.list.down(1);
      this.selectedIndex = this.list.selected;
      this.screen.render();
    });

    // Enter to select
    this.list.key(['enter'], () => {
      this.selectedIndex = this.list.selected;
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
    this.list.focus();
    this.screen.render();
  }

  hide() {
    this.overlay.hide();
    this.modal.hide();
    this.screen.render();
  }

  submit() {
    const selectedSkill = this.skills[this.selectedIndex];

    if (this.onSelect) {
      this.onSelect(selectedSkill);
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

export default SkillSelectorModal;
