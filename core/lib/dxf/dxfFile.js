export class DXFFile {
  constructor() {
    this.contents = '';
    this.version = DXFFile.Version.R12;
  }

  static Version = {
    R2010: 'AC1024',
    R2007: 'AC1021',
    R2004: 'AC1018',
    R2000: 'AC1015',
    R12: 'AC1009',
  };

  clearFile() {
    this.contents = '';
  }

  writeGroupCode(groupCode, groupValue, version=DXFFile.Version.R12) {
    // return if the groupcode is required for a later version
    if (version > this.version) {
      return;
    }

    this.writeLine(groupCode);
    this.writeLine(groupValue);
  }

  writeLine(value) {
    this.contents = this.contents.concat(`${value}\n`);
  }
}
