import {DXF} from './dxf.js';

export class FileIO {
  static saveDxf(core) {
    const dxfWriter = new DXF();
    const data = dxfWriter.writeDXF(core);
    return data;
  }

  static openFile(core, data) {
    try {
      const dxfReader = new DXF();
      dxfReader.readDxf(core, data);
      core.scene.linkBlockData();
      core.layerManager.checkLayers();
      core.canvas.requestPaint();
      core.notify('File Opened');
    } catch (error) {
      core.notify('Error Opening File');
    }
  }
}
