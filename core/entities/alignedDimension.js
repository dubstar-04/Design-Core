import { Strings } from '../lib/strings.js';
import { Line } from './line.js';
import { Text } from './text.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BaseDimension } from './baseDimension.js';
import { Point } from './point.js';

import { DesignCore } from '../designCore.js';
import { Utils } from '../lib/utils.js';

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
      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle();

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
  static getPointsFromSelection(items, textPos) {
    const points = [];
    const item = items[0];

    const Pt13 = item.points[0];
    Pt13.sequence = 13;
    points.push(Pt13);

    const Pt14 = item.points[1];
    Pt14.sequence = 14;
    points.push(Pt14);

    const Pt10 = new Point();
    Pt10.sequence = 10;

    const Pt11 = DesignCore.Mouse.pointOnScene();

    // generate the x and y delta values
    const dx = Pt14.x - Pt13.x;
    const dy = Pt14.y - Pt13.y;

    const pntPerp = Pt11.perpendicular(Pt13, Pt14);
    const isAligned = pntPerp.isOnLine(Pt13, Pt14);

    if (isAligned || Utils.round(dx) === 0 || Utils.round(dy) === 0) {
      // Perpendicular to the selected line or line is vertical or horizontal
      const projectionAngle = pntPerp.angle(Pt11);
      const distance = Pt11.distance(pntPerp);

      const projectedPoint = Pt14.project(projectionAngle, distance);
      Pt10.x = projectedPoint.x;
      Pt10.y = projectedPoint.y;
    } else {
      // Not perpendicular to the selected line: get the primary axis (x or y) and calculate the dimension
      const iX = ((Math.abs(Pt11.x - Pt13.x) + Math.abs(Pt14.x - Pt11.x)) - Math.abs(dx));
      const iY = ((Math.abs(Pt11.y - Pt13.y) + Math.abs(Pt14.y - Pt11.y)) - Math.abs(dy));

      if (iX >= iY && dy !== 0) {
        Pt10.x = Pt11.x;
        Pt10.y = Pt14.y;
      } else if (iX < iY && dx !== 0) {
        Pt10.x = Pt14.x;
        Pt10.y = Pt11.y;
      }
    }

    points.push(Pt10);
    return points;
  }

  /**
   * Build the dimension
   * @param {Object} style
   * @return {Array} - Array of entities that compose the dimension
   */
  buildDimension(style) {
    let dimension = 0;
    const entities = [];

    const Pt10 = this.getPointBySequence(this.points, 10);
    const Pt13 = this.getPointBySequence(this.points, 13);
    const Pt14 = this.getPointBySequence(this.points, 14);
    const Pt11 = this.getPointBySequence(this.points, 11);

    // DIMTIH inside text alignment
    const DIMTIH = this.getDimensionStyle().getValue('DIMTIH');
    // DIMTOH outside text alignment
    const DIMTOH = this.getDimensionStyle().getValue('DIMTOH');
    // Arrow size - use for extension line length
    const DIMASZ = this.getDimensionStyle().getValue('DIMASZ');
    // Text Size - use for extimated text width
    const DIMTXT = this.getDimensionStyle().getValue('DIMTXT');
    // Force Extension Line - If text outside extensions, force line extensions between extensions if nonzero
    const DIMTOFL = this.getDimensionStyle().getValue('DIMTOFL');
    // Text vertical position - 0 = Aligns text with the dimension line
    const DIMTAD = this.getDimensionStyle().getValue('DIMTAD');
    // Extend beyond dim line distance
    const DIMEXE = this.getDimensionStyle().getValue('DIMEXE');
    // Offset from origin distance
    const DIMEXO = this.getDimensionStyle().getValue('DIMEXO');
    // Justification of the dimension text
    const DIMJUST = this.getDimensionStyle().getValue('DIMJUST');

    // invalid points
    // if (Pt13.isSame(Pt14) || Pt13.isSame(Pt11) || Pt14.isSame(Pt11)) {
    //  return null;
    // }

    let Pt13e = new Point();
    const Pt14e = Pt10;

    // generate the x and y delta values
    const dx = Pt14.x - Pt13.x;
    const dy = Pt14.y - Pt13.y;

    // check if Line Pt13 -> P14 is perpendicular to Line Pt14 -> Pt10
    const m1 = (Pt14.y - Pt13.y) / (Pt14.x - Pt13.x);
    const m2 = (Pt14.y - Pt10.y) / (Pt14.x - Pt10.x);
    const perpendicular = Number((m1 * m2).toFixed(1));

    let isAligned = true;

    if (perpendicular !== -1.0) {
      isAligned = false;
    }

    if (isAligned || Utils.round(dx) === 0 || Utils.round(dy) === 0) {
      Pt13e = Pt13.project(Pt14.angle(Pt10), Pt14.distance(Pt10));
      dimension = Pt13.distance(Pt14);
    } else {
      // Not perpendicular to the selected line: get the primary axis (x or y) and calculate the dimension
      const iX = ((Math.abs(Pt10.x - Pt13.x) + Math.abs(Pt14.x - Pt10.x)) - Math.abs(dx));
      const iY = ((Math.abs(Pt10.y - Pt13.y) + Math.abs(Pt14.y - Pt10.y)) - Math.abs(dy));

      if (iX >= iY && dy !== 0) {
        Pt13e.x = Pt10.x;
        Pt13e.y = Pt13.y;
        dimension = dy;
      } else if (iX < iY && dx !== 0) {
        Pt13e.x = Pt13.x;
        Pt13e.y = Pt10.y;
        dimension = dx;
      }
    }

    const projectAngle = Pt13.angle(Pt13e);
    // const midPoint = Pt13e.midPoint(Pt14e);

    const formattedDimensionValue = this.getDimensionValue(dimension);
    // approximate text width based on height
    const approxTextWidth = Text.getApproximateWidth(formattedDimensionValue, DIMTXT);

    const midPoint = Pt13e.midPoint(Pt14e);
    let textPosition = midPoint;
    let textRotation = Pt13e.angle(Pt14e);

    switch (DIMJUST) {
      case 0:
        // 0 = Center-justified between extension lines
        break;
      case 1:
        // 1 = Next to first extension line
        textPosition = Pt13e;
        textPosition = Pt13e.project(Pt13e.angle(Pt14e), approxTextWidth * 0.75 + DIMASZ); // Offset text from the extension line
        // textRotation = Pt13e.angle(Pt14e);
        break;
      case 2:
        // 2 = Next to second extension line
        textPosition = Pt14e;
        textPosition = textPosition.project(Pt14e.angle(Pt13e), approxTextWidth * 0.75 + DIMASZ); // Offset text from the extension line
        // textRotation = Pt13e.angle(Pt14e);
        break;
      case 3:
        // 3 = Above first extension line
        textPosition = Pt13e.project(projectAngle, approxTextWidth * 0.5 + DIMEXE + DIMTXT);
        textRotation = textRotation + Math.PI / 2; // Rotate text 90 degrees
        break;
      case 4:
        // 4 = Above second extension line
        textPosition = Pt14e.project(projectAngle, approxTextWidth * 0.5 + DIMEXE + DIMASZ);
        textRotation = textRotation + Math.PI / 2; // Rotate text 90 degrees
        break;
    }

    // Get the dimension text using the value, position and rotation
    const text = this.getDimensionText(dimension, textPosition, textRotation);

    entities.push(text);

    const extLineOneStart = Pt13.project(projectAngle, DIMEXO);
    const extLineTwoStart = Pt14.project(projectAngle, DIMEXO);

    const extLineOneEnd = Pt13e.project(projectAngle, DIMEXE);
    const extLineTwoEnd = Pt14e.project(projectAngle, DIMEXE);

    // generate dimension line points
    const dimLineOneStart = Pt13e;
    const dimLineTwoStart = Pt14e;

    let dimLineOneEnd = textPosition.perpendicular(Pt13e, Pt14e);
    let dimLineTwoEnd = dimLineOneEnd;

    // split the dimension line when the text is centered vertically
    if (DIMTAD === 0 && DIMJUST <= 2) {
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

    const arrowHead1 = this.getArrowHead(Pt13e, Pt13e.angle(Pt14e));
    const arrowHead2 = this.getArrowHead(Pt14e, Pt14e.angle(Pt13e));

    const dimLine1 = new Line({ points: [dimLineOneStart, dimLineOneEnd] });
    // Supress dimension line 1 if DIMSD1 is true
    if (!style.getValue('DIMSD1')) {
      entities.push(dimLine1, arrowHead1);
    }

    const dimLine2 = new Line({ points: [dimLineTwoStart, dimLineTwoEnd] });
    // Supress dimension line 2 if DIMSD2 is true
    if (!style.getValue('DIMSD2')) {
      entities.push(dimLine2, arrowHead2);
    }

    return entities;
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    const Pt10 = this.getPointBySequence(this.points, 10);
    const Pt11 = this.getPointBySequence(this.points, 11);
    const Pt13 = this.getPointBySequence(this.points, 13);
    const Pt14 = this.getPointBySequence(this.points, 14);

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
