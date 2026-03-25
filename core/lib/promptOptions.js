import { DesignCore } from '../designCore.js';
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
   * Check if the input matches the accepted types
   * @param {any} input
   * @return {boolean}
   */
  acceptsInput(input) {
    const inputType = Input.getType(input);
    if (this.types.includes(inputType)) return true;
    if (this.types.includes(Input.Type.DYNAMIC) && !isNaN(input)) return true;
    return false;
  }

  /**
   * Create a new promise for this prompt
   * @return {Promise}
   */
  createPromise() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  /**
   * Return data to the input request
   * @param {any} input
   * @return {boolean} true if input was accepted
   */
  respond(input) {
    if (this.acceptsInput(input)) {
      this.resolve(input);
      return true;
    }

    const matchedOption = this.parseInputToOption(input);
    if (matchedOption !== undefined) {
      this.resolve(matchedOption);
      return true;
    }

    DesignCore.Core.notify(`${Strings.Error.INPUT}: ${this.promptMessage}`);
    return false;
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

    // can't match non-string values to options
    if (typeof input !== 'string') {
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
}
