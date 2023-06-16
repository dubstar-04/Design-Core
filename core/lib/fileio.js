import {DXF} from './dxf/dxf.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';

export class FileIO {
  static saveDxf(core, version) {
    const dxfWriter = new DXF();
    const data = dxfWriter.write(core, version);
    return data;
  }

  static openFile(core, data) {
    const dxf = new DXF();
    try {
      dxf.loadDxf(core, data);
      core.canvas.requestPaint();
      core.notify(Strings.Message.FILEOPEN);
    } catch (error) {
      core.notify(error.toString());
      Logging.instance.debug(error.stack);
    }
  }
}
