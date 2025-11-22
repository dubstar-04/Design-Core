

/** Design Core
   *
   * This class is a facade to core.js
   * it provides static accessors to instantiated core
   * classes without the need for every class to be a singleton
   *
   ***** Usage *****

   import {Core} from "core.js";
   import {DesignCore} from "designCore.js";

   // Core must be instanciated and activated before use:
   const core = new Core()
   core.activate()

   // Static access to core instance
   DesignCore.Core

   // Static access to mouse
   DesignCore.Mouse

   ***** End Usage *****/

/**
 * Design Core Class
 */
export class DesignCore {
  static _core;
  /** Create a Design Core */
  constructor() {
    const msg = 'DesignCore is a static class and cannot be instantiated';
    const err = (`${this.type} - ${msg}`);
    throw Error(err);
  }

  /**
   * Set the Core Instance
   * @param {Object} core
   */
  static set Core(core) {
    this._core = core;
  }

  /**
   * Get the Core Instance
   */
  static get Core() {
    if (!this._core) {
      throw Error('DesignCore: core not instantiated');
    }

    return this._core;
  }

  /**
   * Get the Scene
   */
  static get Scene() {
    return DesignCore.Core.scene;
  }

  /**
   * Get the Clipboard
   */
  static get Clipboard() {
    return DesignCore.Core.clipboard;
  }

  /**
   * Get the CommandManager
   */
  static get CommandManager() {
    return DesignCore.Core.commandManager;
  }

  /**
   * Get the Canvas
   */
  static get Canvas() {
    return DesignCore.Core.canvas;
  }

  /**
   * Get the Mouse
   */
  static get Mouse() {
    return DesignCore.Core.mouse;
  }

  /**
   * Get the CommandLine
   */
  static get CommandLine() {
    return DesignCore.Core.commandLine;
  }

  /**
   * Get the LayerManager
   */
  static get LayerManager() {
    return DesignCore.Core.layerManager;
  }

  /**
   * Get the LineTypeManager
   */
  static get LTypeManager() {
    return DesignCore.Core.ltypeManager;
  }

  /**
   * Get the StyleManager
   */
  static get StyleManager() {
    return DesignCore.Core.styleManager;
  }

  /**
   * Get the DimStyleManager
   */
  static get DimStyleManager() {
    return DesignCore.Core.dimStyleManager;
  }

  /**
   * Get the property manager
   */
  static get PropertyManager() {
    return DesignCore.Core.propertyManager;
  }

  /**
   * Get the property manager
   */
  static get Settings() {
    return DesignCore.Core.settings;
  }
}
