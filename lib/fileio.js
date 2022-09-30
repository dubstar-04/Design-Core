import { DXF } from './dxf.js'

export class FileIO {

    static saveDxf(core) {

        var data = DXF.writeDXF(core);
        return data;

    }

    static openFile(core, data) {

        DXF.readDxf(core, data);
        core.scene.LinkBlockData();
        core.LM.checkLayers();
        core.canvas.requestPaint();
        notify("File Opened")
    }
}