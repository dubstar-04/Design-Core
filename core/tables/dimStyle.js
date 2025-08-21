import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Logging } from '../lib/logging.js';
import { Flags } from '../properties/flags.js';
import { Property } from '../properties/property.js';

/** DimStyle Class */
export class DimStyle {
  /**
   * Create a DimStyle
   * @param {Object} data
   */
  constructor(data) {
    // Define Properties
    this.type = this.constructor.name;
    this.standardFlags = new Flags();

    // Add DIMCEN property with getter and setter
    Object.defineProperty(this, 'DIMCEN', {
      get: this.getDimcen,
      set: this.setDimcen,
    });

    // Add two internal properties to manage the DIMCEN value
    this.DIMCENSTYL = 1; // internal - Controls the DIMCEN style
    this.DIMCENVALUE = 0.09;// internal - Holds the DIMCEN value


    /*
    The following properties are not implemented
    DIMALTRND - R2000
    DIMANNO - R2008
    DIMARCSYM - R2007
    DIMASSOC - 2002
    DIMASO - OBSOLETE
    DIMAZIN - R2000
    DIMCONSTRAINTICON - R2010
    DIMFXL - R2007
    DIMFXLON - R2007
    DIMJOGANG - R2007
    DIMLTEX1 - R2007
    DIMLTEX2 - R2007
    DIMLTYPE - R2007
    DIMSHO - OBSOLETE
    DIMTFILL - R2007
    DIMTFILLCLR - R2007
    DIMTXTDIRECTION - R2010
    */

    // DXF Groupcode 2 - ltype name
    this.name = Property.loadValue([data.name, data[2]], 'DimStyle');

    // DXF Groupcode 3 - General dimensioning suffix
    this.DIMPOST = Property.loadValue([data.DIMPOST, data[3]], '');

    // DXF Groupcode 4 - Alternate dimensioning suffix
    this.DIMAPOST = Property.loadValue([data.DIMAPOST, data[4]], '');

    if (data.hasOwnProperty('DIMBLK') || data.hasOwnProperty('5')) {
      // DXF Groupcode 5 - Arrow block name
      const err = 'DXF Groupcode 5 - obsolete';
      Logging.instance.warn(`${this.type} - ${err}`);
    }
    this.DIMBLK = Property.loadValue([data.DIMBLK, data[5]], 'CloseFilled');

    if (data.hasOwnProperty('DIMBLK1') || data.hasOwnProperty('6')) {
      // DXF Groupcode 6 - First arrow block name
      const err = 'DXF Groupcode 6 - obsolete';
      Logging.instance.warn(`${this.type} - ${err}`);
    }
    this.DIMBLK1 = Property.loadValue([data.DIMBLK1, data[6]], 'CloseFilled');

    if (data.hasOwnProperty('DIMBLK2') || data.hasOwnProperty('7')) {
      // DXF Groupcode 7 - Second arrow block name
      const err = 'DXF Groupcode 7 - obsolete';
      Logging.instance.warn(`${this.type} - ${err}`);
    }
    this.DIMBLK2 = Property.loadValue([data.DIMBLK2, data[7]], 'CloseFilled');

    // DXF Groupcode 40 - dimension scale
    /*
          Sets the overall scale factor applied to dimensioning variables that specify sizes, distances, or offsets.
          Also affects the leader objects with the LEADER command.
          Use MLEADERSCALE to scale multileader objects created with the MLEADER command.
          0.0 = A reasonable default value is computed based on the scaling between the current model space viewport and paper space.
          If you are in paper space or model space and not using the paper space feature, the scale factor is 1.0.
          >0 = A scale factor is computed that leads text sizes, arrowhead sizes, and other scaled distances to plot at their face values.

          DIMSCALE does not affect measured lengths, coordinates, or angles.
          Use DIMSCALE to control the overall scale of dimensions.
          However, if the current dimension style is annotative, DIMSCALE is automatically set to zero and the dimension scale is controlled by the CANNOSCALE system variable.
          DIMSCALE cannot be set to a non-zero value when using annotative dimensions.
        */
    this.DIMSCALE = Property.loadValue([data.DIMSCALE, data[40]], 1);

    // DXF Groupcode 41 - arrow size
    this.DIMASZ = Property.loadValue([data.DIMASZ, data[41]], 0.18);

    // DXF Groupcode 42 - offset from origin
    this.DIMEXO = Property.loadValue([data.DIMEXO, data[42]], 0.0625);

    // DXF Groupcode 43 - Baseline spacing
    this.DIMDLI = Property.loadValue([data.DIMDLI, data[43]], 0.38);

    // DXF Groupcode 44- extend beyond dim lines
    this.DIMEXE = Property.loadValue([data.DIMEXE, data[44]], 0.18);

    // DXF Groupcode 45 - Rounding value for dimension distances
    this.DIMRND = Property.loadValue([data.DIMRND, data[45]], 1);

    // DXF Groupcode 46 - Dimension line extension
    this.DIMDLE = Property.loadValue([data.DIMDLE, data[46]], 1);

    // DXF Groupcode 47 - Plus tolerance
    this.DIMTP = Property.loadValue([data.DIMTP, data[47]], 1);

    // DXF Groupcode 48 - Minus tolerance
    this.DIMTM = Property.loadValue([data.DIMTM, data[48]], 1);

    // DXF Groupcode 140 - Dimensioning text height
    this.DIMTXT = Property.loadValue([data.DIMTXT, data[140]], 0.18);

    // DXF Groupcode 141 - centre marks
    this.DIMCEN = Property.loadValue([data.DIMCEN, data[141]], 0.09);

    // DXF Groupcode 142 - Dimensioning tick size; 0 = no ticks
    // 0 = use arrow heads
    // >0 = Draws oblique strokes instead of arrowheads. The size of the oblique strokes is determined by this value multiplied by the DIMSCALE value.
    this.DIMTSZ = Property.loadValue([data.DIMTSZ, data[142]], 0);

    // DXF Groupcode 143 - multiplier for alternate units
    this.DIMALTF = Property.loadValue([data.DIMALTF, data[143]], 25.4);

    // DXF Groupcode 144 - Measurement scale factor
    this.DIMLFAC = Property.loadValue([data.DIMLFAC, data[144]], 1);

    // DXF Groupcode 145 - Text vertical position
    // The DIMTVP value is used when DIMTAD is off.
    // The magnitude of the vertical offset of text is the product of the text height and DIMTVP.
    // Setting DIMTVP to 1.0 is equivalent to setting DIMTAD to on.
    // The dimension line splits to accommodate the text only if the absolute value of DIMTVP is less than 0.7.
    this.DIMTVP = Property.loadValue([data.DIMTVP, data[145]], 0);

    // DXF Groupcode 146 - Dimension tolerance display scale factor
    this.DIMTFAC = Property.loadValue([data.DIMTFAC, data[146]], 1);

    // DXF Groupcode 147 - offset from dimline
    // The value of DIMGAP is also used as the minimum length of each segment of the dimension line.
    // To locate the components of a linear dimension within the extension lines, enough space must be available for both arrowheads (2 x DIMASZ),
    // both dimension line segments (2 x DIMGAP), a gap on either side of the dimension text (another 2 x DIMGAP), and the length of the dimension text,
    // which depends on its size and number of decimal places displayed
    this.DIMGAP = Property.loadValue([data.DIMGAP, data[147]], 0.09);

    // DXF Groupcode 70 - standard flags
    /*
        1 = If set, this entry describes a shape
        4 = Vertical text
        16 = If set, table entry is externally dependent on an xref
        32 = If this bit and bit 16 are both set, the externally dependent xref has been successfully resolved
        64 = If set, the table entry was referenced by at least one entity in the drawing the last time the drawing was edited.
        This flag is for the benefit of AutoCAD commands. It can be ignored.
        */
    this.standardFlags.setFlagValue(Property.loadValue([data.standardFlags, data[70]], 0));

    // DXF Groupcode 71 - Dimension tolerances generated if nonzero
    // Setting DIMTOL to on (1) turns DIMLIM off (0)
    this.DIMTOL = Property.loadValue([data.DIMTOL, data[71]], 0);

    // DXF Groupcode 72 - Dimension limits generated if nonzero
    // 0 = Dimension limits are not generated as default text
    // 1 = Dimension limits are generated as default text
    // Setting DIMLIM to on (1) turns DIMTOL off (0)
    this.DIMLIM = Property.loadValue([data.DIMLIM, data[72]], 0);

    // DXF Groupcode 73 - Text inside horizontal if nonzero
    // 0 = Aligns text with the dimension line
    // 1 = Draws text horizontally
    this.DIMTIH = Property.loadValue([data.DIMTIH, data[73]], 1);

    // DXF Groupcode 74 - Text outside horizontal if nonzero
    // 0 = Aligns text with the dimension line
    // 1 = Draws text horizontally
    this.DIMTOH = Property.loadValue([data.DIMTOH, data[74]], 1);

    // DXF Groupcode 75 - First extension line suppressed if nonzero
    this.DIMSE1 = Boolean(Property.loadValue([data.DIMSE1, data[75]], 0));

    // DXF Groupcode 76 - Second extension line suppressed if nonzero
    this.DIMSE2 = Boolean(Property.loadValue([data.DIMSE2, data[76]], 0));

    // DXF Groupcode 77 -Text above dimension line if nonzero
    // 0 = Centers the dimension text between the extension lines.
    // 1 = Places the dimension text above the dimension line except when the dimension line is not horizontal and text inside the extension lines is forced horizontal ( DIMTIH = 1). The distance from the dimension line to the baseline of the lowest line of text is the current DIMGAP value.
    // 2 = Places the dimension text on the side of the dimension line farthest away from the defining points.
    // 3 = Places the dimension text to conform to Japanese Industrial Standards (JIS).
    // 4 = Places the dimension text below the dimension line.
    this.DIMTAD = Property.loadValue([data.DIMTAD, data[77]], 0);

    // DXF Groupcode 78 - Zero suppression for “feet & inch” dimensions
    /*
        Values 0-3 affect feet-and-inch dimensions only:
        0 = Suppresses zero feet and precisely zero inches
        1 = Includes zero feet and precisely zero inches
        2 = Includes zero feet and suppresses zero inches
        3 = Includes zero inches and suppresses zero feet
        4 = Suppresses leading zeros in decimal dimensions (for example, 0.5000 becomes .5000)
        8 = Suppresses trailing zeros in decimal dimensions (for example, 12.5000 becomes 12.5)
        12 = Suppresses both leading and trailing zeros (for example, 0.5000 becomes .5)
    */
    this.DIMZIN = Property.loadValue([data.DIMZIN, data[78]], 0);

    // DXF Groupcode 170 - Alternate unit dimensioning performed if nonzero
    this.DIMALT = Property.loadValue([data.DIMALT, data[170]], 0);

    // DXF Groupcode 171 - Alternate unit decimal places
    // If DIMALT is turned on, DIMALTD sets the number of digits displayed to the right of the decimal point in the alternate measurement.
    this.DIMALTD = Property.loadValue([data.DIMALTD, data[171]], 2);

    // DXF Groupcode 172 - If text outside extensions, force line extensions between extensions if nonzero
    this.DIMTOFL = Boolean(Property.loadValue([data.DIMTOFL, data[172]], 0));

    // DXF Groupcode 173 - Use separate arrow blocks if nonzero
    /*
        Off = Use arrowhead blocks set by DIMBLK
        On = Use arrowhead blocks set by DIMBLK1 and DIMBLK2
    */
    this.DIMSAH = Property.loadValue([data.DIMSAH, data[173]], 0);

    // DXF Groupcode 174 - Force text inside extensions if nonzero
    /*
        Off = Varies with the type of dimension.
        For linear and angular dimensions, text is placed inside the extension lines if there is sufficient room.
        For radius and diameter dimensions that don’t fit inside the circle or arc, DIMTIX has no effect and always forces the text outside the circle or arc.
        On = Draws dimension text between the extension lines even if it would ordinarily be placed outside those lines
    */
    this.DIMTIX = Property.loadValue([data.DIMTIX, data[174]], 0);

    // DXF Groupcode 175 - Suppress outside-extensions dimension lines if nonzero
    /*
        If not enough space is available inside the extension lines and DIMTIX is on, setting DIMSOXD to On suppresses the arrowheads.
        If DIMTIX is off, DIMSOXD has no effect

        Off = Arrowheads are not suppressed
        On = Arrowheads are suppressed
    */
    this.DIMSOXD = Property.loadValue([data.DIMSOXD, data[175]], 0);

    // DXF Groupcode 176 - Dimension line color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMCLRD = Property.loadValue([data.DIMCLRD, data[176]], 0);

    // DXF Groupcode 177 - Dimension extension line color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMCLRE = Property.loadValue([data.DIMCLRE, data[177]], 0);

    // DXF Groupcode 178 - Dimension text color, range is 0 = BYBLOCK, 256 = BYLAYER
    this.DIMCLRT = Property.loadValue([data.DIMCLRT, data[178]], 0);

    // DXF Groupcode 179 - Number of precision places displayed in angular dimensions
    this.DIMADEC = Property.loadValue([data.DIMADEC, data[179]], 0);

    if (data.hasOwnProperty('DIMUNIT') || data.hasOwnProperty('270')) {
      // DXF Groupcode 270 - (obsolete, now use DIMLUNIT AND DIMFRAC)
      const err = `obsolete group code - 270`;
      Logging.instance.warn(`${this.type} - ${err}`);
    }
    this.DIMUNIT = Property.loadValue([data.DIMUNIT, data[270]], 0);

    // DXF Groupcode 271 - Number of decimal places for the tolerance values of a primary units dimension
    // The precision is based on the units or angle format you have selected.
    // Specified value is applied to angular dimensions when DIMADEC is set to -1.
    this.DIMDEC = Property.loadValue([data.DIMDEC, data[271]], 4);

    // DXF Groupcode 272 - Number of decimal places to display the tolerance values
    // This system variable has no effect unless DIMTOL is set to On. The default for DIMTOL is Off
    this.DIMTDEC = Property.loadValue([data.DIMTDEC, data[272]], 4);

    // DXF Groupcode 273 - Units format for alternate units of all dimension style family members except angular:
    // 1 = Scientific; 2 = Decimal; 3 = Engineering;
    // 4 = Architectural (stacked); 5 = Fractional (stacked);
    // 6 = Architectural; 7 = Fractional
    this.DIMALTU = Property.loadValue([data.DIMALTU, data[273]], 2);

    // DXF Groupcode 274 - Number of decimal places for tolerance values of an alternate units dimension
    this.DIMALTTD = Property.loadValue([data.DIMALTTD, data[274]], 2);

    // DXF Groupcode 275 - Angle format for angular dimensions:
    // 0 = Decimal degrees; 1 = Degrees/minutes/seconds;
    // 2 = Gradians; 3 = Radians; 4 = Surveyor’s units
    this.DIMAUNIT = Property.loadValue([data.DIMAUNIT, data[275]], 0);

    // DXF Groupcode 276 - Fraction format when DIMLUNIT is set to 4 (Architectural) or 5 (Fractional).
    this.DIMFRAC = Property.loadValue([data.DIMFRAC, data[276]], 0);

    // DXF Groupcode 277 - Sets units for all dimension types except Angular:
    // 1 = Scientific; 2 = Decimal; 3 = Engineering;
    // 4 = Architectural; 5 = Fractional; 6 = Windows desktop
    this.DIMLUNIT = Property.loadValue([data.DIMLUNIT, data[277]], 2);

    // DXF Groupcode 278 - Single-character decimal separator used when creating dimensions whose unit format is decimal
    // Period - ?
    // Comma - 44
    // Space - 32
    this.DIMDSEP = Property.loadValue([data.DIMDSEP, data[278]], '.');

    // DXF Groupcode 279 - Dimension text movement rules:
    // 0 = Moves the dimension line with dimension text
    // 1 = Adds a leader when dimension text is moved
    // 2 = Allows text to be moved freely without a leader
    this.DIMTMOVE = Property.loadValue([data.DIMTMOVE, data[279]], 0);

    // DXF Groupcode 280 - Horizontal dimension text position:
    // 0 = Above dimension line and center-justified between extension lines
    // 1 = Above dimension line and next to first extension line
    // 2 = Above dimension line and next to second extension line
    // 3 = Above and center-justified to first extension line
    // 4 = Above and center-justified to second extension line
    this.DIMJUST = Property.loadValue([data.DIMJUST, data[280]], 0);

    // DXF Groupcode 281 - Suppression of first extension line:
    // 0 = Not suppressed; 1 = Suppressed
    this.DIMSD1 = Property.loadValue([data.DIMSD1, data[281]], 0);

    // DXF Groupcode 282 - Suppression of second extension line:
    // 0 = Not suppressed; 1 = Suppressed
    this.DIMSD2 = Property.loadValue([data.DIMSD2, data[282]], 0);

    // DXF Groupcode 283 - Vertical justification for tolerance values:
    // 0 = Top; 1 = Middle; 2 = Bottom
    this.DIMTOLJ = Property.loadValue([data.DIMTOLJ, data[283]], 1);

    // DXF Groupcode 284 - Controls suppression of zeros for tolerance values:
    // 0 = Suppresses zero feet and precisely zero inches
    // 1 = Includes zero feet and precisely zero inches
    // 2 = Includes zero feet and suppresses zero inches
    // 3 = Includes zero inches and suppresses zero feet
    this.DIMTZIN = Property.loadValue([data.DIMTZIN, data[284]], 1);

    // DXF Groupcode 285 - Controls suppression of zeros for alternate unit dimension values:
    // 0 = Suppresses zero feet and precisely zero inches
    // 1 = Includes zero feet and precisely zero inches
    // 2 = Includes zero feet and suppresses zero inches
    // 3 = Includes zero inches and suppresses zero feet
    this.DIMALTZ = Property.loadValue([data.DIMALTZ, data[285]], 0);

    // DXF Groupcode 286 - Controls suppression of zeros for alternate tolerance values:
    // 0 = Suppresses zero feet and precisely zero inches
    // 1 = Includes zero feet and precisely zero inches
    // 2 = Includes zero feet and suppresses zero inches
    // 3 = Includes zero inches and suppresses zero feet
    this.DIMALTTZ = Property.loadValue([data.DIMALTTZ, data[286]], 0);


    if (data.hasOwnProperty('DIMFIT') || data.hasOwnProperty('287')) {
      // DXF Groupcode 287 - (obsolete, now use DIMATFIT and DIMTMOVE)
      const err = `obsolete group code - 287`;
      Logging.instance.warn(`${this.type} - ${err}`);
    }
    this.DIMFIT = Property.loadValue([data.DIMFIT, data[287]], 0);

    // DXF Groupcode 288 - Cursor functionality for user-positioned text:
    // 0 = Controls only the dimension line location
    // 1 = Controls the text position as well as the dimension line location
    this.DIMUPT = Property.loadValue([data.DIMUPT, data[288]], 0);

    // DXF Groupcode 289 - Controls dimension text and arrow placement when space is not sufficient to place both within the extension lines:
    // 0 = Places both text and arrows outside extension lines
    // 1 = Moves arrows first, then text
    // 2 = Moves text first, then arrows
    // 3 = Moves either text or arrows, whichever fits best AutoCAD adds a leader to moved dimension text when DIMTMOVE is set to 1
    this.DIMATFIT = Property.loadValue([data.DIMATFIT, data[289]], 3);

    // DXF Groupcode 340 - (handle of referenced STYLE)
    this.DIMTXSTY = Property.loadValue([data.DIMTXSTY, data[340]], 'Standard');

    // DXF Groupcode 341 - (handle of referenced BLOCK)
    this.DIMLDRBLK = Property.loadValue([data.DIMLDRBLK, data[341]], 'ClosedFilled');

    // DXF Groupcode 342 - (handle of referenced BLOCK)
    /*
        “” = closed filled
        “_DOT” = dot
        “_DOTSMALL” = dot small
        “_DOTBLANK”= dot blank
        “_ORIGIN” = origin indicator
        “_ORIGIN2” = origin indicator 2
        “_OPEN” = open
        “_OPEN90” = right angle
        “_OPEN30” = open 30
        “_CLOSED” = closed
        “_SMALL” = dot small blank
        “_NONE” = none
        “_OBLIQUE” = oblique
        “_BOXFILLED” = box filled
        “_BOXBLANK” = box
        “_CLOSEDBLANK” = closed blank
        “_DATUMFILLED” = datum triangle filled
        “_DATUMBLANK” = datum triangle
        “_INTEGRAL” = integral
        “_ARCHTICK” = architectural tick
        */
    // this.DIMBLK = Property.loadValue([data.DIMBLK, data[342]], '');

    // DXF Groupcode 343 - (handle of referenced BLOCK)
    // this.DIMBLK1 = Property.loadValue([data.DIMBLK1, data[343]], '');

    // DXF Groupcode 344 - (handle of referenced BLOCK)
    // this.DIMBLK2 = Property.loadValue([data.DIMBLK2, data[344]], '');

    // DXF Groupcode 371 - (lineweight enum value)
    /*
        -3 Default (the LWDEFAULT value)
        -2 BYBLOCK
        -1 BYLAYER
        */
    this.DIMLWD = Property.loadValue([data.DIMLWD, data[371]], -2);


    // DXF Groupcode 372 - (lineweight enum value)
    /*
        -3 Default (the LWDEFAULT value)
        -2 BYBLOCK
        -1 BYLAYER
        */
    this.DIMLWE = Property.loadValue([data.DIMLWE, data[372]], -2);
  }

  /**
   * Get valueName property value from dimstyle
   * @param {string} valueName
   * @return {any} value or undefined
   */
  getValue(valueName) {
    if (this.hasOwnProperty(valueName)) {
      // Ensure a number value is returned - Not 100% certain all values are numbers.
      return Number(this[valueName]);
    }

    const err = `Getting Value - ${valueName}`;
    Logging.instance.warn(`${this.type} - ${err}`);
    return;
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
   * get the DIMCEN property for the center mark size
   * @return {Number} DIMCEN value
   * This uses two internal values to define the DIMCEN property
   * DIMCENSTYL & DIMCENVALUE
   * DIMCEN has 3 states:
   * - Less than zero = Line Mode (Extended Cross)
   * - Zero = Off
   * - Greater than zero = Mark mode (Cross)
   */
  getDimcen() {
    switch (this.DIMCENSTYL) {
      case 0:
        return 0;
      case 1:
        return Math.abs(this.DIMCENVALUE);
      case 2:
        return 0 - Math.abs(this.DIMCENVALUE);
      default:
        return 0;
    }
  }

  /**
   * set the DIMCEN value for the centre mark size
   * @param {String} value
   */
  setDimcen(value) {
    if ( value === 0) {
      this.DIMCENSTYL = 0;
    } else if (value > 0) {
      this.DIMCENSTYL = 1;
    } else if (value < 0) {
      this.DIMCENSTYL = 2;
    }

    this.DIMCENVALUE = Math.abs(value);
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'DIMSTYLE');
    file.writeGroupCode('105', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimStyleTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name); // Stylename
    file.writeGroupCode('70', this.standardFlags.getFlagValue());
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
    file.writeGroupCode('75', this.DIMSE1 ? 1 : 0); // convert bool to int
    file.writeGroupCode('76', this.DIMSE2 ? 1 : 0); // convert bool to int
    file.writeGroupCode('77', this.DIMTAD);
    file.writeGroupCode('78', this.DIMZIN);
    file.writeGroupCode('170', this.DIMALT);
    file.writeGroupCode('171', this.DIMALTD);
    file.writeGroupCode('172', this.DIMTOFL ? 1 : 0); // convert bool to int
    file.writeGroupCode('173', this.DIMSAH);
    file.writeGroupCode('174', this.DIMTIX);
    file.writeGroupCode('175', this.DIMSOXD);
    file.writeGroupCode('176', this.DIMCLRD);
    file.writeGroupCode('177', this.DIMCLRE);
    file.writeGroupCode('178', this.DIMCLRT);
    file.writeGroupCode('179', this.DIMADEC, DXFFile.Version.R14);
    // file.writeGroupCode('270', this.DIMUNIT); // obsolete, now use DIMLUNIT AND DIMFRAC
    file.writeGroupCode('271', this.DIMDEC);
    file.writeGroupCode('272', this.DIMTDEC, DXFFile.Version.R13);
    file.writeGroupCode('273', this.DIMALTU, DXFFile.Version.R13);
    file.writeGroupCode('274', this.DIMALTTD, DXFFile.Version.R13);
    file.writeGroupCode('275', this.DIMAUNIT, DXFFile.Version.R13);
    file.writeGroupCode('276', this.DIMFRAC, DXFFile.Version.R2000);
    file.writeGroupCode('277', this.DIMLUNIT, DXFFile.Version.R2000);
    // file.writeGroupCode('278', this.DIMDSEP, DXFFile.Version.R14)); - TODO: AutoCAD uses a numberical description
    file.writeGroupCode('279', this.DIMTMOVE, DXFFile.Version.R2000);
    file.writeGroupCode('280', this.DIMJUST, DXFFile.Version.R13);
    file.writeGroupCode('281', this.DIMSD1 ? 1 : 0, DXFFile.Version.R13); // convert bool to int
    file.writeGroupCode('282', this.DIMSD2 ? 1 : 0, DXFFile.Version.R13); // convert bool to int
    file.writeGroupCode('283', this.DIMTOLJ, DXFFile.Version.R13);
    file.writeGroupCode('284', this.DIMTZIN, DXFFile.Version.R13);
    file.writeGroupCode('285', this.DIMALTZ, DXFFile.Version.R13);
    file.writeGroupCode('286', this.DIMALTTZ, DXFFile.Version.R13);
    file.writeGroupCode('287', this.DIMFIT);
    file.writeGroupCode('288', this.DIMUPT, DXFFile.Version.R13);
    file.writeGroupCode('289', this.DIMATFIT, DXFFile.Version.R2000);
    file.writeGroupCode('340', this.DIMTXSTY, DXFFile.Version.R13);
    file.writeGroupCode('341', this.DIMLDRBLK, DXFFile.Version.R2000);
    // file.writeGroupCode('342', this.DIMBLK);
    // file.writeGroupCode('343', this.DIMBLK1);
    // file.writeGroupCode('344', this.DIMBLK2);
    file.writeGroupCode('371', this.DIMLWD, DXFFile.Version.R2000);
    file.writeGroupCode('372', this.DIMLWE, DXFFile.Version.R2000);
  }
}
