import {DXFFile} from '../lib/dxf/dxfFile.js';

export class DimStyle {
  constructor(data) {
    // Define Properties
    this.type = this.constructor.name;
    this.name = '';
    this.DIMPOST = ''; // 3 - General dimensioning suffix
    this.DIMAPOST = ''; // 4 - Alternate dimensioning suffix
    this.DIMBLK = ''; // 5 - Arrow block name
    this.DIMBLK1 = ''; // 6 - First arrow block name
    this.DIMBLK2 = ''; // 7 - Second arrow block name
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
      if (data.name || data[2]) {
        // DXF Groupcode 2 - ltype name
        this.name = data.name || data[2];
      }

      if (data[3]) {
        // DXF Groupcode 3 - General dimensioning suffix
        this.DIMPOST = data[3];
      }

      if (data[4]) {
        // DXF Groupcode 4 - Alternate dimensioning suffix
        this.DIMAPOST = data[4];
      }

      if (data[5]) {
        // DXF Groupcode 5 - Arrow block name
        this.DIMBLK = data[5];

        const err = 'DXF Groupcode 5 - obsolete';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[6]) {
        // DXF Groupcode 6 - First arrow block name
        this.DIMBLK1 = data[6];

        const err = 'DXF Groupcode 6 - obsolete';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[7]) {
        // DXF Groupcode 7 - Second arrow block name
        this.DIMBLK2 = data[7];

        const err = 'DXF Groupcode 7 - obsolete';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[40]) {
        // DXF Groupcode 40 - dimension scale
        this.DIMSCALE = data[40];
      }

      if (data[41]) {
        // DXF Groupcode 41 - arrow size
        this.DIMASZ = data[41];
      }

      if (data[42]) {
        // DXF Groupcode 42 - offset from origin
        this.DIMEXO = data[42];
      }

      if (data[43]) {
        // DXF Groupcode 43 - Baseline spacing
        this.DIMDLI = data[43];
      }

      if (data[44]) {
        // DXF Groupcode 44- extend beyond dim lines
        this.DIMEXE = data[44];
      }

      if (data[45]) {
        // DXF Groupcode 45 - Rounding value for dimension distances
        this.DIMRND = data[45];
      }

      if (data[45]) {
        // DXF Groupcode 46 - Dimension line extension
        this.DIMDLE = data[46];
      }

      if (data[47]) {
        // DXF Groupcode 47 - Plus tolerance
        this.DIMTP = data[47];
      }

      if (data[48]) {
        // DXF Groupcode 48 - Minus tolerance
        this.DIMTM = data[48];
      }

      if (data[140]) {
        // DXF Groupcode 140 - Dimensioning text height
        this.DIMTXT = data[140];
      }

      if (data[141]) {
        // DXF Groupcode 141 - centre marks
        this.DIMCEN = data[141];
      }

      if (data[142]) {
        // DXF Groupcode 142 - Dimensioning tick size; 0 = no ticks
        this.DIMTSZ = data[142];
      }

      if (data[143]) {
        // DXF Groupcode 143 - multiplier for alternate units
        this.DIMALTF = data[143];
      }

      if (data[144]) {
        // DXF Groupcode 144 - Measurement scale factor
        this.DIMLFAC = data[144];
      }

      if (data[145]) {
        // DXF Groupcode 145 - Text vertical position
        this.DIMTVP = data[145];
      }

      if (data[146]) {
        // DXF Groupcode 146 - Dimension tolerance display scale factor
        this.DIMTFAC = data[146];
      }

      if (data[147]) {
        // DXF Groupcode 147 - offset from dimline
        this.DIMGAP = data[147];
      }

      if (data[71]) {
        // DXF Groupcode 71 - Dimension tolerances generated if nonzero
        this.DIMTOL = data[71];
      }

      if (data[72]) {
        // DXF Groupcode 72 - Dimension limits generated if nonzero
        this.DIMLIM = data[72];
      }

      if (data[73]) {
        // DXF Groupcode 73 - Text inside horizontal if nonzero
        this.DIMTIH = data[73];
      }

      if (data[74]) {
        // DXF Groupcode 74 - Text outside horizontal if nonzero
        this.DIMTOH = data[74];
      }

      if (data[75]) {
        // DXF Groupcode 75 - First extension line suppressed if nonzero
        this.DIMSE1 = data[75];
      }

      if (data[76]) {
        // DXF Groupcode 76 - Second extension line suppressed if nonzero
        this.DIMSE2 = data[76];
      }

      if (data[77]) {
        // DXF Groupcode 77 -Text above dimension line if nonzero
        this.DIMTAD = data[77];
      }

      if (data[78]) {
        // DXF Groupcode 78 - Zero suppression for “feet & inch” dimensions
        this.DIMZIN = data[78];
      }

      if (data[170]) {
        // DXF Groupcode 170 - Alternate unit dimensioning performed if nonzero
        this.DIMALT = data[170];
      }

      if (data[171]) {
        // DXF Groupcode 171 - Alternate unit decimal places
        this.DIMALTD = data[171];
      }

      if (data[172]) {
        // DXF Groupcode 172 - If text outside extensions, force line extensions between extensions if nonzero
        this.DIMTOFL = data[172];
      }

      if (data[173]) {
        // DXF Groupcode 173 - Use separate arrow blocks if nonzero
        this.DIMSAH = data[173];
      }

      if (data[174]) {
        // DXF Groupcode 174 - Force text inside extensions if nonzero
        this.DIMTIX = data[174];
      }

      if (data[175]) {
        // DXF Groupcode 175 - Suppress outside-extensions dimension lines if nonzero
        this.DIMSOXD = data[175];
      }

      if (data[176]) {
        // DXF Groupcode 176 - Dimension line color, range is 0 = BYBLOCK, 256 = BYLAYER
        this.DIMCLRD = data[176];
      }

      if (data[177]) {
        // DXF Groupcode 177 - Dimension extension line color, range is 0 = BYBLOCK, 256 = BYLAYER
        this.DIMCLRE = data[177];
      }

      if (data[178]) {
        // DXF Groupcode 178 - Dimension text color, range is 0 = BYBLOCK, 256 = BYLAYER
        this.DIMCLRT = data[178];
      }
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
