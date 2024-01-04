
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Line} from './line.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BaseDimension} from './baseDimension.js';
import {Point} from './point.js';

import {Core} from '../core.js';

export class AlignedDimension extends BaseDimension {
  constructor(data) {
    super(data);
  }

  static register() {
    const command = {command: 'AlignedDimension', shortcut: 'DIMALIGNED'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt13 = await Core.Scene.inputManager.requestInput(op);
      pt13.sequence = 13;
      this.points.push(pt13);

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt14 = await Core.Scene.inputManager.requestInput(op1);
      pt14.sequence = 14;
      this.points.push(pt14);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt11 = await Core.Scene.inputManager.requestInput(op2);
      pt11.sequence = 11;
      this.points.push(pt11);

      Core.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    if (this.points.length == 1) {
      const mousePoint = Core.Mouse.pointOnScene();
      const points = [this.points.at(0), mousePoint];
      Core.Scene.createTempItem('Line', {points: points});
    }

    if (this.points.length > 1) {
      const mousePoint = Core.Mouse.pointOnScene();
      mousePoint.sequence = 11;
      const points = [...this.points, mousePoint];
      Core.Scene.createTempItem(this.type, {points: points});
    }
  }

  static getPointsFromSelection(items) {
    const points = [];
    const item = items[0];

    const pt13 = item.points[0];
    pt13.sequence = 13;
    points.push(pt13);

    const pt14 = item.points[1];
    pt14.sequence = 14;
    points.push(pt14);

    return points;
  }

  buildDimension(style) {
    const Pt1 = this.getPointBySequence(13);
    const Pt2 = this.getPointBySequence(14);
    const Pt3 = this.getPointBySequence(11);

    let dimension = 0;
    const entities = [];

    // invalid points
    if (Pt1.isSame(Pt2) || Pt1.isSame(Pt3) || Pt2.isSame(Pt3)) {
      return null;
    }

    // extension points
    let P1e = new Point();
    let P2e = new Point();
    let P3e = new Point();

    const pntPerp = Pt3.closestPointOnLine(Pt1, Pt2);

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

      if (iX >= iY && dy !== 0) {
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


    const dimAngle = P1e.angle(P2e);
    const projectAngle = Pt1.angle(P1e);

    // Text
    const midPoint = P1e.midPoint(P2e);
    P3e = midPoint.project(projectAngle, style.getValue('DIMGAP')); // Offset text from baseline
    this.text.points = [P3e];
    this.text.setRotation(dimAngle);
    this.text.height = style.getValue('DIMTXT');

    let horizontalAlignment = 0;
    switch (style.getValue('DIMJUST')) {
      case 0:
        // 0 = Above dimension line and center-justified between extension lines
        horizontalAlignment = 1;
        break;
      case 1:
        // 1 = Above dimension line and next to first extension line
        break;
      case 2:
        // 2 = Above dimension line and next to second extension line
        break;
      case 3:
        // 3 = Above and center-justified to first extension line
        break;
      case 4:
        // 4 = Above and center-justified to second extension line
        break;
    }

    // 0 = Left; 1= Center; 2 = Right
    // 3 = Aligned (if vertical alignment = 0)
    // 4 = Middle (if vertical alignment = 0)
    // 5 = Fit (if vertical alignment = 0)

    this.text.horizontalAlignment = horizontalAlignment;


    let verticalAlignment = 1;
    switch (style.getValue('DIMTAD')) {
      case 0:
        // 0 = Centers the dimension text between the extension lines.
        verticalAlignment = 1;
        break;
      case 1:
        // 1 = Places the dimension text above the dimension line except when the dimension line is not horizontal and text inside the extension lines is forced horizontal ( DIMTIH = 1).
        // The distance from the dimension line to the baseline of the lowest line of text is the current DIMGAP value.
        verticalAlignment = 2;
        break;
      case 2:
        // 2 = Places the dimension text on the side of the dimension line farthest away from the defining points.
        break;
      case 3:
        // 3 = Places the dimension text to conform to Japanese Industrial Standards (JIS).
        break;
      case 4:
        // 4 = Places the dimension text below the dimension line.
        break;
    }

    // 0 = Baseline; 1 = Bottom; 2 = Middle; 3 = Top
    this.text.verticalAlignment = verticalAlignment;

    if (typeof(dimension) === 'number') {
      this.text.string = Math.abs(dimension.toFixed(2)).toString(); // TODO: Honor the precision from the style
    }

    if (typeof(dimAngle) === 'number') {
      const angle = Utils.radians2degrees(dimAngle);
      this.text.rotation = angle; // TODO: Honor the style
    }


    // get style properties
    const extension = style.getValue('DIMEXE');
    const offset = style.getValue('DIMEXO');
    const arrowsize = style.getValue('DIMASZ');

    // generate dimension points


    const extLineOneStart = Pt1.project(projectAngle, offset);
    const extLineTwoStart = Pt2.project(projectAngle, offset);

    const extLineOneEnd = P1e.project(projectAngle, extension);
    const extLineTwoEnd = P2e.project(projectAngle, extension);

    const dimLineOneStart = P1e;
    const dimLineTwoStart = P2e;

    const dimLineOneEnd = midPoint;
    const dimLineTwoEnd = midPoint;

    // generate dimension geometry
    const extLine1 = new Line({points: [extLineOneStart, extLineOneEnd]});
    // Supress extension line 1 if DIMS1 is true
    if (!style.getValue('DIMSE1')) {
      entities.push(extLine1);
    }

    const extLine2 = new Line({points: [extLineTwoStart, extLineTwoEnd]});
    // Supress extendsion line 2 if DIMSE2 is true
    if (!style.getValue('DIMSE2')) {
      entities.push(extLine2);
    }

    const dimLine1 = new Line({points: [dimLineOneStart, dimLineOneEnd]});
    // Supress dimension line 1 if DIMSD1 is true
    if (!style.getValue('DIMSD1')) {
      entities.push(dimLine1);
    }

    const dimLine2 = new Line({points: [dimLineTwoStart, dimLineTwoEnd]});
    // Supress dimension line 2 if DIMSD2 is true
    if (!style.getValue('DIMSD2')) {
      entities.push(dimLine2);
    }

    const arrowHead1 = this.getArrowHead(P1e, P1e.angle(P2e), arrowsize);
    const arrowHead2 = this.getArrowHead(P2e, P2e.angle(P1e), arrowsize);

    entities.push(arrowHead1, arrowHead2);

    return entities;
  }

  dxf(file) {
    const Pt10 = this.getPointBySequence(10);
    const Pt11 = this.text.points[0];
    const Pt13 = this.getPointBySequence(13);
    const Pt14 = this.getPointBySequence(14);

    file.writeGroupCode('0', 'DIMENSION');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimension', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    // file.writeGroupCode('2', this.blockName);  // Block not required
    file.writeGroupCode('10', Pt10.x); // X - definition / arrow point
    file.writeGroupCode('20', Pt10.y); // Y
    file.writeGroupCode('30', '0.0'); // Z
    file.writeGroupCode('11', Pt11.x); // X - text midpoint
    file.writeGroupCode('21', Pt11.y); // Y
    file.writeGroupCode('31', '0.0'); // Z
    file.writeGroupCode('70', 1); // DIMENSION TYPE 0 = rotated, 1 = aligned
    file.writeGroupCode('3', 'STANDARD'); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDbAlignedDimension', DXFFile.Version.R2000);
    file.writeGroupCode('13', Pt13.x); // X - start point of first extension line
    file.writeGroupCode('23', Pt13.y); // Y
    file.writeGroupCode('33', '0.0'); // Z
    file.writeGroupCode('14', Pt14.x); // X - start point of second extension line
    file.writeGroupCode('24', Pt14.y); // Y
    file.writeGroupCode('34', '0.0'); // Z
  }
}
