import { DesignCore } from '../designCore.js';
import { DXFFile } from './dxf/dxfFile.js';
import { Property } from '../properties/property.js';

/** Headers Class
 *
 * Stores drawing-level variables that correspond to DXF HEADER section entries.
 * These values are per-drawing, not application preferences
 */
export class Headers {
  // $FILLETRAD (group code 40)
  #filletRadius = 0;

  // $TRIMMODE (group code 70) - false = no trim, true = trim
  #trimMode = true;

  // $TEXTSIZE (group code 40)
  #textSize = 2.5;

  // $CHAMFERA (group code 40)
  #chamferDistanceA = 0;

  // $CHAMFERB (group code 40)
  #chamferDistanceB = 0;

  // $CHAMFERC (group code 40)
  #chamferLength = 0;

  // $CHAMFERD (group code 40)
  #chamferAngle = 0;

  // $CHAMMODE (group code 70) - false = distances, true = angle
  #chamferMode = false;

  // $ACADVER (group code 1)
  #dxfVersion = 'R2018';

  /** Create Headers */
  constructor() { }

  /** @type {number} Fillet radius ($FILLETRAD) */
  get filletRadius() {
    return this.#filletRadius;
  }

  /** @param {number} value */
  set filletRadius(value) {
    const num = parseFloat(value);
    if (!isFinite(num) || num < 0) throw new Error(`Invalid filletRadius: ${value}`);
    this.#filletRadius = num;
  }

  /** @type {boolean} Trim mode ($TRIMMODE) */
  get trimMode() {
    return this.#trimMode;
  }

  /** @param {boolean} value */
  set trimMode(value) {
    if (typeof value !== 'boolean') throw new Error(`Invalid trimMode: ${value}`);
    this.#trimMode = value;
  }

  /** @type {number} Default text size ($TEXTSIZE) */
  get textSize() {
    return this.#textSize;
  }

  /** @param {number} value */
  set textSize(value) {
    const num = parseFloat(value);
    if (!isFinite(num) || num <= 0) throw new Error(`Invalid textSize: ${value}`);
    this.#textSize = num;
  }

  /** @type {number} Chamfer distance A ($CHAMFERA) */
  get chamferDistanceA() {
    return this.#chamferDistanceA;
  }

  /** @param {number} value */
  set chamferDistanceA(value) {
    const num = parseFloat(value);
    if (!isFinite(num) || num < 0) throw new Error(`Invalid chamferDistanceA: ${value}`);
    this.#chamferDistanceA = num;
  }

  /** @type {number} Chamfer distance B ($CHAMFERB) */
  get chamferDistanceB() {
    return this.#chamferDistanceB;
  }

  /** @param {number} value */
  set chamferDistanceB(value) {
    const num = parseFloat(value);
    if (!isFinite(num) || num < 0) throw new Error(`Invalid chamferDistanceB: ${value}`);
    this.#chamferDistanceB = num;
  }

  /** @type {number} Chamfer length ($CHAMFERC) */
  get chamferLength() {
    return this.#chamferLength;
  }

  /** @param {number} value */
  set chamferLength(value) {
    const num = parseFloat(value);
    if (!isFinite(num) || num < 0) throw new Error(`Invalid chamferLength: ${value}`);
    this.#chamferLength = num;
  }

  /** @type {number} Chamfer angle ($CHAMFERD) */
  get chamferAngle() {
    return this.#chamferAngle;
  }

  /** @param {number} value */
  set chamferAngle(value) {
    const num = parseFloat(value);
    if (!isFinite(num) || num < 0) throw new Error(`Invalid chamferAngle: ${value}`);
    this.#chamferAngle = num;
  }

  /** @type {boolean} Chamfer method ($CHAMMODE): false = distances, true = angle */
  get chamferMode() {
    return this.#chamferMode;
  }

  /** @param {boolean} value */
  set chamferMode(value) {
    if (typeof value !== 'boolean') throw new Error(`Invalid chamferMode: ${value}`);
    this.#chamferMode = value;
  }

  /** @type {string} DXF version key ($ACADVER) */
  get dxfVersion() {
    return this.#dxfVersion;
  }

  /** @param {string} value - DXF version string or key */
  set dxfVersion(value) {
    if (DXFFile.validDxfVersion(value)) value = DXFFile.getVersionKey(value);
    if (!DXFFile.validDxfKey(value)) throw new Error(`Invalid DXF version: ${value}`);
    this.#dxfVersion = value;
  }

  /**
   * Load header values from a parsed DXF header object.
   * Only updates values that are present in the file; defaults are preserved otherwise.
   * @param {Object} header - parsed header section object from DXFReader
   */
  load(header) {
    this.filletRadius = parseFloat(Property.loadValue([header?.['$FILLETRAD']?.['40']], this.filletRadius));
    this.textSize = parseFloat(Property.loadValue([header?.['$TEXTSIZE']?.['40']], this.textSize));
    this.chamferDistanceA = parseFloat(Property.loadValue([header?.['$CHAMFERA']?.['40']], this.chamferDistanceA));
    this.chamferDistanceB = parseFloat(Property.loadValue([header?.['$CHAMFERB']?.['40']], this.chamferDistanceB));
    this.chamferLength = parseFloat(Property.loadValue([header?.['$CHAMFERC']?.['40']], this.chamferLength));
    this.chamferAngle = parseFloat(Property.loadValue([header?.['$CHAMFERD']?.['40']], this.chamferAngle));

    const trimModeRaw = Property.loadValue([header?.['$TRIMMODE']?.['70']]);
    if (trimModeRaw !== undefined) this.trimMode = parseInt(trimModeRaw) !== 0;

    const chamferModeRaw = Property.loadValue([header?.['$CHAMMODE']?.['70']]);
    if (chamferModeRaw !== undefined) this.chamferMode = parseInt(chamferModeRaw) !== 0;

    const acadVer = Property.loadValue([header?.['$ACADVER']?.['1']]);
    if (acadVer !== undefined) this.dxfVersion = acadVer;
  }

  /**
   * Write the DXF HEADER section content to a DXF file
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('9', '$ACADVER');
    file.writeGroupCode('1', file.version);
    file.writeGroupCode('9', '$TEXTSTYLE');
    // TODO: StyleManager write to headers?
    file.writeGroupCode('7', DesignCore.StyleManager.getCstyle());
    file.writeGroupCode('9', '$CLAYER');
    // TODO: LayerManager write to headers?
    file.writeGroupCode('8', DesignCore.LayerManager.getCstyle());
    file.writeGroupCode('9', '$DIMSTYLE');
    // TODO: DimStyleManager write to headers?
    file.writeGroupCode('2', DesignCore.DimStyleManager.getCstyle());
    file.writeGroupCode('9', '$HANDSEED', DXFFile.Version.R2000);
    file.writeGroupCode('5', DesignCore.HandleManager.handseed, DXFFile.Version.R2000);
    file.writeGroupCode('9', '$TEXTSIZE');
    file.writeGroupCode('40', this.textSize);
    file.writeGroupCode('9', '$FILLETRAD');
    file.writeGroupCode('40', this.filletRadius);
    file.writeGroupCode('9', '$TRIMMODE');
    file.writeGroupCode('70', this.trimMode ? 1 : 0);
    file.writeGroupCode('9', '$CHAMFERA');
    file.writeGroupCode('40', this.chamferDistanceA);
    file.writeGroupCode('9', '$CHAMFERB');
    file.writeGroupCode('40', this.chamferDistanceB);
    file.writeGroupCode('9', '$CHAMFERC');
    file.writeGroupCode('40', this.chamferLength);
    file.writeGroupCode('9', '$CHAMFERD');
    file.writeGroupCode('40', this.chamferAngle);
    file.writeGroupCode('9', '$CHAMMODE');
    file.writeGroupCode('70', this.chamferMode ? 1 : 0);
  }
}
