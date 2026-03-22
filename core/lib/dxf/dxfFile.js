import { Logging } from '../logging.js';
import { Strings } from '../strings.js';

/** DXF File Class */
export class DXFFile {
  /**
   * Create DXFFile
   * @param {string} version
   */
  constructor(version = 'R2018') {
    this.contents = '';

    // Validate version
    if (DXFFile.Version.hasOwnProperty(version) === false) {
      throw Error('Invalid Version');
    }

    this.version = DXFFile.Version[version];
  }

  /**
   * Check if a dxf version is valid - 'AC1009' = valid, R12 = not valid
   * @param {string} version
   * @return {boolean} - true if version is valid
   */
  static validDxfVersion(version) {
    if (Object.values(DXFFile.Version).indexOf(version) === -1) {
      return false;
    }
    return true;
  }


  /**
   * Check if a dxf key is valid - R12 = valid, 'AC1009' = not valid
   * @param {string} key
   * @return {boolean} - true if version is valid
   */
  static validDxfKey(key) {
    if (Object.keys(DXFFile.Version).indexOf(key) === -1) {
      return false;
    }
    return true;
  }

  /**
   * Return the dxf key for the dxf version e.g key = R12 version = 'AC1009'
   * @param {string} dxfVersion
   * @return {string} dxf key (R Number) for valid dxf versions
   */
  static getVersionKey(dxfVersion) {
    if (DXFFile.validDxfVersion(dxfVersion)) {
      const key = Object.keys(DXFFile.Version).find((key) => DXFFile.Version[key] === dxfVersion);
      if (DXFFile.validDxfKey(key)) {
        return key;
      }
    }

    // dxfVersion is invalid or unsupported
    Logging.instance.error(` ${Strings.Error.INVALIDDXFFORMAT} - ${dxfVersion}`);
    throw Error(Strings.Error.INVALIDDXFFORMAT);
  }

  /**
   * Static enum of version numbers
   */
  static Version = {
    R2018: 'AC1032',
    R2013: 'AC1027',
    R2010: 'AC1024',
    R2007: 'AC1021',
    R2004: 'AC1018',
    R2000: 'AC1015',
    R14: 'AC1014',
    R13: 'AC1012',
    R12: 'AC1009',
  };

  /**
   * Reset the file
   */
  clearFile() {
    this.contents = '';
  }

  /**
   * Write the group code and value to file
   * @param {string} groupCode
   * @param {string} groupValue
   * @param {string} version - DXFFile.Version
   */
  writeGroupCode(groupCode, groupValue, version = DXFFile.Version.R12) {
    // return if the groupcode is required for a later version
    if (version > this.version) {
      return;
    }

    if (groupValue === undefined) {
      const err = `Invalid groupvalue for dxf groupcode ${groupCode}`;
      Logging.instance.error(`${this.type} - ${err}`);
      throw Error(Strings.Error.INVALIDDXFFORMAT);
    }

    this.writeLine(groupCode);
    this.writeLine(groupValue);
  }

  /**
   * Write a new line to the contents
   * @param {string} value
   */
  writeLine(value) {
    this.contents = this.contents.concat(`${value}\n`);
  }
}
