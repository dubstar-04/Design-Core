import {DXFFile} from '../lib/dxf/dxfFile.js';
import {Logging} from '../lib/logging.js';

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
    this.DIMSCALE = 1.0; // 40 - dimension scale
    this.DIMASZ = 0.18; // 41 - arrow size
    this.DIMEXO = 0.0625; // 42 - offset from origin
    this.DIMDLI = 0.38; // 43 - Baseline spacing
    this.DIMEXE = 0.18; // 44- extend beyond dim lines
    this.DIMRND = 0.0; // 45 - Rounding value for dimension distances
    this.DIMDLE = 0.0; // 46 - Dimension line extension
    this.DIMTP = 0.0; // 47 - Plus tolerance
    this.DIMTM = 0.0; // 48 - Minus tolerance
    this.DIMTXT = 2.5; // 140 - Dimensioning text height
    this.DIMCEN = 0.09; // 141 - centre marks
    this.DIMTSZ = 0.0; // 142 - Dimensioning tick size; 0 = no ticks
    this.DIMALTF = 25.39; // 143 - multiplier for alternate units
    this.DIMLFAC = 1.0; // 144 - Measurement scale factor
    this.DIMTVP = 0.0; // 145 - Text vertical position
    this.DIMTFAC = 1.0; // 146 - Dimension tolerance display scale factor
    this.DIMGAP = 0.6250; // 147 - offset from dimline
    this.DIMTOL = 0; // 71 - Dimension tolerances generated if nonzero
    this.DIMLIM = 0; // 72 - Dimension limits generated if nonzero
    this.DIMTIH = 0; // 73 - Text inside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
    this.DIMTOH = 0; // 74 - Text outside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
    this.DIMSE1 = 0; // 75 - First extension line suppressed if nonzero
    this.DIMSE2 = 0; // 76 - Second extension line suppressed if nonzero
    this.DIMTAD = 0; // 77 -Text above dimension line if nonzero
    this.DIMZIN = 0; // 78 - Zero suppression for “feet & inch” dimensions
    this.DIMALT = 0; // 170 - Alternate unit dimensioning performed if nonzero
    this.DIMALTD = 2; // 171 - Alternate unit decimal places
    this.DIMTOFL = 0; // 172 - If text outside extensions, force line extensions between extensions if nonzero
    this.DIMSAH = 0; // 173 - Use separate arrow blocks if nonzero
    this.DIMTIX = 0; // 174 - Force text inside extensions if nonzero
    this.DIMSOXD = 0; // 175 - Suppress outside-extensions dimension lines if nonzero
    this.DIMCLRD = 0; // 176 - Dimension line color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMCLRE = 0; // 177 - Dimension extension line color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMCLRT = 0; // 178 - Dimension text color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMADEC = 0; // 179 - Number of precision places displayed in angular dimensions
    this.DIMUNIT= 2; // 270 - (obsolete, now use DIMLUNIT AND DIMFRAC)
    this.DIMDEC = 2; // 271 - Number of decimal places for the tolerance values of a primary units dimension
    this.DIMTDEC = 2; // 272 - Number of decimal places to display the tolerance values
    this.DIMALTU = 2; // 273 - Units format for alternate units of all dimension style family members except angular
    this.DIMALTTD = 3; // 274 - Number of decimal places for tolerance values of an alternate units dimension
    this.DIMAUNIT = 0; // 275 - Angle format for angular dimensions
    this.DIMFRAC = 0; // 276 - Fraction format when DIMLUNIT is set to 4 (Architectural) or 5 (Fractional).
    this.DIMLUNIT = 2; // 277 - Sets units for all dimension types except Angular
    this.DIMDSEP = ','; // 278 - Single-character decimal separator used when creating dimensions whose unit format is decimal
    this.DIMTMOVE = 0; // 279 - Dimension text movement rules
    this.DIMJUST = 0; // 280 - Horizontal dimension text position
    this.DIMSD1 = 0; // 281 - Suppression of first extension line
    this.DIMSD2 = 0; // 282 - Suppression of second extension line
    this.DIMTOLJ = 0; // 283 - Vertical justification for tolerance values
    this.DIMTZIN = 8; // 284 - Controls suppression of zeros for tolerance values
    this.DIMALTZ = 0; // 285 - Controls suppression of zeros for alternate unit dimension values
    this.DIMALTTZ = 0; // 286 - Controls suppression of zeros for alternate tolerance values
    this.DIMFIT = 3; // 287 - (obsolete, now use DIMATFIT and DIMTMOVE)
    this.DIMUPT = 0; // 288 - Cursor functionality for user-positioned text, 0 = Cursor controls only the dimension line location, 1 = Cursor controls both the text position and the dimension line location
    this.DIMATFIT = 3; // 289 - Controls dimension text and arrow placement when space is not sufficient to place both within the extension lines
    this.DIMTXSTY = 'Standard'; // 340 - (handle of referenced STYLE)
    this.DIMLDRBLK = ''; // 341 - (handle of referenced BLOCK)
    this.DIMBLK = ''; // 342 - (handle of referenced BLOCK)
    this.DIMBLK1 = ''; // 343 - (handle of referenced BLOCK)
    this.DIMBLK2 = ''; // 344 - (handle of referenced BLOCK)
    this.DIMLWD = -2; // 371 - (lineweight enum value)
    this.DIMLWE = -2; // 372 - (lineweight enum value)

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

      if (data[179]) {
        // DXF Groupcode 179 - Number of precision places displayed in angular dimensions
        this.DIMADEC = data[179];
      }

      if (data[270]) {
        // DXF Groupcode 270 - (obsolete, now use DIMLUNIT AND DIMFRAC)
        this.DIMUNIT = data[270];

        const err = `obsolete group code - 270`;
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[271]) {
        // DXF Groupcode 271 - Number of decimal places for the tolerance values of a primary units dimension
        this.DIMDEC = data[271];
      }

      if (data[272]) {
        // DXF Groupcode 272 - Number of decimal places to display the tolerance values
        this.DIMTDEC = data[272];
      }

      if (data[273]) {
        // DXF Groupcode 273 - Units format for alternate units of all dimension style family members except angular:
        // 1 = Scientific; 2 = Decimal; 3 = Engineering;
        // 4 = Architectural (stacked); 5 = Fractional (stacked);
        // 6 = Architectural; 7 = Fractional
        this.DIMALTU = data[273];
      }

      if (data[274]) {
        // DXF Groupcode 274 - Number of decimal places for tolerance values of an alternate units dimension
        this.DIMALTTD = data[274];
      }

      if (data[275]) {
        // DXF Groupcode 275 - Angle format for angular dimensions:
        // 0 = Decimal degrees; 1 = Degrees/minutes/seconds;
        // 2 = Gradians; 3 = Radians; 4 = Surveyor’s units
        this.DIMAUNIT = data[275];
      }

      if (data[276]) {
        // DXF Groupcode 276 - Fraction format when DIMLUNIT is set to 4 (Architectural) or 5 (Fractional).
        this.DIMFRAC = data[276];
      }

      if (data[277]) {
        // DXF Groupcode 277 - Sets units for all dimension types except Angular:
        // 1 = Scientific; 2 = Decimal; 3 = Engineering;
        // 4 = Architectural; 5 = Fractional; 6 = Windows desktop
        this.DIMLUNIT = data[277];
      }

      if (data[278]) {
        // DXF Groupcode 278 - Single-character decimal separator used when creating dimensions whose unit format is decimal
        this.DIMDSEP = data[278];
      }

      if (data[279]) {
        // DXF Groupcode 279 - Dimension text movement rules:
        // 0 = Moves the dimension line with dimension text
        // 1 = Adds a leader when dimension text is moved
        // 2 = Allows text to be moved freely without a leader
        this.DIMTMOVE = data[279];
      }

      if (data[280]) {
        // DXF Groupcode 280 - Horizontal dimension text position:
        // 0 = Above dimension line and center-justified between extension lines
        // 1 = Above dimension line and next to first extension line
        // 2 = Above dimension line and next to second extension line
        // 3 = Above and center-justified to first extension line
        // 4 = Above and center-justified to second extension line
        this.DIMJUST = data[280];
      }

      if (data[281]) {
        // DXF Groupcode 281 - Suppression of first extension line:
        // 0 = Not suppressed; 1 = Suppressed
        this.DIMSD1 = data[281];
      }

      if (data[282]) {
        // DXF Groupcode 282 - Suppression of second extension line:
        // 0 = Not suppressed; 1 = Suppressed
        this.DIMSD2 = data[282];
      }

      if (data[283]) {
        // DXF Groupcode 283 - Vertical justification for tolerance values:
        // 0 = Top; 1 = Middle; 2 = Bottom
        this.DIMTOLJ = data[283];
      }

      if (data[284]) {
        // DXF Groupcode 284 - Controls suppression of zeros for tolerance values:
        // 0 = Suppresses zero feet and precisely zero inches
        // 1 = Includes zero feet and precisely zero inches
        // 2 = Includes zero feet and suppresses zero inches
        // 3 = Includes zero inches and suppresses zero feet
        this.DIMTZIN = data[284];
      }

      if (data[285]) {
        // DXF Groupcode 285 - Controls suppression of zeros for alternate unit dimension values:
        // 0 = Suppresses zero feet and precisely zero inches
        // 1 = Includes zero feet and precisely zero inches
        // 2 = Includes zero feet and suppresses zero inches
        // 3 = Includes zero inches and suppresses zero feet
        this.DIMALTZ = data[285];
      }

      if (data[286]) {
        // DXF Groupcode 286 - Controls suppression of zeros for alternate tolerance values:
        // 0 = Suppresses zero feet and precisely zero inches
        // 1 = Includes zero feet and precisely zero inches
        // 2 = Includes zero feet and suppresses zero inches
        // 3 = Includes zero inches and suppresses zero feet
        this.DIMALTTZ = data[286];
      }

      if (data[287]) {
        // DXF Groupcode 287 - (obsolete, now use DIMATFIT and DIMTMOVE)
        this.DIMFIT = data[287];

        const err = `obsolete group code - 287`;
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[288]) {
        // DXF Groupcode 288 - Cursor functionality for user-positioned text:
        // 0 = Controls only the dimension line location
        // 1 = Controls the text position as well as the dimension line location
        this.DIMUPT = data[288];
      }

      if (data[289]) {
        // DXF Groupcode 289 - Controls dimension text and arrow placement when space is not sufficient to place both within the extension lines:
        // 0 = Places both text and arrows outside extension lines
        // 1 = Moves arrows first, then text
        // 2 = Moves text first, then arrows
        // 3 = Moves either text or arrows, whichever fits best AutoCAD adds a leader to moved dimension text when DIMTMOVE is set to 1
        this.DIMATFIT = data[289];
      }

      if (data[340]) {
        // DXF Groupcode 340 - (handle of referenced STYLE)
        this.DIMTXSTY = data[340];
      }

      if (data[341]) {
        // DXF Groupcode 341 - (handle of referenced BLOCK)
        this.DIMLDRBLK = data[341];
      }

      if (data[342]) {
        // DXF Groupcode 342 - (handle of referenced BLOCK)
        this.DIMBLK = data[342];
      }

      if (data[343]) {
        // DXF Groupcode 343 - (handle of referenced BLOCK)
        this.DIMBLK1 = data[343];
      }

      if (data[344]) {
        // DXF Groupcode 344 - (handle of referenced BLOCK)
        this.DIMBLK2 = data[344];
      }

      if (data[371]) {
        // DXF Groupcode 371 - (lineweight enum value)
        this.DIMLWD = data[371];
      }

      if (data[372]) {
        // DXF Groupcode 372 - (lineweight enum value)
        this.DIMLWE = data[372];
      }
    }

    const err = 'DXF Groupcodes incomplete';
    Logging.instance.warn(`${this.type} - ${err}`);
  }

  /**
   * Get valueName property value from dimstyle
   * @param {string} valueName
   * @returns value or undefined
   */
  getValue(valueName) {
    if (this.hasOwnProperty(valueName)) {
      return this[valueName];
    }

    const err = `Getting Value - ${valueName}`;
    Logging.instance.warn(`${this.type} - ${err}`);
    return;
  }

  /**
   * Get standard flags for the dimstyle
   * @returns
   */
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
    file.writeGroupCode('70', this.getStandardFlags());
    file.writeGroupCode('3', this.DIMPOST);
    file.writeGroupCode('4', this.DIMAPOST);
    file.writeGroupCode('5', this.DIMBLK);
    file.writeGroupCode('6', this.DIMBLK1);
    file.writeGroupCode('7', this.DIMBLK2);
    file.writeGroupCode('40', this.DIMSCALE);
    file.writeGroupCode('41', this.DIMASZ);
    file.writeGroupCode('42', this.DIMEXO);
    file.writeGroupCode('43', this.DIMDLI);
    file.writeGroupCode('44', this.DIMEXE);
    file.writeGroupCode('45', this.DIMRND);
    file.writeGroupCode('46', this.DIMDLE);
    file.writeGroupCode('47', this.DIMTP);
    file.writeGroupCode('48', this.DIMTM);
    file.writeGroupCode('140', this.DIMTXT);
    file.writeGroupCode('141', this.DIMCEN);
    file.writeGroupCode('142', this.DIMTSZ);
    file.writeGroupCode('143', this.DIMALTF);
    file.writeGroupCode('144', this.DIMLFAC);
    file.writeGroupCode('145', this.DIMTVP);
    file.writeGroupCode('146', this.DIMTFAC);
    file.writeGroupCode('147', this.DIMGAP);
    file.writeGroupCode('71', this.DIMTOL);
    file.writeGroupCode('72', this.DIMLIM);
    file.writeGroupCode('73', this.DIMTIH);
    file.writeGroupCode('74', this.DIMTOH);
    file.writeGroupCode('75', this.DIMSE1);
    file.writeGroupCode('76', this.DIMSE2);
    file.writeGroupCode('77', this.DIMTAD);
    file.writeGroupCode('78', this.DIMZIN);
    file.writeGroupCode('170', this.DIMALT);
    file.writeGroupCode('171', this.DIMALTD);
    file.writeGroupCode('172', this.DIMTOFL);
    file.writeGroupCode('173', this.DIMSAH);
    file.writeGroupCode('174', this.DIMTIX);
    file.writeGroupCode('175', this.DIMSOXD);
    file.writeGroupCode('176', this.DIMCLRD);
    file.writeGroupCode('177', this.DIMCLRE);
    file.writeGroupCode('178', this.DIMCLRT);
    file.writeGroupCode('179', this.DIMADEC);
    // file.writeGroupCode('270', this.DIMUNIT); // obsolete, now use DIMLUNIT AND DIMFRAC
    file.writeGroupCode('271', this.DIMDEC);
    file.writeGroupCode('272', this.DIMTDEC);
    file.writeGroupCode('273', this.DIMALTU);
    file.writeGroupCode('274', this.DIMALTTD);
    file.writeGroupCode('275', this.DIMAUNIT);
    file.writeGroupCode('276', this.DIMFRAC);
    file.writeGroupCode('277', this.DIMLUNIT);
    file.writeGroupCode('278', this.DIMDSEP);
    file.writeGroupCode('279', this.DIMTMOVE);
    file.writeGroupCode('280', this.DIMJUST);
    file.writeGroupCode('281', this.DIMSD1);
    file.writeGroupCode('282', this.DIMSD2);
    file.writeGroupCode('283', this.DIMTOLJ);
    file.writeGroupCode('284', this.DIMTZIN);
    file.writeGroupCode('285', this.DIMALTZ);
    file.writeGroupCode('286', this.DIMALTTZ);
    file.writeGroupCode('287', this.DIMFIT);
    file.writeGroupCode('288', this.DIMUPT);
    file.writeGroupCode('289', this.DIMATFIT);
    file.writeGroupCode('340', this.DIMTXSTY);
    file.writeGroupCode('341', this.DIMLDRBLK);
    file.writeGroupCode('342', this.DIMBLK);
    file.writeGroupCode('343', this.DIMBLK1);
    file.writeGroupCode('344', this.DIMBLK2);
    file.writeGroupCode('371', this.DIMLWD);
    file.writeGroupCode('372', this.DIMLWE);
  }
}
