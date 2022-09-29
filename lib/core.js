import { Scene } from './scene.js'
import { CommandManager } from './commandManager.js'
import { DesignEngine } from './designEngine.js'
import { Mouse } from './mouse.js'
import { Canvas } from './canvas.js'
import { CommandLine } from './commandLine.js'
import { LayerManager } from './layerManager.js'
import { StyleManager } from './styleManager.js'
import { DimStyleManager } from './dimStyleManager.js'

//TODO: Add debugging class
//TODO: use inheritance for the tools & entities 
//TODO: Use better error checking: consider using try and throw

export class Core { 
    constructor(){
    this.scene = new Scene(this);
    this.commandManager = new CommandManager(this);
    this.canvas = new Canvas(this);
    this.designEngine = new DesignEngine(this);

    this.mouse = new Mouse(this);
    this.commandLine = new CommandLine(cmd_Line, this);

    this.LM = new LayerManager(this);
    this.SM = new StyleManager(this);
    this.DSM = new DimStyleManager(this);
    }
}