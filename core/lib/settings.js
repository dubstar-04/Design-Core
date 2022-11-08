export class Settings {
  /**
   * Settings Constructor
   */
  constructor() {
    this.canvasBackgroundColour = '#1e1e1e'; // "#000000";
    this.selectedItemsColour = '#00FF00';
    this.snapColour = '#FF0000';
    this.gridColour = '#77767b';
    this.helperGeometryColour = '#00BFFF';
    this.polarSnapColour = '#38B44A';
    // fontSettings
    this.font = 'Arial';
    this.fontupsidedown = false;
    this.fontbackwards = false;
    // snapSettings
    this.endSnap = true;
    this.midSnap = true;
    this.centreSnap = true;
    this.nearestSnap = false;
    this.quadrantSnap = false;
    this.polarAngle = 45;
    this.polar = true;
    this.ortho = false;
    this.drawGrid = true;
  }

  /**
   * Sets the value of the setting
   * @param {string} setting
   * @param {any} value
   */
  setSetting(setting, value) {
    this[setting] = value;
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
