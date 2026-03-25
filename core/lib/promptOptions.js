import { DesignCore } from '../designCore.js';
import { Point } from '../entities/point.js';
import { Strings } from './strings.js';
import { Input } from './input.js';

/** PromptOptions Class */
export class PromptOptions {
  /**
   * Create PromptOptions
   * @param {string} promptMessage
   * @param {Array} types
   * @param {Array} options
   */
  constructor(promptMessage = 'error', types = [], options = []) {
    this.promptMessage = promptMessage;
    this.types = types;
    this.options = options;
    this.resolve = undefined;
    this.reject = undefined;
  }

  /**
   * Return data to the input request
   * @param {any} input
   */
  respond(input) {
    if (this.types.includes(Input.getType(input))) {
      if (Input.getType(input) === Input.Type.DYNAMIC) {
        // NUMBER input received
        // If the prompt allows for DYNAMIC input - convert NUMBER to a POINT
        if (!isNaN(input)) {
          const basePoint = DesignCore.Scene.inputManager.inputPoint;
          const angle = DesignCore.Scene.inputManager.inputPoint.angle(DesignCore.Mouse.pointOnScene());
          const point = basePoint.project(angle, input);
          input = point;
        }
      }

      // Update the last input point on inputManager
      if (Input.getType(input) === Input.Type.POINT) {
        DesignCore.Scene.inputManager.inputPoint = input;
      }

      // expected type input, pass to active command
      this.resolve(input);
    } else if (this.parseInputToOption(input) !== undefined) {
      // input matches command option, pass to active command
      this.resolve(this.parseInputToOption(input));
    } else {
      // Invalid input receieved. notify the user.
      DesignCore.Core.notify(`${Strings.Error.INPUT}: ${this.promptMessage}`);
    }
  }

  /**
   * Match the input to a command option
   * @param {any} input
   * @return {string} undefined or the matched option
   */
  parseInputToOption(input) {
    // no options to match
    if (this.options.length === 0) {
      return;
    }

    // can't match numbers options
    if (typeof(input) === 'number') {
      return;
    }

    // can't match points to options
    if (input instanceof Point) {
      return;
    }

    // loop through options to find a match
    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i];
      // convert the option to uppercase and substring to the input length for comparison
      const optionSubstring = option.toUpperCase().substring(0, input.length);
      if (optionSubstring === input.toUpperCase()) {
        return option;
      }
    }

    return;
  }

  /**
   * Cancel the input request by resolving with undefined
   */
  cancel() {
    if (this.resolve) {
      this.resolve(undefined);
    }
  }

  /**
   * Return the prompt for the input request
   * @return {string}
   */
  getPrompt() {
    let msg = `${this.promptMessage}`;
    if (this.options.length) {
      // Add \u0332 after the first letter of each option to include underscore
      const optionsWithShortcut = this.options.map((option) => this.getOptionWithShortcut(option));
      msg = `${this.promptMessage} ${Strings.Strings.OR} [${optionsWithShortcut}]`;
    }
    return msg;
  }

  /**
   * Underline the shortcut key for the prompt option
   * @param {string} option
   * @return {string} option with shortcut underlined
   */
  getOptionWithShortcut(option) {
    const optionWithShortcut = `${option.substring(0, 1)}\u0332${option.substring(1, option.length)}`;
    return optionWithShortcut;
  }

  /**
   * Set the resolve callback
   * @param {any} resolve - callback function
   */
  setResolve(resolve) {
    this.resolve = resolve;
  }

  /**
   * Set the reject callback
   * @param {any} reject - callback function
   */
  setReject(reject) {
    this.reject = reject;
  }
}
