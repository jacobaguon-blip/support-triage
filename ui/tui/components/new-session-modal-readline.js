/**
 * New Session Modal Component (Using readline)
 * Temporarily exits blessed to use simple readline prompts
 */

import readline from 'readline';

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
    // Temporarily suspend blessed to use readline
    this.screen.program.disableMouse();
    this.screen.program.showCursor();
    this.screen.leave();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      // Prompt 1: Ticket number
      const ticketNumber = await new Promise((resolve) => {
        rl.question('\nTicket number (or press Enter for ad-hoc): ', (answer) => {
          resolve(answer.trim() || null);
        });
      });
      this.data.ticketNumber = ticketNumber;

      // Prompt 2: Customer name
      const customerName = await new Promise((resolve) => {
        rl.question('Customer name (optional): ', (answer) => {
          resolve(answer.trim() || null);
        });
      });
      this.data.customerName = customerName;

      // Prompt 3: Extra context
      const extraContext = await new Promise((resolve) => {
        rl.question('Extra context (optional): ', (answer) => {
          resolve(answer.trim() || null);
        });
      });
      this.data.extraContext = extraContext;

      rl.close();

      // Resume blessed
      this.screen.program.alternateBuffer();
      this.screen.program.enableMouse();
      this.screen.program.hideCursor();
      this.screen.enter();
      this.screen.render();

      // Submit the data
      this.submit();
    } catch (error) {
      rl.close();

      // Resume blessed on error
      this.screen.program.alternateBuffer();
      this.screen.program.enableMouse();
      this.screen.program.hideCursor();
      this.screen.enter();
      this.screen.render();

      this.cancel();
    }
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
