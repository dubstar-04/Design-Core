import {Scene} from './lib/scene.js';
import {CommandManager} from './lib/commandManager.js';
import {Mouse} from './lib/mouse.js';
import {Canvas} from './lib/canvas.js';
import {CommandLine} from './lib/commandLine.js';
import {LayerManager} from './layers/layerManager.js';
import {LTypeManager} from './styles/ltypeManager.js';
import {StyleManager} from './styles/styleManager.js';
import {DimStyleManager} from './styles/dimStyleManager.js';
import {PropertyManager} from './properties/propertyManager.js';

import {FileIO} from './lib/fileio.js';
import {Settings} from './lib/settings.js';
import {DXFFile} from './lib/dxf/dxfFile.js';

/** Class representing design core. This is the primary entry point */
export class Core {
  /** Create a core object */
  constructor() {
    this.scene = new Scene(this);
    this.commandManager = new CommandManager(this);
    this.canvas = new Canvas(this);

    this.mouse = new Mouse(this);
    this.commandLine = new CommandLine(this);

    this.layerManager = new LayerManager(this);
    this.ltypeManager = new LTypeManager(this);
    this.styleManager = new StyleManager(this);
    this.dimStyleManager = new DimStyleManager(this);
    this.propertyManager = new PropertyManager(this);

    this.settings = new Settings(this);

    // function to call external notification command for the ui
    this.externalNotifyCallbackFunction;
  }

  /**
   * Get the current dxf version
   */
  get dxfVersion() {
    return this.scene.dxfVersion;
  }

  /**
   * Set the current dxf version
   */
  set dxfVersion(version) {
    // version should be the RXXXX format for the dxf version

    // Check if we have the ACXXXX value
    if (DXFFile.validDxfVersion(version)) {
      // convert the ACXXXX value to the key RXXXX value
      version = DXFFile.getVersionKey(version);
    }

    // Check if we have the RXXXX value
    if (DXFFile.validDxfKey(version)) {
      this.scene.dxfVersion = version;
    }
  }

  /**
   * Set the external notification callback
   * @param  {object} function
   */
  setExternalNotifyCallbackFunction(callback) {
    // set the callback
    this.externalNotifyCallbackFunction = callback;
  }

  /**
   * Call the external notification callback
   * @param  {string} message
   */
  notify(message) {
    if (this.externalNotifyCallbackFunction) {
      this.externalNotifyCallbackFunction(message);
    }
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
  saveFile(version) {
    return FileIO.saveDxf(this, version);
  }

  /**
   * Return the supported dxf versions
   * @returns array js object containing the version
   */
  supportedDXFVersions() {
    return DXFFile.Version;
  }
}
