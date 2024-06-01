import {DXFFile} from '../lib/dxf/dxfFile.js';
import {Flags} from '../properties/flags.js';
import {Property} from '../properties/property.js';

/** LineType Class */
export class LType {
  /**
   * Create a Line Type
   * @param {Object} data
   */
  constructor(data) {
    this.type = 'LType';
    this.name = '';
    this.description = '';
    this.pattern = [];

    Object.defineProperty(this, 'flags', {
      value: new Flags(),
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('name') || data.hasOwnProperty('2') ) {
        // DXF Groupcode 2 - ltype name
        this.name = data.name || data[2];
      }

      if (data.hasOwnProperty('description') || data.hasOwnProperty('3') ) {
        // DXF Groupcode 3 - description text
        this.description = data.description || data[3];
      }

      if (data.hasOwnProperty('pattern') || data.hasOwnProperty('49') ) {
        // DXF Groupcode 49 - line type pattern
        this.pattern = data.pattern || data[49];
      }

      if (data.hasOwnProperty('73') ) {
        // DXF Groupcode 73 - number of line type elements in data[49]
        if (data[73] !== this.pattern.length) {
          throw Error('invalid line type pattern');
        }
      }

      if (data.hasOwnProperty('flags') || data.hasOwnProperty('70') ) {
        // DXF Groupcode 70 - Polyline flag (bit-coded; default = 0):
        // 16 = If set, table entry is externally dependent on an xref
        // 32 = If this bit and bit 16 are both set, the externally dependent xref has been successfully resolved
        // 64 = line type was referenced by at least one entity in the drawing the last time the drawing was edited. (This flag can be ignored by most programs)

        this.flags.setFlagValue(Property.loadValue([data.flags, data[70]], 0));
      }
    }
  }

  /**
   * Get a dash pattern that cairo and html canvas understand
   * @param {Array} scale
   * @returns array for dash pattern
   */
  getPattern(scale) {
    // DXF Patterns use -ve values for gaps and 0.0 for dots
    // cairo and canvas require pattern to include +ve non-zero values
    const pattern = this.pattern.map((x) => (Math.abs(x) + 1) / scale);
    return pattern;
  }

  /**
   * Write the dxf representation to file
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'LTYPE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbLinetypeTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name);
    file.writeGroupCode('70', this.flags.getFlagValue());
    file.writeGroupCode('3', this.description);
    file.writeGroupCode('72', 65); // Alignment code; value is always 65, the ASCII code for A
    file.writeGroupCode('73', this.pattern.length);

    let patternLength = 0;

    if (this.pattern.length) {
      patternLength = this.pattern.reduce((accumulator, patternValue) => accumulator + Math.abs(patternValue));
    }

    file.writeGroupCode('40', patternLength);

    for (let i = 0; i < this.pattern.length; i++) {
      file.writeGroupCode('49', this.pattern[i]);
      file.writeGroupCode('74', '0', DXFFile.Version.R2000);
    }
  }
}
