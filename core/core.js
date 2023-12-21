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

    // create a static reference to the instantiated core object
    Core._instance = this;
  }

  /** Static Accessors **/
  /**
   * Get the current core instance
   */
  static get instance() {
    if (!this._instance) {
      throw Error('Core not instantiated');
    }

    return this._instance;
  }

  /**
   * Get the Scene
   */
  static get Scene() {
    return this.instance.scene;
  }

  /**
   * Get the CommandManager
   */
  static get CommandManager() {
    return this.instance.commandManager;
  }

  /**
   * Get the Canvas
   */
  static get Canvas() {
    return this.instance.canvas;
  }

  /**
   * Get the Mouse
   */
  static get Mouse() {
    return this.instance.mouse;
  }

  /**
   * Get the CommandLine
   */
  static get CommandLine() {
    return this.instance.commandLine;
  }

  /**
   * Get the LayerManager
   */
  static get LayerManager() {
    return this.instance.layerManager;
  }

  /**
   * Get the LineTypeManager
   */
  static get LTypeManager() {
    return this.instance.lTypeManager;
  }

  /**
   * Get the StyleManager
   */
  static get StyleManager() {
    return this.instance.styleManager;
  }

  /**
   * Get the DimStyleManager
   */
  static get DimStyleManager() {
    return this.instance.dimStyleManager;
  }

  /**
   * Get the property manager
   */
  static get PropertyManager() {
    return this.instance.propertyManager;
  }

  /**
   * Get the property manager
   */
  static get Settings() {
    return this.instance.settings;
  }

  /** End of Static Accessors **/


  /**
   * Activate the current context
   * Required to set the _instance to the current context
   * The instance is accessed via static methods
   */
  activate() {
    // TODO: is there a better way to track the context / instance
    Core._instance = this;
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
