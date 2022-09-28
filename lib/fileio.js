import { DXF } from './dxf.js'

export class FileIO { 

static saveDxf(scene) {

    var data = DXF.writeDXF(scene);
    return data;

}

static openFile(scene, data) {

    DXF.readDxf(scene, data);
    scene.sceneLinkBlockData();
    LM.checkLayers();
    scene.designEngine.canvas.requestPaint();
    notify("File Opened")
}
}