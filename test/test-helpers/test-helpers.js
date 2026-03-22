
/**
 *  Mock File class for testing
 */
export class File {
  /**
   * Mock File class constructor
   */
  constructor() {
    this.contents = '';
  }

  /**
   * Mock function to write group code and value
   * @param {number} groupCode
   * @param {any} groupValue
   */
  writeGroupCode(groupCode, groupValue) {
    this.contents = this.contents.concat(`${groupCode}\n${groupValue}\n`);
  }
}

