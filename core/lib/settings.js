import {DesignCore} from '../designCore.js';

export class Settings {
  /**
   * Settings Constructor
   */
  constructor() {
    this.canvasbackgroundcolour = {r: 30, g: 30, b: 30};
    this.selecteditemscolour = {r: 0, g: 255, b: 0};
    this.snapcolour = {r: 255, g: 0, b: 0};
    this.gridcolour = {r: 119, g: 118, b: 123};
    this.helpergeometrycolour = {r: 0, g: 195, b: 255};
    this.polarsnapcolour = {r: 55, g: 180, b: 75};
    this.selectionWindow = {r: 0, g: 255, b: 0};
    this.crossingWindow = {r: 0, g: 0, b: 255};
    // fontSettings
    this.font = 'Arial';
    this.fontupsidedown = false;
    this.fontbackwards = false;
    // snapSettings
    this.endsnap = true;
    this.midsnap = true;
    this.centresnap = true;
    this.nearestsnap = false;
    this.quadrantsnap = false;
    this.polarangle = 45;
    this.polar = true;
    this.ortho = false;
    this.drawgrid = true;
  }

  /**
   * Sets the value of the setting
   * @param {String} setting
   * @param {Any} value
   */
  setSetting(setting, value) {
    // TODO: Check setting is valid
    this[setting] = value;

    if (DesignCore.instance) {
      DesignCore.Canvas.requestPaint();
    }
  }

  /**
   * Returns the value of the setting
   * @param {String} setting
   * @returns
   */
  getSetting(setting) {
    // TODO: Validate setting exists
    return this[setting];
  }
}
