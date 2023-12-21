export class Tool {
  constructor() {
    Object.defineProperty(this, 'type', {
      // enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'points', {
      // enumerable: false,
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

