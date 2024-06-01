/** Logging Class */
export class Logging {
  static _instance;
  /** Create Logger */
  constructor() {
    this.logLevel = ['OFF', 'ERROR', 'WARN', 'DEBUG', 'TRACE'];
    this.level = 'DEBUG';

    // instantiate as a singleton
    if (Logging._instance === undefined) {
      Logging._instance = this;
    }

    return Logging._instance;
  }

  /** Get instance of logger */
  static get instance() {
    if (this._instance === undefined) {
      this._instance = new this();
    }

    return this._instance;
  }

  /**
   * Set logging level
   * @param {Number} level
   */
  setLevel(level) {
    if (this.logLevel.includes(level)) {
      this.level = level;
    } else {
      throw Error('unknown log level');
    }
  }

  /**
   * Get the logging level
   */
  get levelValue() {
    return this.logLevel.indexOf(this.level);
  }

  /**
   * Print debug message
   * @param {String} msg
   */
  debug(msg) {
    if (this.levelValue >= 3) {
      console.log(`Debug: ${msg}`);
      this.trace();
    }
  }

  /**
   * Print warning message
   * @param {String} msg
   */
  warn(msg) {
    if (this.levelValue >= 2) {
      console.log(`Warning: ${msg}`);
      this.trace();
    }
  }

  /**
   * Print error message
   * @param {String} msg
   */
  error(msg) {
    if (this.levelValue >= 1) {
      console.log(`Error: ${msg}`);
      this.trace();
    }
  }

  /**
   * Print trace
   */
  trace() {
    if (this.levelValue >= 4) {
      console.trace();
    }
  }
}
