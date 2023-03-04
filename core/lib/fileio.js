import {DXF} from './dxf/dxf.js';
import {Strings} from './strings.js';

export class FileIO {
  static saveDxf(core) {
    const dxfWriter = new DXF();
    const data = dxfWriter.write(core);
    return data;
  }

  static openFile(core, data) {
    try {
      const dxfReader = new DXF();
      dxfReader.read(core, data);
      core.scene.linkBlockData();
      core.layerManager.checkLayers();
      core.canvas.requestPaint();
      core.notify(Strings.Message.FILEOPEN);
    } catch (error) {
      core.notify(Strings.Error.FILEOPEN);
    }
  }
}
