import {Colours} from '../lib/colours.js';
import {Colour} from '../lib/colour.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';

export class Layer {
  constructor(data) {
    // Define Properties
    this.type = 'Layer';
    this.name = '';
    this.frozen = false;
    this.on = true;
    this.locked = false;
    this.colour = new Colour(); // Colours.aciToRGB(7); // RGB Colour
    // this.trueColour; // undefined - only used when non-aci colours are set
    this.lineType = 'CONTINUOUS';
    this.lineWeight = 'DEFAULT';
    this.plotting = true;


    if (data) {
      if (data.name || data[2]) {
        // DXF Groupcode 2 - Layer Name
        this.name = data.name || data[2];
      }

      if (data.flags || data[70]) {
      // DXF Groupcode 70 - Layer Flags
      // Standard flags (bit-coded values):
      // 1 = Layer is frozen; otherwise layer is thawed
      // 2 = Layer is frozen by default in new viewports
      // 4 = Layer is locked
      // 16 = If set, table entry is externally dependent on an xref
      // 32 = If both this bit and bit 16 are set, the externally dependent xref has been successfully resolved
      // 64 = If set, the table entry was referenced by at least one entity in the drawing the last time the drawing was edited.

        const flags = data.flags || data[70];
        switch (flags) {
          case 0:
            break;
          case 1:
            this.frozen = true;
            break;
          case 2:
            this.frozen = true;
            break;
          case 4:
            this.locked = true;
            break;
          case 16:
            break;
          case 32:
            break;
          case 64: // (This flag is for the benefit of AutoCAD commands. It can be ignored by most programs that read DXF files and need not be set by programs that write DXF files.)
            break;
        }
      }

      if (data.colour || data[62]) {
        // DXF Groupcode 62 - Color Number(present if not BYLAYER)(optional);
        // zero indicates the BYBLOCK
        // 256 indicates BYLAYER;
        // A negative value indicates that the layer is turned off

        let aci;
        if (data.colour && data.colour.hasOwnProperty('aci')) {
          // get the aci number from the colour
          aci = data.colour.aci;
        }
        if (aci || data[62]) {
          this.colour.setColourFromACI(aci|| data[62]);
        }
      }

      if (data.lineType || data[6]) {
        // DXF Groupcode 6 - Linetype Name
        this.lineType = data.lineType || data[6];
      }

      if (data.lineWeight || data[370]) {
        // DXF Groupcode 370 - Linetype Weight
        this.lineWeight = data.lineWeight || data[370];
      }

      if (data.plotting || data[290]) {
        // DXF Groupcode 290 - Plotting flag
        // If set to 0, do not plot this layer
        this.plotting = data.plotting || data[290];
      }

      if (data.trueColour || data[420]) {
        // DXF Groupcode 420 - true color
        // A 24-bit color value that should be dealt with in terms of bytes with values
        // of 0 to 255. The lowest byte is the blue value, the middle byte is the
        // green value, and the third byte is the red value. The top byte is always
        // 0. The group code cannot be used by custom entities for their own data
        // because the group code is reserved for AcDbEntity, class-level color data
        // and AcDbEntity, class-level transparency data
        const trueColour = Colours.trueColourToRGB(Math.abs(data.trueColour || data[420]));
        if (trueColour) {
          this.colour.setColour(trueColour);
        }
      }
    }
  }

  get isVisible() {
    if (this.on && !this.frozen) {
      return true;
    }

    return false;
  }

  get isSelectable() {
    if (this.isVisible && !this.locked) {
      return true;
    }

    return false;
  }

  getColour() {
    return this.colour.getColour();
  }

  /**
   * Set the layer colour
   * @param {object} colour - rgb colour
   */
  setColour(colour) {
    this.colour.setColour(colour);
  }

  getFlags() {
    // Standard flags (bit-coded values):
    // 1 = Layer is frozen; otherwise layer is thawed.
    // 2 = Layer is frozen by default in new viewports.
    // 4 = Layer is locked.
    // 16 = If set, table entry is externally dependent on an xref.
    // 32 = If this bit and bit 16 are both set, the externally dependent xref has been successfully resolved.
    // 64 = If set, the table entry was referenced by at least one entity in the drawing the last time the drawing was edited. (This flag is for the benefit of AutoCAD commands. It can be ignored by most programs that read DXF files and need not be set by programs that write DXF files.)
    let flags = 0;

    if (this.frozen) {
      flags += 1;
    }
    if (this.locked) {
      flags += 4;
    }

    return flags;
  }

  dxf(file) {
    file.writeGroupCode('0', 'LAYER');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbLayerTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name); // Layername
    file.writeGroupCode('70', this.getFlags()); // Flags
    const colourValue = this.on ? this.colour.aci: (0 - this.colour.aci);
    file.writeGroupCode('62', colourValue); // Colour: Negative if layer is off
    if (this.colour.isTrueColour) {
      file.writeGroupCode('420', Colours.rgbToTrueColour(this.getColour()));
    }
    file.writeGroupCode('6', this.lineType);
    file.writeGroupCode('390', file.nextHandle(), DXFFile.Version.R2000); // plotstylename handle - //TODO: this needs to be linked to the actual plotstyle
    // file.writeGroupCode('290', this.plotting ? 1 : 0); //plotting   |   These items codes don't seem to be
    // file.writeGroupCode('370', 'this.lineWeight '); // lineWeight      |   supported in ACAD.
  }
}
