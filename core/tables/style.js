import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Flags } from '../properties/flags.js';
import { Property } from '../properties/property.js';

/** Style Class */
export class Style {
  /**
   * Create Style
   * @param {Object} data
   */
  constructor(data) {
    // Define Properties
    this.type = this.constructor.name;
    this.name = '';
    this.font = 'Arial'; // TODO: how to set the font to one thats available. See style.js also.
    this.textHeight = 2.5;
    this.widthFactor = 1;
    this.obliqueAngle = 0;
    this.lastTextHeight = this.textHeight;
    this.flags = new Flags();
    this.standardFlags = new Flags();

    if (data) {
      if (data.hasOwnProperty('name') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - ltype name
        this.name = data.name || data[2];
      }

      if (data.hasOwnProperty('font') || data.hasOwnProperty('3')) {
        // DXF Groupcode 3 - style font
        this.font = data.font || data[3];
      }

      if (data.hasOwnProperty('bigFont') || data.hasOwnProperty('4')) {
        // DXF Groupcode 4 - big font
        this.bigFont = data.bigFont || data[4];
      }

      if (data.hasOwnProperty('textHeight') || data.hasOwnProperty('40')) {
        // DXF Groupcode 40 - Text height
        this.textHeight = data.textHeight || data[40];
      }

      if (data.hasOwnProperty('widthFactor') || data.hasOwnProperty('41')) {
        // DXF Groupcode 41 - width factor
        this.widthFactor = data.widthFactor || data[41];
      }

      if (data.hasOwnProperty('lastTextHeight') || data.hasOwnProperty('42')) {
        // DXF Groupcode 42 - Last text height
        this.lastTextHeight = data.lastTextHeight || data[42];
      }

      if (data.hasOwnProperty('obliqueAngle') || data.hasOwnProperty('50')) {
        // DXF Groupcode 50 - test height
        this.obliqueAngle = data.obliqueAngle || data[50];
      }

      if (data.hasOwnProperty('standardFlags') || data.hasOwnProperty('70')) {
        // DXF Groupcode 70 - standard flags
        /*
        1 = If set, this entry describes a shape
        4 = Vertical text
        16 = If set, table entry is externally dependent on an xref
        32 = If this bit and bit 16 are both set, the externally dependent xref has been successfully resolved
        64 = If set, the table entry was referenced by at least one entity in the drawing the last time the drawing was edited.
        (This flag is for the benefit of AutoCAD commands. It can be ignored.
        */

        this.standardFlags.setFlagValue(Property.loadValue([data.standardFlags, data[70]], 0));
      }

      if (data.hasOwnProperty('flags') || data.hasOwnProperty('71')) {
        // DXF Groupcode 71 - flags (bit-coded values):
        // 2 = Text is backward (mirrored in X).
        // 4 = Text is upside down (mirrored in Y).

        this.flags.setFlagValue(Property.loadValue([data.flags, data[71]], 0));
      }
    }
  }

  /**
   * Get the vertical value
   * @return {bool}
   */
  get vertical() {
    // Vertical value is bitmasked in standardflags as value 4
    return this.standardFlags.hasFlag(4);
  }

  /**
   * Set the vertical value
   * @param {boolean} bool
   */
  set vertical(bool) {
    if (bool) {
      // Add flag
      this.standardFlags.addValue(4);
    } else {
      // remove flag
      this.standardFlags.removeValue(4);
    }
  }

  /**
   * Get the backwards value
   * @return {bool}
   */
  get backwards() {
    // Upside down value is bitmasked in flags as value 2
    return this.flags.hasFlag(2);
  }

  /**
   * set the backwards value
   * @param {boolean} bool
   */
  set backwards(bool) {
    if (bool) {
      // Add flag
      this.flags.addValue(2);
    } else {
      // remove flag
      this.flags.removeValue(2);
    }
  }

  /**
   * Get the upside down value
   * @return {bool}
   */
  get upsideDown() {
    // Upside down value is bitmasked in flags as value 4
    return this.flags.hasFlag(4);
  }

  /**
   * Set the upside down value
   * @param {boolean} bool
   */
  set upsideDown(bool) {
    if (bool) {
      // Add flag
      this.flags.addValue(4);
    } else {
      // remove flag
      this.flags.removeValue(4);
    }
  }

  /**
   * Write the table to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'STYLE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbTextStyleTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name); // Stylename
    file.writeGroupCode('3', this.font); // Font
    file.writeGroupCode('4', ''); // Big font name blank is none
    file.writeGroupCode('40', this.textHeight); // Text Height
    file.writeGroupCode('41', this.widthFactor); // Width Factor
    file.writeGroupCode('42', this.textHeight); // Last Text Height
    file.writeGroupCode('50', this.obliqueAngle);
    file.writeGroupCode('70', this.standardFlags.getFlagValue()); // Standard Flags
    file.writeGroupCode('71', this.flags.getFlagValue()); // Flags
  }
}
