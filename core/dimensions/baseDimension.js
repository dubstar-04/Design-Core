import { Point } from '../entities/point.js';
import { Block } from '../tables/block.js';
import { Text } from '../entities/text.js';
import { Solid } from '../entities/solid.js';
import { Line } from '../entities/line.js';
import { Entity } from '../entities/entity.js';
import { Logging } from '../lib/logging.js';
import { Property } from '../properties/property.js';
import { Strings } from '../lib/strings.js';
import { Utils } from '../lib/utils.js';

import { DesignCore } from '../designCore.js';
import { DimType } from '../properties/dimType.js';

/**
 * Base Dimension Entity Class
 * @extends Entity
 */
export class BaseDimension extends Entity {
  /**
   * Create a Base Dimension
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // lineType and lineWidth not applicable to dimensions
    this.properties.remove(Property.Names.LINETYPE);
    this.properties.remove(Property.Names.LINEWIDTH);

    // DXF Groupcode 1 - Dimension text override
    this.properties.add(Property.Names.TEXTOVERRIDE, {
      type: Property.Type.STRING,
      value: Property.loadValue([data?.[1], data?.textOverride], ''),
      dxfCode: 1,
    });

    // DXF Groupcode 2 - Block name
    this.properties.add(Property.Names.BLOCKNAME, {
      type: Property.Type.STRING,
      value: Property.loadValue([data?.blockName, data?.[2]], ''),
      dxfCode: 2,
      visible: false,
    });

    // DXF Groupcode 3 - Dimension Style Name
    this.properties.add(Property.Names.DIMENSIONSTYLE, {
      type: Property.Type.LIST,
      value: Property.loadValue([data?.dimensionStyle, data?.[3]], 'STANDARD'),
      dxfCode: 3,
    });

    // DXF Groupcode 40 - Leader length for radius and diameter dimensions
    this.properties.add(Property.Names.LEADERLENGTH, {
      type: Property.Type.NUMBER,
      value: Property.loadValue([data?.[40], data?.leaderLength], 0),
      dxfCode: 40,
      visible: false,
    });

    // DXF Groupcode 50 - Angle of rotated, horizontal, or vertical dimensions
    this.properties.add(Property.Names.LINEARDIMANGLE, {
      type: Property.Type.NUMBER,
      value: Property.loadValue([data?.[50], data?.linearDimAngle], 0),
      dxfCode: 50,
      visible: false,
    });

    // DXF Groupcode 53 - Rotation angle of dimension text away from default orientation
    this.properties.add(Property.Names.ANGLE, {
      type: Property.Type.NUMBER,
      value: Property.loadValue([data?.[53], data?.angle], 0),
      dxfCode: 53,
      visible: false,
    });

    Object.defineProperty(this, 'block', {
      value: new Block({ points: [new Point(), new Point()] }),
      writable: true,
    });

    Object.defineProperty(this, 'dimType', {
      value: new DimType(),
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('41')) {
        // DXF Groupcode 41 - Line Spacing Factor
        // Percentage of default (3-on-5) line spacing to be applied.
        // Valid values range from 0.25 to 4.00
        const err = 'Groupcode 41 not implemented';
        Logging.instance.debug(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('42')) {
        // DXF Groupcode 42 - Actual Measurement
        // Read-only
        const err = 'Groupcode 42 not implemented';
        Logging.instance.debug(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('51')) {
        // DXF Groupcode 51 - Horizontal Direction
        // All dimension types have an optional 51 group code, which indicates the horizontal direction
        // for the dimension entity. The dimension entity determines the orientation of dimension
        // text and lines for horizontal, vertical, and rotated linear dimensions
        // This group value is the negative if the angle between the OCS X axis and the UCS X axis.
        // It is always in the XY plane of the OCS
        const err = 'Groupcode 51 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('dimType') || data.hasOwnProperty('70')) {
        // DXF Groupcode 70 - Dimension Type
        // Values 0-6 are integer values that represent the dimension type. Values 32, 64, and 128
        // are bit values, which are added to the integer values
        // (value 32 is always set in R13 and later releases)
        // 0 = Rotated, horizontal, or vertical;
        // 1 = Aligned;
        // 2 = Angular;
        // 3 = Diameter;
        // 4 = Radius;
        // 5 = Angular 3 point;
        // 6 = Ordinate;
        // 32 = Indicates that the block reference (group code 2) is referenced by this dimension only
        // 64 = Ordinate type. This is a bit value (bit 7) used only with integer value 6.
        // If set, ordinate is X-type; if not set, ordinate is Y-type
        // 128 = This is a bit value (bit 8) added to the other group 70 values if the dimension text
        // has been positioned at a user-defined location rather than at the default location

        let dimTypeValue = data.dimType;

        if (data.dimType instanceof DimType) {
          dimTypeValue = data.dimType.getBaseDimType();
        }

        const dimensionType = Property.loadValue([data[70], dimTypeValue], 0);

        if (!DimType.isValidDimensionType(dimensionType)) {
          const msg = 'Invalid Dimension Type';
          const err = (`${this.type} - ${msg}: ${dimensionType}`);
          throw Error(err);
        }

        this.dimType.setDimType(dimensionType);
      }

      if (data.hasOwnProperty('71')) {
        // DXF Groupcode 71 - Attachment Point
        // 1 = Top left; 2 = Top centre; 3 = Top right
        // 4 = Middle left; 5 = Middle centre; 6 = Middle right
        // 7 = Bottom left; 8 = Bottom centre; 9 = Bottom right
        const err = 'Groupcode 71 not implemented';
        Logging.instance.debug(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('72')) {
        // DXF Groupcode 72 - Line Spacing
        // 1 (or missing) = At least (taller characters will override)
        // 2 = Exact (taller characters will not override)
        const err = 'Groupcode 72 not implemented';
        Logging.instance.debug(`${this.type} - ${err}`);
      }
    }
  }

  /**
   * Get the dimension value formatted according to the dimension style
   * @param {number} dimensionValue - the value to format
   * @return {string} - the formatted dimension value
   */
  getDimensionValue(dimensionValue) {
    // Formatted value to return
    let formattedDimensionValue = '';

    // Default precision from style
    const precision = this.getDimensionStyle().getValue('DIMDEC');
    const angularPrecision = this.getDimensionStyle().getValue('DIMADEC');

    // Dimension Rounding - DIMRND
    // rounding is not applied to angular dimensions
    const DIMRND = this.getDimensionStyle().getValue('DIMRND');
    if (DIMRND !== 0 && this.dimType.getBaseDimType() !== 2) {
      dimensionValue = Math.round(dimensionValue / DIMRND) * DIMRND;
    }

    let linearDimensionValue = Math.abs(dimensionValue).toFixed(precision);
    let angularDimensionValue = Math.abs(dimensionValue).toFixed(angularPrecision);

    // Zero suppression
    // Values 0-3 affect feet-and-inch dimensions only:
    // 0 = Suppresses zero feet and precisely zero inches
    // 1 = Includes zero feet and precisely zero inches
    // 2 = Includes zero feet and suppresses zero inches
    // 3 = Includes zero inches and suppresses zero feet
    // 4 = Suppresses leading zeros in decimal dimensions (for example, 0.5000 becomes .5000)
    // 8 = Suppresses trailing zeros in decimal dimensions (for example, 12.5000 becomes 12.5)
    // 12 = Suppresses both leading and trailing zeros (for example, 0.5000 becomes .5)

    const DIMZIN = this.getDimensionStyle().getValue('DIMZIN');
    const suppressLeadingLinear = (DIMZIN === 4 || DIMZIN === 12);
    const suppressTrailingLinear = (DIMZIN === 8 || DIMZIN === 12);
    linearDimensionValue = this.suppressZeros(linearDimensionValue, suppressLeadingLinear, suppressTrailingLinear);

    const DIMAZIN = this.getDimensionStyle().getValue('DIMAZIN');
    const suppressLeadingAngular = (DIMAZIN === 1 || DIMAZIN === 3);
    const suppressTrailingAngular = (DIMAZIN === 2 || DIMAZIN === 3);
    angularDimensionValue = this.suppressZeros(angularDimensionValue, suppressLeadingAngular, suppressTrailingAngular);

    switch (this.dimType.getBaseDimType()) {
      case 0: // Rotated, horizontal, or vertical
      case 1: // Aligned
        formattedDimensionValue = `${linearDimensionValue}`;
        break;
      case 2: // Angular
        formattedDimensionValue = `${angularDimensionValue}${Strings.Symbol.DEGREE}`;
        break;
      case 3: // Diameter
        formattedDimensionValue = `${Strings.Symbol.DIAMETER}${linearDimensionValue}`;
        break;
      case 4: // Radius
        formattedDimensionValue = `${Strings.Symbol.RADIUS}${linearDimensionValue}`;
        break;
      case 5: // Angular 3 point
        formattedDimensionValue = `${angularDimensionValue}${Strings.Symbol.DEGREE}`;
        break;
      case 6: // Ordinate
        // Ordinate dimensions are typically used to indicate the X or Y coordinate of a point
        formattedDimensionValue = `${linearDimensionValue} ${Strings.Symbol.UNITS}`;
        break;
      default:
        formattedDimensionValue = `${linearDimensionValue}`;
    }

    // Decimal separator - DIMDSEP
    const DIMDSEP = this.getDimensionStyle().getValue('DIMDSEP');
    // Replace dot with specified separator
    if (DIMDSEP !== '.') {
      formattedDimensionValue = formattedDimensionValue.replace('.', DIMDSEP);
    }

    // Handle textOverride
    const textOverride = this.getProperty(Property.Names.TEXTOVERRIDE);
    if (textOverride !== '') {
      formattedDimensionValue = textOverride.replace(/<>/g, formattedDimensionValue);
    }

    // TODO: Implement prefix and postsuffix - DIMPOST
    // prefix and suffix included in DIMPOST value separated by <>
    // e.g. prefix<>suffix
    // const DIMPOST = this.getDimensionStyle().getValue('DIMPOST');
    // const DIMAPOST = this.getDimensionStyle().getValue('DIMAPOST');

    // TODO: Implement Unit format - DIMLUNIT
    // 1 = Scientific; 2 = Decimal; 3 = Engineering;
    // 4 = Architectural; 5 = Fractional; 6 = Windows desktop
    // const DIMLUNIT = this.getDimensionStyle().getValue('DIMLUNIT');

    return formattedDimensionValue;
  }

  /**
   * Suppress leading and/or trailing zeros from a dimension value
   * @param {number} dimensionValue
   * @param {boolean} suppressLeading
   * @param {boolean} suppressTrailing
   * @return {string} - the dimension value as a string with suppressed zeros
   */
  suppressZeros(dimensionValue, suppressLeading, suppressTrailing) {
    let numberString = dimensionValue.toString();

    if (suppressLeading) {
      // Suppress leading zeros
      numberString = numberString.replace(/^0+/, '');
    }

    if (suppressTrailing) {
      // Suppress trailing zeros
      numberString = numberString.replace(/(\.\d*?[1-9])0+$/g, '$1').replace(/\.0+$/, '');
    }

    if (numberString === '') {
      // If the result is an empty string return '0'
      numberString = '0';
    }

    return numberString;
  }

  /**
   * set the dimensions text value
   * @param {string} textValue - the dimension value to set
   * @param {Point} textPosition - the position of the text
   * @param {number} textRotation - the rotation of the text (radians)
   * @return {Text} Dimension Text
   */
  getDimensionText(textValue, textPosition, textRotation) {
    const text = new Text();
    // get the text height
    const textHeight = this.getDimensionStyle().getValue('DIMTXT');
    // set the text height
    text.setProperty(Property.Names.HEIGHT, textHeight);
    // Always set text horizontal alignment to centre
    text.setProperty(Property.Names.HORIZONTALALIGNMENT, 1);
    // Always set text vertical alignment to middle
    text.setProperty(Property.Names.VERTICALALIGNMENT, 2);
    // set the text value
    text.setProperty(Property.Names.STRING, this.getDimensionValue(textValue));
    // set the text position
    text.points = [textPosition];
    // set the text rotation
    text.setRotation(Utils.radians2degrees(this.getTextDirection(textRotation)));

    return text;
  }

  /**
   * Get the text direction ensuring it is always oriented correctly
   * @param {number} textDirection - the direction of the text (radians)
   * @return {number} - the adjusted text direction (radians)
   */
  getTextDirection(textDirection) {
    // Ensure the text is orientated correctly
    if (textDirection > Math.PI / 2 && textDirection <= Math.PI * 1.5) {
      textDirection = textDirection + Math.PI;
    }
    return textDirection;
  }

  /**
   * Check if two angles are aligned or opposite
   * @param {number} angle1 in radians
   * @param {number} angle2 in radians
   * @return {boolean} true if aligned or opposite
   */
  alignedOrOpposite(angle1, angle2) {
    const firstAngle = Utils.round(angle1 % (Math.PI * 2));
    const secondAngle = Utils.round(angle2 % (Math.PI * 2));
    const reversedSecondAngle = Utils.round((angle2 + Math.PI) % (Math.PI * 2));

    return (firstAngle === secondAngle || firstAngle === reversedSecondAngle);
  }

  /**
   * Get the dimension style
   * @return {Object} - the dimension style object
   */
  getDimensionStyle() {
    return DesignCore.DimStyleManager.getItemByName(this.getProperty(Property.Names.DIMENSIONSTYLE));
  }

  /**
   * Get the point for the sequence number
   * @param {Array} points - array of points to search
   * @param {number} sequenceNumber
   * @return {Point}
   */
  getPointBySequence(points, sequenceNumber) {
    const point = points.find((point) => point.sequence === sequenceNumber);

    if (!point) {
      return null;
    }

    return point;
  }

  /**
   * Define the arrow head
   * @param {Point} point
   * @param {number} angle
   * @return {Solid}
   */
  getArrowHead(point, angle) {
    // TODO: implement arrow styles
    // get the arrow size
    const arrowSize = this.getDimensionStyle().getValue('DIMASZ');
    let p1 = new Point(point.x + arrowSize / 4, point.y + arrowSize);
    let p2 = new Point(point.x - arrowSize / 4, point.y + arrowSize);
    const ang = angle - Math.PI / 2;
    p1 = p1.rotate(point, ang);
    p2 = p2.rotate(point, ang);

    const points = [point, p1, p2];

    const arrowHead = new Solid({ points: points });

    return arrowHead;
  }

  /**
   * Get the geometry for the centre mark
   * @param {Point} point centre point for centre mark
   * @return {Array} array of entities representing the centre mark
   */
  getCentreMark(point) {
    /*
    * DIMCEN value defines the centre mark type and size
    * 0 = No centre marks or lines are drawn
    * <0 = Centrelines are drawn
    * >0 = Centre marks are drawn
    */

    const centreMark = [];
    // get the centre mark style
    const markStyle = this.getDimensionStyle().getValue('DIMCENSTYL');
    // get the centre mark size
    const markSize = this.getDimensionStyle().getValue('DIMCENVALUE');

    if (markStyle === 0) {
      return centreMark;
    }

    if (markStyle > 0) {
      const lineOne = new Line({ points: [new Point(point.x - markSize, point.y), new Point(point.x + markSize, point.y)] });
      const lineTwo = new Line({ points: [new Point(point.x, point.y - markSize), new Point(point.x, point.y + markSize)] });
      centreMark.push(lineOne, lineTwo);

      if (markStyle > 1) {
        const lineThree = new Line({ points: [new Point(point.x, point.y + markSize * 2), new Point(point.x, point.y + markSize * 5)] });
        const lineFour = new Line({ points: [new Point(point.x - markSize * 2, point.y), new Point(point.x - markSize * 5, point.y)] });
        const lineFive = new Line({ points: [new Point(point.x, point.y - markSize * 2), new Point(point.x, point.y - markSize * 5)] });
        const lineSix = new Line({ points: [new Point(point.x + markSize * 2, point.y), new Point(point.x + markSize * 5, point.y)] });

        centreMark.push(lineThree, lineFour, lineFive, lineSix);
      }
    }

    return centreMark;
  }

  /**
   * Draw the entity
   * @param {Object} renderer
   * @return {Array} block items for the canvas to render recursively
   */
  draw(renderer) {
    if (this.block.entities.length === 0) {
      this.refresh();
    }

    return this.block.entities;
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];
    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    return this.block.closestPoint(P);
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    return this.block.boundingBox();
  }

  /**
   * Determine if the entity is within the selection
   * @param {Object} selection - {min: Point, max: Point}
   * @return {boolean} true if within
   */
  within(selection) {
    return this.block.within(selection);
  }

  /**
   * Determine if the entity is touch the selection window
   * @param {Object} selection - {min: Point, max: Point}
   * @return {boolean} true if touched
   */
  touched(selection) {
    return this.block.touched(selection);
  }

  /**
   * Refresh the dimension geometry
   */
  refresh() {
    const entities = this.buildDimension();

    if (entities) {
      this.block.clearEntities();

      entities.forEach((element) => {
        // For colour BYBLOCK for dimensions
        element.setProperty(Property.Names.COLOUR, 'BYBLOCK');
        this.block.addEntity(element);
      });
    }
  }

  /**
   * Set a property if it exists
   * @param {string} property
   * @param {any} value
   */
  setProperty(property, value) {
    if (this.properties.has(property)) {
      super.setProperty(property, value);
      return;
    }
    if (this.hasOwnProperty(property)) {
      this[property] = value;
      this.refresh();
    }
  }
}
