import {Scene} from './lib/scene.js';
import {CommandManager} from './lib/commandManager.js';
import {DesignEngine} from './lib/designEngine.js';
import {Mouse} from './lib/mouse.js';
import {Canvas} from './lib/canvas.js';
import {CommandLine} from './lib/commandLine.js';
import {LayerManager} from './layers/layerManager.js';
import {StyleManager} from './styles/styleManager.js';
import {DimStyleManager} from './styles/dimStyleManager.js';
import {PropertyManager} from './properties/propertyManager.js';

import {FileIO} from './lib/fileio.js';
import {Settings} from './lib/settings.js';

// TODO: Add debugging / logging class
// TODO: use inheritance for the tools & entities
// TODO: Use better error checking: consider using try and throw

/** Class representing design core. This is the primary entry point */
export class Core {
  /** Create a core object */
  constructor() {
    this.scene = new Scene(this);
    this.commandManager = new CommandManager(this);
    this.canvas = new Canvas(this);
    this.designEngine = new DesignEngine(this);

    this.mouse = new Mouse(this);
    this.commandLine = new CommandLine(this);

    this.layerManager = new LayerManager(this);
    this.styleManager = new StyleManager(this);
    this.dimStyleManager = new DimStyleManager(this);
    this.propertyManager = new PropertyManager(this);

    this.settings = new Settings();
  }


  /**
   * Open the dxf file represented by the file parameter
   * @param  {string} file
   */
  openFile(file) {
    FileIO.openFile(this, file);
  }


  /**
   * Save the current scene to a dxf string
   * @return {string} The dxf file as a string.
   */
  saveFile() {
    return FileIO.saveDxf(this);
  }
}
