/**
 * Tool Class
 */
export class Tool {
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

