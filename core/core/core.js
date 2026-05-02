import { Scene } from '../lib/scene.js';
import { CommandManager } from '../lib/commandManager.js';
import { Mouse } from '../lib/mouse.js';
import { Canvas } from '../lib/canvas.js';
import { CommandLine } from '../lib/commandLine.js';
import { LayerManager } from '../tables/layerManager.js';
import { LTypeManager } from '../tables/ltypeManager.js';
import { StyleManager } from '../tables/styleManager.js';
import { DimStyleManager } from '../tables/dimStyleManager.js';
import { ViewManager } from '../tables/viewManager.js';
import { VPortManager } from '../tables/vportManager.js';
import { UCSManager } from '../tables/ucsManager.js';
import { AppIDManager } from '../tables/appIdManager.js';
import { BlockRecordManager } from '../tables/blockRecordManager.js';
import { DictionaryManager } from '../objects/dictionaryManager.js';
import { PropertyManager } from '../properties/propertyManager.js';
import { Clipboard } from '../lib/clipboard.js';

import { FileIO } from '../lib/fileio.js';
import { Settings } from '../lib/settings.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { HandleManager } from '../lib/dxf/handleManager.js';
import { Logging } from '../lib/logging.js';

import { DesignCore } from '../designCore.js';

/** Class representing design core. This is the primary entry point */
export class Core {
  /** Create a core object */
  constructor() {
    // Create handle manager and activate to enable handle assignment during construction
    this.handleManager = new HandleManager();
    this.activate();

    // Create core components
    this.scene = new Scene();
    this.commandManager = new CommandManager();
    this.canvas = new Canvas();
    this.mouse = new Mouse();
    this.commandLine = new CommandLine();

    // Create table managers
    this.ltypeManager = new LTypeManager();
    this.layerManager = new LayerManager();
    this.styleManager = new StyleManager();
    this.dimStyleManager = new DimStyleManager();
    this.viewManager = new ViewManager();
    this.vportManager = new VPortManager();
    this.ucsManager = new UCSManager();
    this.appIdManager = new AppIDManager();
    this.blockRecordManager = new BlockRecordManager();

    // Create dictionary manager and property manager
    this.dictionaryManager = new DictionaryManager();
    this.propertyManager = new PropertyManager();
    // Create clipboard manager
    this.clipboard = new Clipboard();
    // Create settings manager
    this.settings = new Settings();

    // function to call external notification command for the ui
    this.externalNotifyCallbackFunction;
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
    return this.scene.headers.dxfVersion;
  }

  /**
   * Set the current dxf version
   * @param {string} version
   */
  set dxfVersion(version) {
    this.scene.headers.dxfVersion = version;
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
   * @param  {string} message
   */
  notify(message) {
    if (this.externalNotifyCallbackFunction) {
      this.externalNotifyCallbackFunction(message);
      Logging.instance.debug(message);
    }
  }


  /**
   * Open the dxf file represented by the file parameter
   * @param  {string} file
   */
  openFile(file) {
    FileIO.openFile(file);
  }


  /**
   * Save the current scene to a dxf string
   * @param {string} version
   * @return {string} The dxf file as a string.
   */
  saveFile(version) {
    return FileIO.saveDxf(version);
  }

  /**
   * Return the supported dxf versions
   * @return {string} array js object containing the version
   */
  supportedDXFVersions() {
    return DXFFile.Version;
  }
}
