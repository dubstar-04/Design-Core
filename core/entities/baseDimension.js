import {Point} from './point.js';
import {Block} from '../tables/block.js';
import {Text} from './text.js';
import {Solid} from './solid.js';
import {Entity} from './entity.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

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

    Object.defineProperty(this, 'blockName', {
      value: '',
      writable: true,
    });

    Object.defineProperty(this, 'block', {
      value: new Block({points: [new Point(), new Point()]}),
      writable: true,
    });

    Object.defineProperty(this, 'text', {
      value: new Text(),
      writable: true,
    });

    Object.defineProperty(this, 'dimType', {
      value: 0,
      writable: true,
    });

    Object.defineProperty(this, 'styleName', {
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
        const err = 'Groupcode 1 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      /*
      if (data.hasOwnProperty('block')) {
        // Reference to block that contains the entities that make up this dimension
        this.block = data.block;
      }*/

      if (data.hasOwnProperty('blockName') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - Blockname
        this.blockName = data.blockName || data[2];
      }

      if (data.hasOwnProperty('styleName') || data.hasOwnProperty('3')) {
        // DXF Groupcode 3 - Dimension Style Name
        this.styleName = data.styleName || data[3];
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
        this.linearDimAngle = data[50];
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
        this.dimType = data.dimType || data[70];
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

  getBaseDimType() {
    const type = this.dimType % 32;
    return type;
  }

  getPointBySequence(sequenceNumber) {
    const point = this.points.find((point) => point.sequence === sequenceNumber);
    return point;
  }

  getArrowHead(point, angle, size) {
    let p1 = new Point(point.x + size/4, point.y + size);
    let p2 = new Point(point.x - size/4, point.y + size);
    const ang = angle - Math.PI / 2;
    p1 = p1.rotate(point, ang);
    p2 = p2.rotate(point, ang);

    const points = [point, p1, p2];

    const arrowHead = new Solid({points: points});

    return arrowHead;
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {Number} scale
   */
  draw(ctx, scale) {
    const style = DesignCore.DimStyleManager.getItemByName(this.styleName);

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

  snaps(mousePoint, delta) {
    const snaps = [];
    return snaps;
  }

  closestPoint(P) {
    return this.block.closestPoint(P);
  }

  boundingBox() {
    return this.block.boundingBox();
  }

  within(selectionExtremes) {
    return this.block.within(selectionExtremes);
  }

  intersectPoints() {
    return this.block.intersectPoints();
  }

  touched(selectionExtremes) {
    return this.block.touched(selectionExtremes);
  }
}
