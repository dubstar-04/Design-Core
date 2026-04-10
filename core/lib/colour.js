import { Colours } from './colours.js';

/**
 * Colour base class
 * used by layers
 */
export class Colour {
  /**
   * Create Colour
   * @param {number} aci
   */
  constructor(aci = 7) {
    this.aci = aci;
    this.rgb = Colours.aciToRGB(this.aci);
  }

  /**
   * Determine is colour uses dxf true colours
   */
  get isTrueColour() {
    const aci = Colours.rgbToACI(this.rgb);
    if (aci != undefined) {
      return false;
    }
    return true;
  }

  /**
   * Get the colour
   * @return {number}
   */
  getColour() {
    return this.rgb;
  }

  /**
   * Set the colour
   * @param {any} colour
   */
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
   * @param {number} aci
   */
  setColourFromACI(aci) {
    // try and get the rgb from the aci
    const rgb = Colours.aciToRGB(aci);
    if (rgb) {
      this.aci = aci;
      this.rgb = rgb;
    }
  }

  /**
   * Blend two RGB colours together.
   * @param {{r:number,g:number,b:number}} colourA
   * @param {{r:number,g:number,b:number}} colourB
   * @param {number} factor - 0 returns colourA, 1 returns colourB
   * @return {{r:number,g:number,b:number}}
   */
  static blend(colourA, colourB, factor) {
    const inverseFactor = 1 - factor;
    return {
      r: Math.round(colourA.r * inverseFactor + colourB.r * factor),
      g: Math.round(colourA.g * inverseFactor + colourB.g * factor),
      b: Math.round(colourA.b * inverseFactor + colourB.b * factor),
    };
  }
}

/**
   * Entity Colour class
   * used by entities
   * BYBLOCK aci = 0
   * BYLAYER aci = 256
   */
export class EntityColour extends Colour {
  /**
   * Create an EntityColour
   * @param {number} aci
   */
  constructor(aci = 256) {
    super(aci);
    // default to aci 256 - ByLayer
  }

  /**
   * Determine if colour byLayer
   * @return {boolean}
   */
  get byLayer() {
    if (this.aci === 256) {
      return true;
    }

    return false;
  }

  /**
   * Set if colour byLayer
   * @param {boolean} bool
   */
  set byLayer(bool) {
    if (bool) {
      this.aci = 256;
    }
  }

  /**
   * Determine if colour byBlock
   * @return {boolean}
   */
  get byBlock() {
    if (this.aci === 0) {
      return true;
    }

    return false;
  }

  /**
   * Set if colour byBlock
   * @param {boolean} bool
   */
  set byBlock(bool) {
    if (bool) {
      this.aci = 0;
    }
  }

  /**
   * Set the colour
   * @param {any} colour
   */
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
