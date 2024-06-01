import {Colours} from './colours.js';

/**
 * Colour base class
 * used by layers
 */
export class Colour {
  constructor(aci=7) {
    this.aci = aci;
    this.rgb = Colours.aciToRGB(this.aci);
  }

  get isTrueColour() {
    const aci = Colours.rgbToACI(this.rgb);
    if (aci != undefined) {
      return false;
    }
    return true;
  }

  getColour() {
    return this.rgb;
  }

  setColour(colour) {
    if (Colours.isRGB(colour)) {
      this.rgb = colour;
      const aci = Colours.rgbToACI(colour);
      if (aci !== undefined) {
        this.aci = aci;
      } else {
        // fall back to aci 7 when non aci colours are selected
        // e.g. when using truecolour
        this.aci = 7;
      }
    }
  }

  /**
   * Set rgb colour based on autocad colour index
   * @param {Number} aci
   */
  setColourFromACI(aci) {
    // try and get the rgb from the aci
    const rgb = Colours.aciToRGB(aci);
    if (rgb) {
      this.aci = aci;
      this.rgb = rgb;
    }
  }
}

/**
   * Entity Colour class
   * used by entities
   * BYBLOCK aci = 0
   * BYLAYER aci = 256
   */
export class EntityColour extends Colour {
  constructor(aci=256) {
    super(aci);
    // default to aci 256 - ByLayer
  }

  get byLayer() {
    if (this.aci === 256) {
      return true;
    }

    return false;
  }

  set byLayer(bool) {
    if (bool) {
      this.aci = 256;
    }
  }

  get byBlock() {
    if (this.aci === 0) {
      return true;
    }

    return false;
  }

  set byBlock(bool) {
    if (bool) {
      this.aci = 0;
    }
  }

  setColour(colour) {
    if (typeof colour === 'string' || colour instanceof String) {
      if (colour.toUpperCase() === 'BYLAYER') {
        this.byLayer = true;
      } else if (colour.toUpperCase() === 'BYBLOCK') {
        this.byBlock = true;
      }
    } else if (Colours.isRGB(colour)) {
      // set the colour on the base class
      super.setColour(colour);
    }
  }
}
