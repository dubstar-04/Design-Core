import {DXF} from './dxf/dxf.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';

import {Core} from '../core.js';

export class FileIO {
  static saveDxf(version) {
    const dxfWriter = new DXF();
    const data = dxfWriter.write(version);
    return data;
  }

  static openFile(data) {
    const dxf = new DXF();
    try {
      dxf.loadDxf(data);
      Core.Canvas.requestPaint();
      Core.instance.notify(Strings.Message.FILEOPEN);
    } catch (error) {
      Core.instance.notify(error.toString());
      Logging.instance.debug(error.stack);
    }
  }
}
