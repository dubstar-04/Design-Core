export class DXFFile {
  constructor() {
    this.contents = '';
    this.version = DXFFile.Version.R12;
    this.handleCounter = 10;
  }

  /**
   * Static enum of version numbers
   */
  static Version = {
    R2010: 'AC1024',
    R2007: 'AC1021',
    R2004: 'AC1018',
    R2000: 'AC1015',
    R12: 'AC1009',
  };

  /**
   * Reset the file
   */
  clearFile() {
    this.contents = '';
    this.handleCounter = 10;
  }

  /**
   * Write the group code and value to file
   * @param {String} groupCode
   * @param {String} groupValue
   * @param {String} version - DXFFile.Version
   * @returns
   */
  writeGroupCode(groupCode, groupValue, version=DXFFile.Version.R12) {
    // return if the groupcode is required for a later version
    if (version > this.version) {
      return;
    }

    this.writeLine(groupCode);
    this.writeLine(groupValue);
  }

  /**
   * Write a new line to the contents
   * @param {String} value
   */
  writeLine(value) {
    this.contents = this.contents.concat(`${value}\n`);
  }
}
