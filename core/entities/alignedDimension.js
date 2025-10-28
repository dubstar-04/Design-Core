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
    this.dimType.setDimType(1); // Aligned dimension
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'AlignedDimension', shortcut: 'DIMALI' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle();

      this.dimType.setDimType(1); // Aligned dimension

      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt13 = await DesignCore.Scene.inputManager.requestInput(op);
      pt13.sequence = 13;
      this.points.push(pt13);

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt14 = await DesignCore.Scene.inputManager.requestInput(op1);
      pt14.sequence = 14;
      this.points.push(pt14);

      const op2 = new PromptOptions(Strings.Input.DIMENSION, [Input.Type.POINT]);
      const pt11 = await DesignCore.Scene.inputManager.requestInput(op2);
      pt11.sequence = 11;
      this.points.push(pt11);

      const tempLine = new Line({ points: [pt13, pt14] });
      this.points = AlignedDimension.getPointsFromSelection([tempLine], pt11);

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
      const pt11 = DesignCore.Mouse.pointOnScene();
      pt11.sequence = 11;
      const tempLine = new Line({ points: [...this.points] });
      const points = AlignedDimension.getPointsFromSelection([tempLine], pt11);
      DesignCore.Scene.createTempItem(this.type, { points: points, dimensionStyle: this.dimensionStyle });
    }
  }

  /**
   * Get sequenced points from user selection
   * @param {any} items
   * @param {Point} textPos
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

    const Pt11 = textPos;
    Pt11.sequence = 11;
    points.push(Pt11);

    // generate the x and y delta values
    const dx = Pt14.x - Pt13.x;
    const dy = Pt14.y - Pt13.y;

    /*
    const isCoincident = Pt11.isOnLine(Pt13, Pt14);

    if (isCoincident) {
      // Text point is coincident with the line, move it off the line
      Pt11 = Pt11.project(Pt13.angle(Pt14) + Math.PI / 2, 10);
    }
    */

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

    // Style values
    const DIMTIH = this.getDimensionStyle().getValue('DIMTIH'); // Text inside horizontal alignment
    const DIMTOH = this.getDimensionStyle().getValue('DIMTOH'); // Text outside horizontal alignment
    const DIMASZ = this.getDimensionStyle().getValue('DIMASZ'); // Arrow size (used for extension line length)
    const DIMTXT = this.getDimensionStyle().getValue('DIMTXT'); // Text size (used for estimated text width)
    // const DIMTOFL = this.getDimensionStyle().getValue('DIMTOFL'); // Force extension line if text outside
    const DIMTAD = this.getDimensionStyle().getValue('DIMTAD'); // Text vertical position
    const DIMEXE = this.getDimensionStyle().getValue('DIMEXE'); // Extend beyond dimension line distance
    const DIMEXO = this.getDimensionStyle().getValue('DIMEXO'); // Offset from origin distance
    const DIMJUST = this.getDimensionStyle().getValue('DIMJUST'); // Justification of the dimension text
    const DIMGAP = this.getDimensionStyle().getValue('DIMGAP'); // Gap between dimension line and text
    const DIMSE1 = this.getDimensionStyle().getValue('DIMSE1'); // Suppress first extension line
    const DIMSE2 = this.getDimensionStyle().getValue('DIMSE2'); // Suppress second extension line
    const DIMSD1 = this.getDimensionStyle().getValue('DIMSD1'); // Suppress first dimension line
    const DIMSD2 = this.getDimensionStyle().getValue('DIMSD2'); // Suppress second dimension line

    // invalid points
    if (Pt13.isSame(Pt14) || Pt11.closestPointOnLine(Pt13, Pt14).distance(Pt11) < DIMEXO) {
      /* Pt13.distance(Pt11) < DIMEXO || Pt14.distance(Pt11) < DIMEXO ||*/
      return;
    }

    let Pt13e = new Point();
    const Pt14e = Pt10;

    // generate the x and y delta values
    const dx = Pt14.x - Pt13.x;
    const dy = Pt14.y - Pt13.y;

    // check if Line Pt13 -> P14 is perpendicular to Line Pt14 -> Pt10
    const m1 = (Pt14.y - Pt13.y) / (Pt14.x - Pt13.x);
    const m2 = (Pt14.y - Pt10.y) / (Pt14.x - Pt10.x);
    const perpendicular = Number((m1 * m2).toFixed(1));

    const isAligned = perpendicular !== -1.0 ? false : true;

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

    // ensure dimension is positive
    dimension = Math.abs(dimension);

    const extensionLineAngle = Pt13.angle(Pt13e);
    // const reverseExtensionLineAngle = Pt13e.angle(Pt13);
    const dimLineAngle = Pt13e.angle(Pt14e);
    const reverseDimLineAngle = Pt14e.angle(Pt13e);
    const midPoint = Pt13e.midPoint(Pt14e);

    // Approximate text width based on height using the formatted dimension value i.e with units, precision and symbols
    const approxTextWidth = Text.getApproximateWidth(this.getDimensionValue(dimension), DIMTXT);
    const approxTextHalfWidth = approxTextWidth * 0.5;

    // Check if the text can fit inside extension lines
    const textOutSide = (approxTextWidth * 1.5 + DIMASZ * 2) >= dimension;
    // Check if the arrows fit inside the extension lines
    const arrowsOutSide = (DIMASZ * 3) >= dimension;

    // DIMTIH - Text inside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
    // DIMTOH - Text outside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
    const horizontalText = (DIMTIH !== 0 && !textOutSide) || (DIMTOH !== 0 && textOutSide);

    let textPosition = midPoint;
    let textRotation = this.getTextDirection(horizontalText ? 0 : dimLineAngle);
    // Get the direction for the dimension text offset
    let textAboveDirection = textRotation + Math.PI / 2;
    let textAboveDistance = DIMTXT * 0.5 + DIMGAP;

    // get the distance to offset outside the extension lines
    let outsideOffsetDistance = 0;
    if (textOutSide) {
      outsideOffsetDistance = (dimension + approxTextWidth) * 0.5 + DIMASZ + DIMEXE;
      if (arrowsOutSide) {
        outsideOffsetDistance += DIMASZ; // Add extra offset if arrows are outside
      }
    }

    // get the direction to offset outside the extension lines
    const outsideOffsetDirection = Pt11.distance(Pt13e) < Pt11.distance(Pt14e) ? reverseDimLineAngle : dimLineAngle;

    switch (DIMJUST) {
      case 0: // 0 = Center-justified between extension lines
        if (textOutSide) {
          textPosition = midPoint.project(outsideOffsetDirection, outsideOffsetDistance);
        }
        break;
      case 1: // 1 = Next to first extension line
        if (textOutSide) {
          textPosition = midPoint.project(outsideOffsetDirection, outsideOffsetDistance);
        } else {
          textPosition = Pt13e.project(dimLineAngle, approxTextWidth * 0.75 + DIMASZ);
        }
        break;
      case 2: // 2 = Next to second extension line
        if (textOutSide) {
          textPosition = midPoint.project(outsideOffsetDirection, outsideOffsetDistance);
        } else {
          textPosition = Pt14e.project(reverseDimLineAngle, approxTextWidth * 0.75 + DIMASZ);
        }
        break;
      case 3: // 3 = Above first extension line
        textPosition = Pt13e.project(extensionLineAngle, approxTextHalfWidth+ DIMEXE + DIMTXT);
        textRotation = this.getTextDirection(extensionLineAngle);
        textAboveDirection = textRotation + Math.PI / 2;
        break;
      case 4: // 4 = Above second extension line
        textPosition = Pt14e.project(extensionLineAngle, approxTextHalfWidth+ DIMEXE + DIMASZ);
        textRotation = this.getTextDirection(extensionLineAngle);
        textAboveDirection = textRotation + Math.PI / 2;
        break;
    }

    // Check if the text is aligned with the dimension line
    const textAndDimlineAligned = this.alignedOrOpposite(textRotation, dimLineAngle);

    // Check if the text is aligned with the extension line
    const textAndExtlineAligned = this.alignedOrOpposite(textRotation, extensionLineAngle );

    // Check if the text position is on an extension line
    let textIsOnExtensionLine = textPosition.perpendicular(Pt13, Pt13e).isSame(textPosition) || textPosition.perpendicular(Pt14, Pt14e).isSame(textPosition);

    // set the text offset to 0 for scenarios where the text offset should not be applied
    if (!textAndDimlineAligned && !textIsOnExtensionLine) {
      textAboveDistance = 0;
    }

    // DIMTAD - Text vertical position
    switch (DIMTAD) {
      case 0: // 0 = Centers the dimension text between the extension lines.
        break;
      case 1: // 1 = Places the dimension text above the dimension line except when the dimension line is not horizontal and text inside the extension lines is forced horizontal ( DIMTIH = 1).
        textPosition = textPosition.project(textAboveDirection, textAboveDistance);
        break;
      case 2: // 2 = Places the dimension text on the side of the dimension line farthest away from the defining points.
        textPosition = textPosition.project(textAboveDirection, textAboveDistance);
        break;
      case 3: // 3 = Places the dimension text to conform to Japanese Industrial Standards (JIS).
        textPosition = textPosition.project(textAboveDirection, textAboveDistance);
        break;
      case 4: // 4 = Places the dimension text below the dimension line.
        textPosition = textPosition.project(textAboveDirection, -textAboveDistance);
        break;
    }


    /*
    // generate the dimension text
    */
    // Get the dimension text using the value, position and rotation
    const text = this.getDimensionText(dimension, textPosition, textRotation);
    entities.push(text);

    /*
    // Generate points for extension and dimension lines
    */
    // Get the extension line start and end points
    // TODO: If DIMTOFL is set force line extensions between extensions if text outside
    const extLineOneStart = Pt13.project(extensionLineAngle, DIMEXO);
    const extLineTwoStart = Pt14.project(extensionLineAngle, DIMEXO);

    let extLineOneEnd = Pt13e.project(extensionLineAngle, DIMEXE);
    let extLineTwoEnd = Pt14e.project(extensionLineAngle, DIMEXE);

    /*
    // generate dimension line points
    */

    // get the perpendicular projection of the text position onto the dimension line
    const textDimlineIntersection = textPosition.perpendicular(Pt13e, Pt14e);
    // check if the perpendicular projection is on the dimension line
    const textDimlineIntersectionIsOnDimline = textDimlineIntersection.isOnLine(Pt13e, Pt14e);
    // Check if the text position is on the dimension line
    const textIsOnInternalDimLine = textPosition.isOnLine(Pt13e, Pt14e);
    // Check if the text position is on an extension line
    textIsOnExtensionLine = textPosition.perpendicular(Pt13, Pt13e).isSame(textPosition) || textPosition.perpendicular(Pt14, Pt14e).isSame(textPosition);

    let dimLineOneStart = Pt13e;
    let dimLineOneEnd = textDimlineIntersectionIsOnDimline ? textDimlineIntersection : midPoint;

    let dimLineTwoStart = Pt14e;
    let dimLineTwoEnd = dimLineOneEnd;

    // Extend dimension line when text is outside the extension lines
    if (!textDimlineIntersectionIsOnDimline && textAndDimlineAligned) {
      if (!arrowsOutSide) { // Arrows are inside the extension lines
        dimLineOneEnd = midPoint;
        dimLineTwoEnd = midPoint;
      } else { // Arrows are outside the extension lines
        dimLineOneEnd = Pt13e;
        dimLineTwoEnd = Pt14e;
      }
      // get the distance to extend the dimension line
      // when text is vertically centered trim the dimension line back from the text position
      // when text is not vertically centered extend the dimension line beyond the text position by half the text width
      const dimlineExtendDistance = textDimlineIntersection.isSame(textPosition) ? approxTextHalfWidth + DIMGAP : -approxTextHalfWidth;

      if (Pt11.distance(Pt13e) < Pt11.distance(Pt14e)) {
        // Text position is closer to extension line 1
        dimLineOneStart = textDimlineIntersection.project(dimLineAngle, dimlineExtendDistance);
      } else {
        // Text position is closer to extension line 2
        dimLineTwoStart = textDimlineIntersection.project(reverseDimLineAngle, dimlineExtendDistance);
      }
    }

    // split the dimension line when the text is centered vertically
    if (textIsOnInternalDimLine) {
      dimLineOneEnd = dimLineOneEnd.project(reverseDimLineAngle, approxTextWidth * 0.6);
      dimLineTwoEnd = dimLineTwoEnd.project(dimLineAngle, approxTextWidth * 0.6);
    }

    /*
    // generate extension line points
    */

    // Extend the extension line when text is aligned with the extension line but not on the extension line
    if (textAndExtlineAligned && !textIsOnExtensionLine && !textIsOnInternalDimLine) {
      if (textPosition.distance(Pt13e) < textPosition.distance(Pt14e)) {
        // Text position is closer to extension line 1
        const dist = extLineOneEnd.distance(textPosition.perpendicular(Pt13, Pt13e)) + approxTextHalfWidth;
        extLineOneEnd = extLineOneEnd.project(extensionLineAngle, dist);
      } else {
        // Text position is closer to extension line 2
        const dist = extLineTwoEnd.distance(textPosition.perpendicular(Pt14, Pt14e)) + approxTextHalfWidth;
        extLineTwoEnd = extLineTwoEnd.project(extensionLineAngle, dist);
      }
    }

    /*
    // generate dimension geometry
    */
    const extLine1 = new Line({ points: [extLineOneStart, extLineOneEnd] });
    // Supress extension line 1 if DIMS1 is true
    if (!DIMSE1) {
      entities.push(extLine1);
    }

    const extLine2 = new Line({ points: [extLineTwoStart, extLineTwoEnd] });
    // Supress extendsion line 2 if DIMSE2 is true
    if (!DIMSE2) {
      entities.push(extLine2);
    }

    const arrowHead1 = this.getArrowHead(Pt13e, arrowsOutSide ? reverseDimLineAngle : dimLineAngle);
    const arrowHead2 = this.getArrowHead(Pt14e, arrowsOutSide ? dimLineAngle : reverseDimLineAngle);

    const dimLine1 = new Line({ points: [dimLineOneStart, dimLineOneEnd] });
    // Supress dimension line 1 if DIMSD1 is true
    if (!DIMSD1) {
      entities.push(dimLine1, arrowHead1);
    }

    const dimLine2 = new Line({ points: [dimLineTwoStart, dimLineTwoEnd] });
    // Supress dimension line 2 if DIMSD2 is true
    if (!DIMSD2) {
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
    file.writeGroupCode('70', this.dimType.getDimType()); // DIMENSION TYPE
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
