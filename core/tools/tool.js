/**
 * Tool Class
 */
export class Tool {
  /** Create a Tool command */
  constructor() {
    Object.defineProperty(this, 'type', {
      value: this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'points', {
      value: [],
      writable: true,
    });
  }

  /**
   * Preview the command during execution
   */
  preview() {
    // preview function to be overidden by implementation
  };

  /**
   * Perform the command
   */
  action() {
    // action function to be overidden by implementation
  };
}

