export class Settings {
  /**
   * Settings Constructor
   */
  constructor(core) {
    this.core = core;
    this.canvasbackgroundcolour = '#1e1e1e'; // "#000000";
    this.selecteditemscolour = '#00FF00';
    this.snapcolour = '#FF0000';
    this.gridcolour = '#77767b';
    this.helpergeometrycolour = '#00BFFF';
    this.polarsnapcolour = '#38B44A';
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
   * @param {string} setting
   * @param {any} value
   */
  setSetting(setting, value) {
    // TODO: Check setting is valid
    this[setting] = value;
    this.core.canvas.requestPaint();
  }

  /**
   * Returns the value of the setting
   * @param {string} setting
   * @returns
   */
  getSetting(setting) {
    // TODO: Validate setting exists
    return this[setting];
  }
}
