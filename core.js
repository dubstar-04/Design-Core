import { Scene } from './lib/scene.js'
import { CommandManager } from './lib/commandManager.js'
import { DesignEngine } from './lib/designEngine.js'
import { Mouse } from './lib/mouse.js'
import { Canvas } from './lib/canvas.js'
import { CommandLine } from './lib/commandLine.js'
import { LayerManager } from './layers/layerManager.js'
import { StyleManager } from './styles/styleManager.js'
import { DimStyleManager } from './styles/dimStyleManager.js'

import { FileIO } from './lib/fileio.js'
import { Settings } from './lib/settings.js'

//TODO: Add debugging class
//TODO: use inheritance for the tools & entities 
//TODO: Use better error checking: consider using try and throw

export class Core {
    constructor() {
        this.scene = new Scene(this);
        this.commandManager = new CommandManager(this);
        this.canvas = new Canvas(this);
        this.designEngine = new DesignEngine(this);

        this.mouse = new Mouse(this);
        this.commandLine = new CommandLine(this);

        this.LM = new LayerManager(this);
        this.SM = new StyleManager(this);
        this.DSM = new DimStyleManager(this);

        this.settings = new Settings();
    }


    openFile(file) {
        FileIO.openFile(this, file)
    }

    saveFile() {
        return FileIO.saveDxf(this);
    }

}