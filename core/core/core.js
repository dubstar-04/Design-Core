import {Scene} from '../lib/scene.js';
import {CommandManager} from '../lib/commandManager.js';
import {Mouse} from '../lib/mouse.js';
import {Canvas} from '../lib/canvas.js';
import {CommandLine} from '../lib/commandLine.js';
import {LayerManager} from '../tables/layerManager.js';
import {LTypeManager} from '../tables/ltypeManager.js';
import {StyleManager} from '../tables/styleManager.js';
import {DimStyleManager} from '../tables/dimStyleManager.js';
import {PropertyManager} from '../properties/propertyManager.js';

import {FileIO} from '../lib/fileio.js';
import {Settings} from '../lib/settings.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

/** Class representing design core. This is the primary entry point */
export class Core {
  /** Create a core object */
  constructor() {
    this.scene = new Scene();
    this.commandManager = new CommandManager();
    this.canvas = new Canvas();

    this.mouse = new Mouse();
    this.commandLine = new CommandLine();

    this.layerManager = new LayerManager();
    this.ltypeManager = new LTypeManager();
    this.styleManager = new StyleManager();
    this.dimStyleManager = new DimStyleManager();
    this.propertyManager = new PropertyManager();

    this.settings = new Settings();

    // function to call external notification command for the ui
    this.externalNotifyCallbackFunction;

    // create a static reference to the instantiated core object
    // DesignCore._instance = this;
    // Design.Core = this;

    // return Design;
    this.activate();
  }

  /**
   * Activate the current context
   * Required to set the _instance to the current context
   * The instance is accessed via static methods
   */
  activate() {
    // TODO: is there a better way to track the context / instance
    DesignCore.Core = this;
  }
  /**
   * Get the current dxf version
   */
  get dxfVersion() {
    return this.scene.dxfVersion;
  }

  /**
   * Set the current dxf version
   * @param {String} version
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
   * @param  {Object} callback
   */
  setExternalNotifyCallbackFunction(callback) {
    // set the callback
    this.externalNotifyCallbackFunction = callback;
  }

  /**
   * Call the external notification callback
   * @param  {String} message
   */
  notify(message) {
    if (this.externalNotifyCallbackFunction) {
      this.externalNotifyCallbackFunction(message);
      Logging.instance.debug(message);
    }
  }


  /**
   * Open the dxf file represented by the file parameter
   * @param  {String} file
   */
  openFile(file) {
    FileIO.openFile(file);
  }


  /**
   * Save the current scene to a dxf string
   * @param {String} version
   * @return {String} The dxf file as a string.
   */
  saveFile(version) {
    return FileIO.saveDxf(version);
  }

  /**
   * Return the supported dxf versions
   * @return {String} array js object containing the version
   */
  supportedDXFVersions() {
    return DXFFile.Version;
  }
}
