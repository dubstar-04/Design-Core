import { DesignCore } from '../designCore.js';

/**
 * Tool Class
 */
export class Tool {
  /** Create a Tool command */
  constructor() {
    Object.defineProperty(this, 'type', {
      value: this.constructor.type ?? this.constructor.name,
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
    // preview function to be overridden by implementation
  };

  /**
   * Perform the command
   */
  action() {
    // action function to be overridden by implementation
  };

  /**
   * Cancel this command while it is active - overridden by implementations that need to
   * clean up differently to the default full reset (e.g. GripStretch, which must not deselect)
   */
  cancel() {
    DesignCore.Scene.inputManager.reset();
  };
}

