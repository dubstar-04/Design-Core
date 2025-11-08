
/** DimType Class */
export class DimType {
  /** Create DimType
   * @param {number} dimType - dxf dimType value
  */
  constructor(dimType=0) {
    // 0 = Rotated, horizontal, or vertical;
    // 1 = Aligned;
    // 2 = Angular;
    // 3 = Diameter;
    // 4 = Radius;
    // 5 = Angular 3 point;
    // 6 = Ordinate;
    // 32 = Indicates that the block reference (group code 2) is referenced by this dimension only
    // 64 = Ordinate type. This is a bit value (bit 7) used only with integer value 6. If set, ordinate is X-type; if not set, ordinate is Y-type
    // 128 = This is a bit value (bit 8) added to the other group 70 values if the dimension text

    this.dimType = 0;
    this.blockReference = true; // dimType bit 32 - dimension uses a block
    this.xTypeOrdinate = false; // dimType bit 64 - ordinate is X-type
    this.userPositionedText = false; // dimType bit 128 - text is user positioned

    this.setDimType(dimType);
  }

  /** Check if dimension type is valid
   * @param {number} dimType
   * @return {boolean} true if valid dimension type
  */
  static isValidDimensionType(dimType) {
    // get the base type
    const baseType = DimType.getBaseType(dimType);
    // check if base type is valid
    return baseType >= 0 && baseType <= 6;
  }


  /** Get Base Type
   * @param {number} dimType
   * @return {number} base dimension type
  */
  static getBaseType(dimType) {
    // sort the type temporarily
    let baseType = Number(dimType);
    // strip off the bit values
    if ((baseType & 128) !== 0) {
      baseType -= 128;
    };
    if ((baseType & 64) !== 0) {
      baseType -= 64;
    };
    if ((baseType & 32) !== 0) {
      baseType -= 32;
    };
    // return base type
    return baseType;
  }

  /**
   * Get Dimension Type without any flags
   * @return {number}
   */
  getBaseDimType() {
    return this.dimType;
  }

  /**
   * Get Dimension Type with flags
   * @return {number}
   */
  getDimType() {
    let dimType = this.dimType;
    if (this.blockReference) {
      dimType += 32;
    }
    if (this.xTypeOrdinate) {
      dimType += 64;
    }
    if (this.userPositionedText) {
      dimType += 128;
    }
    return dimType;
  }

  /**
   * Set Dimension Type
   * @param {number} dimType
   */
  setDimType(dimType) {
    // handle invalid input
    if (!DimType.isValidDimensionType(dimType)) {
      dimType = 0; // default to 0 if invalid
    }

    this.dimType = DimType.getBaseType(dimType);
    this.blockReference = (dimType & 32) !== 0;
    this.xTypeOrdinate = (dimType & 64) !== 0;
    this.userPositionedText = (dimType & 128) !== 0;
  }

  /**
   * Check if the dimension has a block reference
   * @return {boolean} true if the dimension has a block reference
   */
  hasBlockReference() {
    return this.blockReference;
  }

  /**
   * Check if the dimension text is user positioned
   * @return {boolean} true if the dimension text is user positioned
   */
  hasUserPositionedText() {
    return this.userPositionedText;
  }
}
