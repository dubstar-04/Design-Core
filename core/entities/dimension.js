import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Block} from './block.js';
import {Text} from './text.js';
import {Line} from './line.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';

export class Dimension extends Entity {
  constructor(data) {
    super(data);
    this.blockName = '';
    this.block = new Block();
    this.text = new Text();
    this.dimType = 0;
    this.leaderLength = 0; // 40: Leader length for radius and diameter dimensions
    this.angle = 0; // 50 Angle of rotated, horizontal or vertical linear dimensions
    this.styleName = 'STANDARD';


    if (data) {
      if (data[1]) {
        // DXF Groupcode 1 - Dimension text
        // The string explicitly entered by the user.
        // Optional; default is the measurement. If null or “<>”, the dimension measurement is drawn as the text,
        // if ““ (one blank space), the text is suppressed. Anything else is drawn as the text
        const err = 'Groupcode 1 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.blockName || data[2]) {
        // DXF Groupcode 2 - Blockname
        this.blockName = data.blockName || data[2];
      }

      if (data.styleName || data[3]) {
        // DXF Groupcode 3 - Dimension Style Name
        this.styleName = data.styleName || data[3];
      }

      if (data[41]) {
        // DXF Groupcode 41 - Line Spacing Factor
        // Percentage of default (3-on-5) line spacing to be applied.
        // Valid values range from 0.25 to 4.00
        const err = 'Groupcode 41 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[42]) {
        // DXF Groupcode 42 - Actual Measurement
        // Read-only
        const err = 'Groupcode 42 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[51]) {
        // DXF Groupcode 51 - Horizontal Direction
        // All dimension types have an optional 51 group code, which indicates the horizontal direction
        // for the dimension entity. The dimension entity determines the orientation of dimension
        // text and lines for horizontal, vertical, and rotated linear dimensions
        // This group value is the negative if the angle between the OCS X axis and the UCS X axis.
        // It is always in the XY plane of the OCS
        const err = 'Groupcode 51 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.angle || data[53]) {
        // DXF Groupcode 53 - Rotation
        // rotation angle of the dimension text away from its default orientation
        this.angle = data.angle || data[53];
      }

      if (data.dimType || data[70]) {
        // DXF Groupcode 70 - Dimension Type
        // Values 0-6 are integer values that represent the dimension type. Values 32, 64, and 128
        // are bit values, which are added to the integer values (value 32 is always set in R13 and later releases)
        // 0 = Rotated, horizontal, or vertical; 1 = Aligned; 2 = Angular; 3 = Diameter; 4 = Radius; 5 = Angular 3 point;
        // 6 = Ordinate; 32 = Indicates that the block reference (group code 2) is referenced by this dimension only
        // 64 = Ordinate type. This is a bit value (bit 7) used only with integer value 6.
        // If set, ordinate is X-type; if not set, ordinate is Y-type
        // 128 = This is a bit value (bit 8) added to the other group 70 values if the dimension text
        // has been positioned at a user-defined location rather than at the default location
        this.dimType = data.dimType || data[70];
      }

      if (data[71]) {
        // DXF Groupcode 71 - Attachment Point
        // 1 = Top left; 2 = Top center; 3 = Top right
        // 4 = Middle left; 5 = Middle center; 6 = Middle right
        // 7 = Bottom left; 8 = Bottom center; 9 = Bottom right
        const err = 'Groupcode 71 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[72]) {
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

  static register() {
    const command = {command: 'Dimension', shortcut: 'DIM', type: 'Entity'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt = await core.scene.inputManager.requestInput(op);
      this.points.push(pt);

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op1);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt2 = await core.scene.inputManager.requestInput(op2);
      this.points.push(pt2);

      core.scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview(core) {
    if (this.points.length == 1) {
      const mousePoint = core.mouse.pointOnScene();
      const points = [this.points.at(0), mousePoint];
      core.scene.createTempItem('Line', {points: points});
    }

    if (this.points.length >= 2) {
      const mousePoint = core.mouse.pointOnScene();
      const points = [...this.points, mousePoint];
      core.scene.createTempItem(this.type, {points: points});
    }
  }

  getBaseDimType() {
    // 0 = Rotated, horizontal, or vertical
    // 1 = Aligned
    // 2 = Angular
    // 3 = Diameter
    // 4 = Radius
    // 5 = Angular 3-point
    // 6 = Ordinate
    // 64 = Ordinate type. This is a bit value (bit 7) used only with integer value 6. If set, ordinate is X-type; if not set, ordinate is Y-type
    // 128 = This is a bit value (bit 8) added to the other group 70 values if the dimension text has been positioned at a user-defined location rather than at the default location

    let type = this.dimType;

    if (this.dimType > 64 && this.dimType < 128) {
      type = 6;
    }

    // if the value is over 128 subtract 128 to get the base type
    if (this.dimType > 128) {
      type = this.dimType - 128;
    }

    return type;
  }

  getExtensionPoints() {
    // return p1 and p2 for the dimension arrows

    const Pt1 = this.points[0];
    const Pt2 = this.points[1];
    const Pt3 = this.points[2];

    let dimension = 0;

    // invalid points
    if (Pt1.isSame(Pt2) || Pt1.isSame(Pt3) || Pt2.isSame(Pt3)) {
      return null; // [Pt1, Pt2, Pt1.midPoint(Pt2)]
    }

    // extension points
    let P1e = new Point(); // this.points[0];
    let P2e = new Point(); // this.points[1];
    let P3e = new Point();

    const pntPerp = Pt3.perpendicular(Pt1, Pt2);

    if (pntPerp !== null) {
      const projectionAngle = pntPerp.angle(Pt3);
      const distance = Pt3.distance(pntPerp);
      P1e = Pt1.project(projectionAngle, distance);
      P2e = Pt2.project(projectionAngle, distance);
      dimension = Pt1.distance(Pt2);
    } else {
      const dx = Pt2.x - Pt1.x;
      const dy = Pt2.y - Pt1.y;

      const iX = ((Math.abs(Pt3.x - Pt1.x) + Math.abs(Pt2.x - Pt3.x)) - Math.abs(dx));
      const iY = ((Math.abs(Pt3.y - Pt1.y) + Math.abs(Pt2.y - Pt3.y)) - Math.abs(dy));

      if (iX > iY && dy !== 0) {
        P1e.x = Pt3.x;
        P1e.y = Pt1.y;
        P2e.x = Pt3.x;
        P2e.y = Pt2.y;
        dimension = dy;
      } else if (iX < iY && dx !== 0) {
        P1e.x = Pt1.x;
        P1e.y = Pt3.y;
        P2e.x = Pt2.x;
        P2e.y = Pt3.y;
        dimension = dx;
      }
    }

    const midPoint = P1e.midPoint(P2e);
    P3e = midPoint; // TODO: Offset text from baseline
    const dimAngle = P1e.angle(P2e);

    // return [P1e, P2e, P3e]
    return {startPoint: P1e, endPoint: P2e, textPoint: P3e, dimension: dimension, dimAngle: dimAngle};
  }


  getBoundingRect() {
    extPnts = this.getExtensionPoints();

    if (!extPnts) {
      return null;
    }

    const xmin = Math.min(this.points[0].x, this.points[1].x, extPnts.startPoint.x, extPnts.endPoint.x);
    const xmax = Math.max(this.points[0].x, this.points[1].x, extPnts.startPoint.x, extPnts.endPoint.x);
    const ymin = Math.min(this.points[0].y, this.points[1].y, extPnts.startPoint.y, extPnts.endPoint.y);
    const ymax = Math.max(this.points[0].y, this.points[1].y, extPnts.startPoint.y, extPnts.endPoint.y);

    width = xmax - xmin;
    height = ymax - ymin;

    const rect = {width: width, height: height, x: xmin, y: ymin};

    return rect;
  }

  getDimensionPoints() {
    // Return the points required to draw the dimension
    // Pt1 = Dimension Start point
    // Pt2 = Dimension End Point
    // Pt3 = Baseline Extension Point
    // Pt4 = Text Center Point

    points = [];

    switch (this.getBaseDimType()) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
      case 5:
        break;
      case 6:
        break;
    }

    return points;
  }


  getBlockEntities() {
    const entities = [];
    const extPnts = this.getExtensionPoints();

    if (!extPnts) {
      return entities;
    }

    this.text.points = [extPnts.textPoint];
    this.text.setRotation(extPnts.dimAngle);

    if (typeof (extPnts.dimension) === 'number') {
      this.text.string = Math.abs(extPnts.dimension.toFixed(2)).toString(); // TODO: Honor the precision from the style
    }

    if (typeof (extPnts.dimAngle) === 'number') {
      const angle = Utils.radians2degrees(extPnts.dimAngle);
      this.text.rotation = angle; // TODO: Honor the style
    }

    switch (this.getBaseDimType()) {
      case 0:
        const line1 = new Line({points: [this.points[0], extPnts.startPoint]});
        const line2 = new Line({points: [this.points[1], extPnts.endPoint]});
        const baseLine = new Line({points: [extPnts.startPoint, extPnts.endPoint]});

        entities.push(line1, line2, baseLine);

        // drawArrowHead(extPnts.startPoint, extPnts.startPoint.angle(extPnts.endPoint), this.text.height / 2)
        // drawArrowHead(extPnts.endPoint, extPnts.endPoint.angle(extPnts.startPoint), this.text.height / 2)
        break;

      case 1:
        break;
      case 2:
        break;
      case 3:
        // line1 = new Line({ points: [this.points[3], this.points[4]] });
        // this.block.addItem(line1);
        // drawArrowHead(this.points[3], this.points[3].angle(this.points[4]), this.text.height / 2)
        // drawArrowHead(this.points[4], this.points[4].angle(this.points[3]), this.text.height / 2)
        break;
      case 4:
        break;
      case 5:
        break;
      case 6:
        break;
    }

    return entities;
  }

  draw(ctx, scale) {
    const entities = this.getBlockEntities();

    if (entities) {
      this.block.clearItems();
      entities.forEach((element) => {
        this.block.addItem(element);
      });

      this.block.addItem(this.text);
    }

    this.block.draw(ctx, scale);
    /*
    function drawArrowHead(point, angle, height) {
      triangleWidth = height;
      triangleHeight = height * 1.5;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      p1 = new Point(point.x + triangleWidth / 2, point.y + triangleHeight);
      p2 = new Point(point.x + -triangleWidth / 2, point.y + triangleHeight);
      angle = angle - Math.PI / 2;
      p1 = p1.rotate(point, angle);
      p2 = p2.rotate(point, angle);

      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      // ctx.fillStyle = this.colour;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    */

    // ////////////////////////////////////////
    // draw test point for perpendicular
    /*
        pnt = this.points[2].perpendicular(this.points[0], this.points[1])
        if (pnt) {
            ctx.moveTo(pnt.x, pnt.y);
            ctx.arc(pnt.x, pnt.y, 5 / scale, radians2degrees(0), radians2degrees(360), false);
            ctx.stroke()
        }
        */
    // ////////////////////////////////////////

    // Draw Bounding Box to test the getBoundingRect() /
    /*
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1 / scale;
        ctx.beginPath()
        ctx.moveTo(rect.x, rect.y);
        ctx.lineTo(rect.x + rect.width, rect.y);
        ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
        ctx.lineTo(rect.x, rect.y + rect.height);
        ctx.lineTo(rect.x, rect.y);
        ctx.stroke()
        */
    // ////////////////////////////////////////
  }

  dxf(file) {
    file.writeGroupCode('0', 'DIMENSION');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimension', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('2', this.blockName);
    file.writeGroupCode('10', this.points[0].x); // X - DEFINITION / ARROW POINT
    file.writeGroupCode('20', this.points[0].y); // Y - DEFINITION / ARROW POINT
    file.writeGroupCode('30', '0.0'); // Z - DEFINITION / ARROW POINT
    file.writeGroupCode('11', this.points[2].x); // X - TEXT MIDPOINT
    file.writeGroupCode('21', this.points[2].y); // Y - TEXT MIDPOINT
    file.writeGroupCode('31', '0.0'); // Z - TEXT MIDPOINT
    file.writeGroupCode('70', 0); // DIMENSION TYPE
    file.writeGroupCode('13', this.points[0].x); // X - START POINT OF FIRST EXTENSION LINE
    file.writeGroupCode('23', this.points[0].y); // Y - START POINT OF FIRST EXTENSION LINE
    file.writeGroupCode('33', '0.0'); // Z - START POINT OF FIRST EXTENSION LINE
    file.writeGroupCode('14', this.points[1].x); // X - START POINT OF SECOND EXTENSION LINE
    file.writeGroupCode('24', this.points[1].y); // Y - START POINT OF SECOND EXTENSION LINE
    file.writeGroupCode('34', '0.0'); // Z - START POINT OF SECOND EXTENSION LINE
    file.writeGroupCode('3', 'STANDARD'); // DIMENSION STYLE
  }

  snaps(mousePoint, delta, core) {
    const snaps = [];
    const extPnts = this.getExtensionPoints();
    snaps.push(extPnts.startPoint);
    snaps.push(extPnts.endPoint);
    snaps.push(extPnts.textPoint);
    snaps.push(this.points[0]);
    snaps.push(this.points[1]);

    return snaps;
  }

  closestPoint(P) {
    return this.block.closestPoint(P);
  }

  boundingBox() {
    return this.block.boundingBox();
  }

  within(selectionExtremes, core) {
    return this.block.within(selectionExtremes, core);
  }

  intersectPoints() {
    return this.block.intersectPoints();
  }

  touched(selectionExtremes, core) {
    return this.block.touched(selectionExtremes, core);
  }
}
