import { Flags } from './flags.js';

/** Property Class */
export class Property {
  /** Create property */
  constructor() { }

  /**
   * Property type constants
   * Used to describe the type of a property value for UI rendering and validation.
   * - NUMBER: numeric value (integer or float)
   * - STRING: text value
   * - BOOLEAN: true/false toggle
   * - LIST: selection from a named set (layer, lineType, hatch pattern, etc.)
   * - COLOUR: RGB colour object
   * - LABEL: read-only display value (no editing)
   */
  static Type = {
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    BOOLEAN: 'BOOLEAN',
    LIST: 'LIST',
    COLOUR: 'COLOUR',
    LABEL: 'LABEL',
  };

  /**
   * Canonical property name constants.
   * Use these instead of raw strings when calling getProperty() / setProperty().
   */
  static Names = Object.freeze({
    // ── Base entity (Entity class) ────────────────────────────────────────────
    HANDLE: 'handle',
    LAYER: 'layer',
    LINETYPE: 'lineType',
    LINEWIDTH: 'lineWidth',
    COLOUR: 'colour',
    // ── Shared (multiple entities) ────────────────────────────────────────────
    ANGLE: 'angle',
    BLOCKNAME: 'blockName',
    DIRECTION: 'direction',
    HEIGHT: 'height',
    RADIUS: 'radius',
    ROTATION: 'rotation',
    SCALE: 'scale',
    STRING: 'string',
    STYLENAME: 'styleName',
    // ── BasePolyline ──────────────────────────────────────────────────────────
    CLOSED: 'closed',
    // ── Hatch ─────────────────────────────────────────────────────────────────
    CHILDENTITIES: 'childEntities',
    PATTERNNAME: 'patternName',
    // ── Text ──────────────────────────────────────────────────────────────────
    BACKWARDS: 'backwards',
    HORIZONTALALIGNMENT: 'horizontalAlignment',
    UPSIDEDOWN: 'upsideDown',
    VERTICALALIGNMENT: 'verticalAlignment',
    // ── ArcAlignedText ────────────────────────────────────────────────────────
    ARCSIDE: 'arcSide',
    BOLD: 'bold',
    CHARACTERSPACING: 'characterSpacing',
    FONTNAME: 'fontName',
    ITALIC: 'italic',
    OFFSETFROMARC: 'offsetFromArc',
    OFFSETFROMLEFT: 'offsetFromLeft',
    OFFSETFROMRIGHT: 'offsetFromRight',
    TEXTALIGNMENT: 'textAlignment',
    TEXTORIENTATION: 'textOrientation',
    TEXTREVERSED: 'textReversed',
    UNDERLINE: 'underline',
    WIDTHFACTOR: 'widthFactor',
    // ── Dimensions ────────────────────────────────────────────────────────────
    DIMENSIONSTYLE: 'dimensionStyle',
    LEADERLENGTH: 'leaderLength',
    LINEARDIMANGLE: 'linearDimAngle',
    TEXTOVERRIDE: 'textOverride',
  });

  /**
   * Parse the input values and return a value
   * @param {Array} values - list of values
   * @param {any} def - default value
   * @return {any}
   */
  static loadValue(values, def) {
    // return any value in values
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== undefined) {
        // check if the value is a flags object
        return (values[i] instanceof Flags) ? values[i].getFlagValue() : values[i];
      }
    };

    // no valid values, return the default value
    return def;
  }
}
