import {DXFReader} from './dxfRead.js';
import {DXFWriter} from './dxfWrite.js';

export class DXF {
  constructor() {
  }

  read(core, data) {
    const reader = new DXFReader();
    reader.read(core, data);
  }

  write(core) {
    const writer = new DXFWriter();
    const data = writer.write(core);
    return data;
  }
}
