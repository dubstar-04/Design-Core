import { Point } from './point.js';
import { Block } from '../tables/block.js';
import { Text } from './text.js';
import { Solid } from './solid.js';
import { Line } from './line.js';
import { Entity } from './entity.js';
import { Logging } from '../lib/logging.js';
import { Property } from '../properties/property.js';
import { Strings } from '../lib/strings.js';
import { Utils } from '../lib/utils.js';

import { DesignCore } from '../designCore.js';

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

    // hide inherited property
    // needs to be enumerable=false to not appear in the object props
    Object.defineProperty(this, 'lineType', {
      enumerable: false,
    });

    // hide inherited property
    Object.defineProperty(this, 'lineWidth', {
      enumerable: false,
    });

    Object.defineProperty(this, 'blockName', {
      value: '',
      writable: true,
    });

    Object.defineProperty(this, 'block', {
      value: new Block({ points: [new Point(), new Point()] }),
      writable: true,
    });

    Object.defineProperty(this, 'text', {
      value: new Text(),
      writable: true,
    });

    Object.defineProperty(this, 'textOverride', {
      value: '',
      writable: true,
      enumerable: true,
    });

    Object.defineProperty(this, 'dimType', {
      value: 0,
      writable: true,
    });

    Object.defineProperty(this, 'dimensionStyle', {
      value: 'STANDARD',
      writable: true,
      enumerable: true,
    });

    Object.defineProperty(this, 'leaderLength', {
      value: 0,
      writable: true,
    });

    Object.defineProperty(this, 'linearDimAngle', {
      value: 0,
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('1')) {
        // DXF Groupcode 1 - Dimension text
        // The string explicitly entered by the user.
        // Optional; default is the measurement. If null or “<>”, the dimension measurement is drawn as the text,
        // if ““ (one blank space), the text is suppressed. Anything else is drawn as the text
        this.textOverride = Property.loadValue([data[1], data.textOverride], '');
      }

      /*
      if (data.hasOwnProperty('block')) {
        // Reference to block that contains the entities that make up this dimension
        this.block = data.block;
      }*/

      if (data.hasOwnProperty('blockName') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - Blockname
        this.blockName = Property.loadValue([data.blockName, data[2]], '');
      }

      if (data.hasOwnProperty('dimensionStyle') || data.hasOwnProperty('3')) {
        // DXF Groupcode 3 - Dimension Style Name
        this.dimensionStyle = Property.loadValue([data.dimensionStyle, data[3]], 'STANDARD');
      }

      if (data.hasOwnProperty('40')) {
        // DXF Groupcode 40 - Leader length for radius and diameter dimensions
        this.leaderLength = data[40];
      }

      if (data.hasOwnProperty('41')) {
        // DXF Groupcode 41 - Line Spacing Factor
        // Percentage of default (3-on-5) line spacing to be applied.
        // Valid values range from 0.25 to 4.00
        const err = 'Groupcode 41 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('42')) {
        // DXF Groupcode 42 - Actual Measurement
        // Read-only
        const err = 'Groupcode 42 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('50')) {
        // DXF Groupcode 50 - Angle of rotated, horizontal, or vertical dimensions
        this.linearDimAngle = Property.loadValue([data[50]], 0);
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

      if (data.hasOwnProperty('angle') || data.hasOwnProperty('53')) {
        // DXF Groupcode 53 - Rotation
        // rotation angle of the dimension text away from its default orientation
        this.angle = Property.loadValue([data.angle, data[53]], 0);
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
        this.dimType = Property.loadValue([data.dimType, data[70]], 1);
      }

      if (data.hasOwnProperty('71')) {
        // DXF Groupcode 71 - Attachment Point
        // 1 = Top left; 2 = Top center; 3 = Top right
        // 4 = Middle left; 5 = Middle center; 6 = Middle right
        // 7 = Bottom left; 8 = Bottom center; 9 = Bottom right
        const err = 'Groupcode 71 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('72')) {
        // DXF Groupcode 72 - Line Spacing
        // 1 (or missing) = At least (taller characters will override)
        // 2 = Exact (taller characters will not override)
        const err = 'Groupcode 72 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.leaderLength) {
        this.leaderLength = data.leaderLength;
      }
    }
  }

  /**
   * Get the dimension type
   * @return {number}
   */
  getBaseDimType() {
    const type = this.dimType % 32;
    return type;
  }

  /**
   * Get the dimension value
   * @param {number} dimensionValue - the value to format
   * @return {string} - the formatted dimension value
   */
  getDimensionValue(dimensionValue) {
    let precision = 2; // Default precision
    let formattedDimensionValue = '';

    switch (this.getBaseDimType()) {
      case 0: // Rotated, horizontal, or vertical
        formattedDimensionValue = `${Math.abs(dimensionValue.toFixed(precision))}`;
        break;
      case 1: // Aligned
        precision = this.getDimensionStyle().getValue('DIMDEC');
        formattedDimensionValue = `${Math.abs(dimensionValue.toFixed(precision))}`;
        break;
      case 2: // Angular
        precision = this.getDimensionStyle().getValue('DIMADEC');
        formattedDimensionValue = `${Math.abs(dimensionValue.toFixed(precision))}${Strings.Symbol.DEGREE}`;
        break;
      case 3: // Diameter
        formattedDimensionValue = `${Strings.Symbol.DIAMETER}${Math.abs(dimensionValue.toFixed(precision))}`;
        break;
      case 4: // Radius
        formattedDimensionValue = `${Strings.Symbol.RADIUS}${Math.abs(dimensionValue.toFixed(precision))}`;
        break;
      case 5: // Angular 3 point
        precision = this.getDimensionStyle().getValue('DIMADEC');
        formattedDimensionValue = `${Math.abs(dimensionValue.toFixed(precision))}${Strings.Symbol.DEGREE}`;
        break;
      case 6: // Ordinate
        // Ordinate dimensions are typically used to indicate the X or Y coordinate of a point
        formattedDimensionValue = `${Math.abs(dimensionValue.toFixed(precision))} ${Strings.Symbol.UNITS}`;
        break;
      default:
        formattedDimensionValue = `${Math.abs(dimensionValue.toFixed(precision))}`;
    }

    // Handle textOverride
    if (this.textOverride !== '') {
      formattedDimensionValue = this.textOverride.replace(/<>/g, formattedDimensionValue);
    }

    return formattedDimensionValue;
  }

  /**
   * set the dimensions text value
   * @param {string} textValue - the dimension value to set
   * @param {Point} textPosition - the position of the text
   * @param {number} textRotation - the rotation of the text (radians)
   */
  setDimensionValue(textValue, textPosition, textRotation) {
    // get the text height
    const textHeight = this.getDimensionStyle().getValue('DIMTXT');
    // set the text height
    this.text.height = textHeight;
    // Always set text horizontal alignment to center
    this.text.horizontalAlignment = 1;
    // Always set text vertical alignment to middle
    this.text.verticalAlignment = 2;
    // set the text value
    this.text.string = this.getDimensionValue(textValue);
    // set the text position
    this.text.points = [textPosition];

    // set the text rotation
    if (this.getDimensionStyle().getValue('DIMTIH') === 0) {
      // DIMTIH - Text inside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
      // DIMTOH - Text outside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally

      // Ensure the text is orientated correctly
      if (textRotation > Math.PI / 2 && textRotation <= Math.PI * 1.5) {
        textRotation = textRotation + Math.PI;
      }

      this.text.setRotation(Utils.radians2degrees(textRotation));
    }
  }

  /**
   * Get the dimension style
   * @return {Object} - the dimension style object
   */
  getDimensionStyle() {
    return DesignCore.DimStyleManager.getItemByName(this.dimensionStyle);
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
   * @param {Point} point centre point for center mark
   * @return {Array} array of entities representing the center mark
   */
  getCentreMark(point) {
    /*
    * DIMCEN value defines the centre mark type and size
    * 0 = No center marks or lines are drawn
    * <0 = Centerlines are drawn
    * >0 = Center marks are drawn
    */

    const centreMark = [];
    // get the center mark style
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
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    const style = DesignCore.DimStyleManager.getItemByName(this.dimensionStyle);

    const entities = this.buildDimension(style);

    if (entities) {
      this.block.clearItems();

      entities.forEach((element) => {
        this.block.addItem(element);
      });

      this.block.addItem(this.text);
    }

    this.block.draw(ctx, scale);
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
   * @param {Array} selectionExtremes
   * @return {boolean} true if within
   */
  within(selectionExtremes) {
    return this.block.within(selectionExtremes);
  }

  /**
   * Intersect points
   * @return {Object} - object defining data required by intersect methods
   */
  intersectPoints() {
    return this.block.intersectPoints();
  }

  /**
   * Determine if the entity is touch the selection window
   * @param {Array} selectionExtremes
   * @return {boolean} true if touched
   */
  touched(selectionExtremes) {
    return this.block.touched(selectionExtremes);
  }
}
