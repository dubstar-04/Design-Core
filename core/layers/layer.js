import {Colours} from '../lib/colours.js';

export class Layer {
  constructor(data) {
    // Define Properties
    this.type = 'Layer';
    this.name = '';
    this.frozen = false;
    this.on = true;
    this.locked = false;
    this.colour = '#FFFFFF';
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
        // DXF Groupcode 62 - Color Number
        // (present if not BYLAYER); zero indicates the BYBLOCK
        // (floating) color; 256 indicates BYLAYER; a negative value indicates that
        // the layer is turned off (optional)
        this.colour = data.colour || Colours.getHexColour(data[62]);
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

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'LAYER',
        '\n', '2', // Layername
        '\n', this.name,
        '\n', '70', // Flags
        '\n', this.getFlags(),
        '\n', '62', // Colour: Negative if layer is off
        '\n', this.on ? Colours.getACADColour(this.colour) : (0 - Colours.getACADColour(this.colour)),
        '\n', '6', // Linetype
        '\n', this.lineType,
        // "\n", "290", //plotting               |
        // "\n", this.plotting ? 1 : 0,          |   These items codes don't seem to be
        // "\n", "370", //lineWeight             |   supported in ACAD.
        // "\n", this.lineWeight                 |
    );

    return data;
  }
}
