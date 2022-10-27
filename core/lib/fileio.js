import {DXF} from './dxf.js';

export class FileIO {
  static saveDxf(core) {
    const data = DXF.writeDXF(core);
    return data;
  }

  static openFile(core, data) {
    DXF.readDxf(core, data);
    core.scene.linkBlockData();
    core.layerManager.checkLayers();
    core.canvas.requestPaint();
    // notify("File Opened")
  }
}
