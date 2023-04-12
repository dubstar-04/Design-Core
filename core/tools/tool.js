export class Tool {
  constructor() {
    Object.defineProperty(this, 'type', {
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'selectionRequired', {
      enumerable: false,
      value: true,
      writable: true,
    });

    Object.defineProperty(this, 'showHelperGeometry', {
      enumerable: false,
      value: false,
      writable: true,
    });
  }

  action(core) {
    // action function to be overidden by implementation
  };

  preview(core) {
    // preview function to be overidden by implementation
  };
}

