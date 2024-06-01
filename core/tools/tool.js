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

  action() {
    // action function to be overidden by implementation
  };

  preview() {
    // preview function to be overidden by implementation
  };
}

