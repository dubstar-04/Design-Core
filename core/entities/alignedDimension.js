
import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Line } from './line.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BaseDimension } from './baseDimension.js';
import { Point } from './point.js';

import { DesignCore } from '../designCore.js';

/**
 * Aligned Dimension Entity Class
 * @extends BaseDimension
 */
export class AlignedDimension extends BaseDimension {
  /**
   * Create an Aligned Dimension
   * @param {Array} data
   */
  constructor(data) {
    super(data);
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'AlignedDimension', shortcut: 'DIMALIGNED' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {

      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle()

      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt13 = await DesignCore.Scene.inputManager.requestInput(op);
      pt13.sequence = 13;
      this.points.push(pt13);

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt14 = await DesignCore.Scene.inputManager.requestInput(op1);
      pt14.sequence = 14;
      this.points.push(pt14);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt11 = await DesignCore.Scene.inputManager.requestInput(op2);
      pt11.sequence = 11;
      this.points.push(pt11);

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (this.points.length == 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const points = [this.points.at(0), mousePoint];
      DesignCore.Scene.createTempItem('Line', { points: points });
    }

    if (this.points.length > 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      mousePoint.sequence = 11;
      const points = [...this.points, mousePoint];
      DesignCore.Scene.createTempItem(this.type, { points: points });
    }
  }

  /**
   * Get sequenced points from user selection
   * @param {any} items
   * @return {Array} array of points
   */
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

  /**
   * Build the dimension
   * @param {Object} style
   * @return {Array} - Array of entities that compose the dimension
   */
  buildDimension(style) {

    const Pt13 = this.getPointBySequence(13);
    const Pt14 = this.getPointBySequence(14);
    const Pt11 = this.getPointBySequence(11);

    let dimension = 0;
    const entities = [];

    // invalid points
    if (Pt13.isSame(Pt14) || Pt13.isSame(Pt11) || Pt14.isSame(Pt11)) {
      return null;
    }

    // extension points
    let Pt13e = new Point();
    let Pt14e = new Point();
    //let P3e = new Point();

    const pntPerp = Pt11.perpendicular(Pt13, Pt14);
    const isAligned = pntPerp.isOnLine(Pt13, Pt14);

    if (isAligned) {
      // Aligned dimension
      const projectionAngle = pntPerp.angle(Pt11);
      const distance = Pt11.distance(pntPerp);
      Pt13e = Pt13.project(projectionAngle, distance);
      Pt14e = Pt14.project(projectionAngle, distance);
      dimension = Pt13.distance(Pt14);
    } else {
      // generate the x and y delta values
      const dx = Pt14.x - Pt13.x;
      const dy = Pt14.y - Pt13.y;

      // get the primary axis x or y
      const iX = ((Math.abs(Pt11.x - Pt13.x) + Math.abs(Pt14.x - Pt11.x)) - Math.abs(dx));
      const iY = ((Math.abs(Pt11.y - Pt13.y) + Math.abs(Pt14.y - Pt11.y)) - Math.abs(dy));

      if (iX >= iY && dy !== 0) {
        Pt13e.x = Pt11.x;
        Pt13e.y = Pt13.y;
        Pt14e.x = Pt11.x;
        Pt14e.y = Pt14.y;
        dimension = dy;
      } else if (iX < iY && dx !== 0) {
        Pt13e.x = Pt13.x;
        Pt13e.y = Pt11.y;
        Pt14e.x = Pt14.x;
        Pt14e.y = Pt11.y;
        dimension = dx;
      }
    }

    const projectAngle = Pt13.angle(Pt13e);
    const midPoint = Pt13e.midPoint(Pt14e);

    const textPosition = midPoint;
    const textRotation = Pt13e.angle(Pt14e);

    // Set the text value, position and rotation
    this.setDimensionValue(dimension, textPosition, textRotation);

    // approximate text width based on height
    const approxTextWidth = this.text.getApproximateWidth();

    // generate extension line points
    // get style properties
    const extension = style.getValue('DIMEXE');
    const offset = style.getValue('DIMEXO');

    const extLineOneStart = Pt13.project(projectAngle, offset);
    const extLineTwoStart = Pt14.project(projectAngle, offset);

    const extLineOneEnd = Pt13e.project(projectAngle, extension);
    const extLineTwoEnd = Pt14e.project(projectAngle, extension);

    // generate dimension line points
    const dimLineOneStart = Pt13e;
    const dimLineTwoStart = Pt14e;

    let dimLineOneEnd = textPosition.perpendicular(Pt13e, Pt14e);
    let dimLineTwoEnd = dimLineOneEnd;

    // split the dimension line when the text is centered vertically
    if (style.getValue('DIMTAD') === 0) {
      dimLineOneEnd = dimLineOneEnd.project(Pt14e.angle(Pt13e), approxTextWidth * 0.75);
      dimLineTwoEnd = dimLineTwoEnd.project(Pt13e.angle(Pt14e), approxTextWidth * 0.75);
    }

    // generate dimension geometry
    const extLine1 = new Line({ points: [extLineOneStart, extLineOneEnd] });
    // Supress extension line 1 if DIMS1 is true
    if (!style.getValue('DIMSE1')) {
      entities.push(extLine1);
    }

    const extLine2 = new Line({ points: [extLineTwoStart, extLineTwoEnd] });
    // Supress extendsion line 2 if DIMSE2 is true
    if (!style.getValue('DIMSE2')) {
      entities.push(extLine2);
    }

    const dimLine1 = new Line({ points: [dimLineOneStart, dimLineOneEnd] });
    // Supress dimension line 1 if DIMSD1 is true
    if (!style.getValue('DIMSD1')) {
      entities.push(dimLine1);
    }

    const dimLine2 = new Line({ points: [dimLineTwoStart, dimLineTwoEnd] });
    // Supress dimension line 2 if DIMSD2 is true
    if (!style.getValue('DIMSD2')) {
      entities.push(dimLine2);
    }

    // get the arrow size
    const arrowsize = style.getValue('DIMASZ');

    const arrowHead1 = this.getArrowHead(Pt13e, Pt13e.angle(Pt14e), arrowsize);
    const arrowHead2 = this.getArrowHead(Pt14e, Pt14e.angle(Pt13e), arrowsize);

    // Add Pt10 to the points array
    const Pt10 = this.getPointBySequence(10);
    if (Pt10) {
      // set the arrow point
      Pt10.x = Pt13e.x;
      Pt10.y = Pt13e.y;
    } else {
      // create the arrow point
      const pt10 = new Point(Pt13e.x, Pt13e.y);
      pt10.sequence = 10;
      this.points.push(pt10);
    }

    entities.push(arrowHead1, arrowHead2);
    return entities;
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
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
    file.writeGroupCode('3', this.dimensionStyle); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDbAlignedDimension', DXFFile.Version.R2000);
    file.writeGroupCode('13', Pt13.x); // X - start point of first extension line
    file.writeGroupCode('23', Pt13.y); // Y
    file.writeGroupCode('33', '0.0'); // Z
    file.writeGroupCode('14', Pt14.x); // X - start point of second extension line
    file.writeGroupCode('24', Pt14.y); // Y
    file.writeGroupCode('34', '0.0'); // Z
  }
}
