export class Logging {
  static _instance;

  constructor() {
    this.logLevel = ['OFF', 'ERROR', 'WARN', 'DEBUG'];
    this.level = 'ERROR';

    // instantiate as a singleton
    if (Logging._instance === undefined) {
      Logging._instance = this;
    }

    return Logging._instance;
  }

  static get instance() {
    if (this._instance === undefined) {
      this._instance = new this();
    }

    return this._instance;
  }

  setLevel(level) {
    if (this.logLevel.includes(level)) {
      this.level = level;
    } else {
      throw Error('unknown log level');
    }
  }

  get levelValue() {
    return this.logLevel.indexOf(this.level);
  }

  debug(msg) {
    if (this.levelValue >= 3) {
      console.log(`Debug: ${msg}`);
    }
  }

  warn(msg) {
    if (this.levelValue >= 2) {
      console.log(`Warning: ${msg}`);
    }
  }

  error(msg) {
    if (this.levelValue >= 1) {
      console.log(`Error: ${msg}`);
    }
  }
}
