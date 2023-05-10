import {DXFFile} from '../lib/dxf/dxfFile.js';

export class DimStyle {
  constructor(data) {
    // Define Properties
    this.type = 'DimStyle';
    this.name = '';
    this.DIMPOST = ''; // 3 - General dimensioning suffix
    this.DIMAPOST = ''; // 4 - Alternate dimensioning suffix
    this.DIMBLK = ''; // 5 - Arrow block name
    this.DIMBLK1 = ''; // 6 - First arrow block name
    this.DIMBLK2 = ''; // 8 - Second arrow block name
    this.DIMSCALE = '1.0'; // 40 - dimension scale
    this.DIMASZ = '0.18'; // 41 - arrow size
    this.DIMEXO = '0.0625'; // 42 - offset from origin
    this.DIMDLI = '0.38'; // 43 - Baseline spacing
    this.DIMEXE = '0.18'; // 44- extend beyond dim lines
    this.DIMRND = '0.0'; // 45 - Rounding value for dimension distances
    this.DIMDLE = '0.0'; // 46 - Dimension line extension
    this.DIMTP = '0.0'; // 47 - Plus tolerance
    this.DIMTM = '0.0'; // 48 - Minus tolerance
    this.DIMTXT = '0.18'; // 140 - Dimensioning text height
    this.DIMCEN = '0.09'; // 141 - centre marks
    this.DIMTSZ = '0.0'; // 142 - Dimensioning tick size; 0 = no ticks
    this.DIMALTF = '25.39'; // 143 - multiplier for alternate units
    this.DIMLFAC = '1.0'; // 144 - Measurement scale factor
    this.DIMTVP = '0.0'; // 145 - Text vertical position
    this.DIMTFAC = '1.0'; // 146 - Dimension tolerance display scale factor
    this.DIMGAP = '0.09'; // 147 - offset from dimline
    this.DIMTOL = '0'; // 71 - Dimension tolerances generated if nonzero
    this.DIMLIM = '0'; // 72 - Dimension limits generated if nonzero
    this.DIMTIH = '1'; // 73 - Text inside horizontal if nonzero
    this.DIMTOH = '1'; // 74 - Text outside horizontal if nonzero
    this.DIMSE1 = '0'; // 75 - First extension line suppressed if nonzero
    this.DIMSE2 = '0'; // 76 - Second extension line suppressed if nonzero
    this.DIMTAD = '0'; // 77 -Text above dimension line if nonzero
    this.DIMZIN = '0'; // 78 - Zero suppression for “feet & inch” dimensions
    this.DIMALT = '0'; // 170 - Alternate unit dimensioning performed if nonzero
    this.DIMALTD = '2'; // 171 - Alternate unit decimal places
    this.DIMTOFL = '0'; // 172 - If text outside extensions, force line extensions between extensions if nonzero
    this.DIMSAH = '0'; // 173 - Use separate arrow blocks if nonzero
    this.DIMTIX = '0'; // 174 - Force text inside extensions if nonzero
    this.DIMSOXD = '0'; // 175 - Suppress outside-extensions dimension lines if nonzero
    this.DIMCLRD = '0'; // 176 - Dimension line color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMCLRE = '0'; // 177 - Dimension extension line color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMCLRT = '0'; // 178 - Dimension text color, range is 0 = BYBLOCK, 256 = BYLAYER


    if (data) {
      this.name = data.name;
    }
  }

  getStandardFlags() {
    // Standard flags (bit-coded values):
    // 1 = This entry describes as shape
    // 4 = Vertical Text
    // 16 = Style is from an xref
    // 32 = Xref is resolved (If set with 16)
    // 64 = Required for

    let flags = 0;

    if (this.vertical) {
      flags += 4;
    }

    return flags;
  }

  dxf(file) {
    file.writeGroupCode('0', 'DIMSTYLE');
    file.writeGroupCode('105', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimStyleTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name); // Stylename
    file.writeGroupCode('70', this.getStandardFlags()); // Flags
    file.writeGroupCode('3', this.DIMPOST); // DIMPOST
    file.writeGroupCode('4', this.DIMAPOST); // DIMAPOST
    file.writeGroupCode('5', this.DIMBLK); // DIMBLK
    file.writeGroupCode('6', this.DIMBLK1); // DIMBLK1
    file.writeGroupCode('7', this.DIMBLK2); // DIMBLK2
    file.writeGroupCode('40', this.DIMSCALE); // DIMSCALE
    file.writeGroupCode('41', this.DIMASZ); // DIMASZ
    file.writeGroupCode('42', this.DIMEXO); // DIMEXO
    file.writeGroupCode('43', this.DIMDLI); // DIMDLI
    file.writeGroupCode('44', this.DIMEXE); // DIMEXE
    file.writeGroupCode('45', this.DIMRND); // DIMRND
    file.writeGroupCode('46', this.DIMDLE); // DIMDLE
    file.writeGroupCode('47', this.DIMTP); // DIMTP
    file.writeGroupCode('48', this.DIMTM); // DIMTM
    file.writeGroupCode('140', this.DIMTXT); // DIMTXT
    file.writeGroupCode('141', this.DIMCEN); // DIMCEN
    file.writeGroupCode('142', this.DIMTSZ); // DIMTSZ
    file.writeGroupCode('143', this.DIMALTF); // DIMALTF
    file.writeGroupCode('144', this.DIMLFAC); // DIMLFAC
    file.writeGroupCode('145', this.DIMTVP); // DIMTVP
    file.writeGroupCode('146', this.DIMTFAC); // DIMTFAC
    file.writeGroupCode('147', this.DIMGAP); // DIMGAP
    file.writeGroupCode('71', this.DIMTOL); // DIMTOL
    file.writeGroupCode('72', this.DIMLIM); // DIMLIM
    file.writeGroupCode('73', this.DIMTIH); // DIMTIH
    file.writeGroupCode('74', this.DIMTOH); // DIMTOH
    file.writeGroupCode('75', this.DIMSE1); // DIMSE1
    file.writeGroupCode('76', this.DIMSE2); // DIMSE2
    file.writeGroupCode('77', this.DIMTAD); // DIMTAD
    file.writeGroupCode('78', this.DIMZIN); // DIMZIN
    file.writeGroupCode('170', this.DIMALT); // DIMALT
    file.writeGroupCode('171', this.DIMALTD); // DIMALTD
    file.writeGroupCode('172', this.DIMTOFL); // DIMTOFL
    file.writeGroupCode('173', this.DIMSAH); // DIMSAH
    file.writeGroupCode('174', this.DIMTIX); // DIMTIX
    file.writeGroupCode('175', this.DIMSOXD); // DIMSOXD
    file.writeGroupCode('176', this.DIMCLRD); // DIMCLRD
    file.writeGroupCode('177', this.DIMCLRE); // DIMCLRE
    file.writeGroupCode('178', this.DIMCLRT); // DIMCLRT
  }
}
