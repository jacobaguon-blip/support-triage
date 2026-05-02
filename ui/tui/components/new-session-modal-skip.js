/**
 * New Session Modal Component (Skip for testing)
 * Immediately creates a test session without input
 */

class NewSessionModal {
  constructor(screen, onSubmit, onCancel) {
    this.screen = screen;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;

    // Immediately submit with test data
    this.submit();
  }

  submit() {
    if (this.onSubmit) {
      // Create a test session with realistic ticket number (just numbers)
      const timestamp = Date.now().toString().slice(-4);
      this.onSubmit({
        ticketNumber: timestamp, // Just a number like "8484"
        customerName: 'Test Customer',
        extraContext: 'Testing the TUI flow'
      });
    }
  }

  cancel() {
    if (this.onCancel) {
      this.onCancel();
    }
  }
}

export default NewSessionModal;
