// mock file for dxf test
export class File {
  constructor() {
    this.contents = '';
  }

  nextHandle() {
    return 1;
  }

  writeGroupCode(groupCode, groupValue) {
    this.contents = this.contents.concat(`${groupCode}\n${groupValue}\n`);
  }
}

