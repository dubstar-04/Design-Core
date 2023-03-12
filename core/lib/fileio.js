import {DXF} from './dxf/dxf.js';
import {Strings} from './strings.js';

export class FileIO {
  static saveDxf(core) {
    const dxfWriter = new DXF();
    const data = dxfWriter.write(core);
    return data;
  }

  static openFile(core, data) {
    const dxf = new DXF();
    // TODO: Handle errors
    dxf.loadDxf(core, data);
    core.canvas.requestPaint();
    core.notify(Strings.Message.FILEOPEN);
  }
}
