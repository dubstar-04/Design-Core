import {DXF} from './dxf/dxf.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';

import {DesignCore} from '../designCore.js';

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
      DesignCore.Canvas.requestPaint();
      DesignCore.Core.notify(Strings.Message.FILEOPEN);
    } catch (error) {
      DesignCore.Core.notify(error.toString());
      Logging.instance.debug(error.stack);
    }
  }
}
