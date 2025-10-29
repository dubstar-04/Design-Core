import {DXF} from './dxf/dxf.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';

import {DesignCore} from '../designCore.js';

/** FileIO Class */
export class FileIO {
  /**
   * Save to DXF
   * @param {string} version
   * @return {string} dxf file as a string
   */
  static saveDxf(version) {
    const dxfWriter = new DXF();
    const data = dxfWriter.write(version);
    return data;
  }

  /**
   * Open data as a dxf file
   * @param {string} data
   */
  static openFile(data) {
    const dxf = new DXF();
    try {
      dxf.loadDxf(data);
      // Mark scene as saved since we just loaded it
      DesignCore.Scene.markSaved();
      DesignCore.Canvas.requestPaint();
      DesignCore.Core.notify(Strings.Message.FILEOPEN);
    } catch (error) {
      DesignCore.Core.notify(error.toString());
      Logging.instance.debug(error.stack);
    }
  }
}
