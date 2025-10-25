
import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Arc } from './arc.js';
import { Line } from './line.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BaseDimension } from './baseDimension.js';
import { Intersection } from '../lib/intersect.js';
import { Point } from './point.js';

import { Text } from './text.js'; // used to debug the dimension points

import { DesignCore } from '../designCore.js';

/**
 * Angular Dimension Entity Class
 * @extends BaseDimension
 */
export class AngularDimension extends BaseDimension {
  /**
   * Create an Angular Dimension
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
    const command = { command: 'AngularDimension', shortcut: 'DIMANG' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);

      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle();

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        const selection = await DesignCore.Scene.inputManager.requestInput(op);

        const line1 = DesignCore.Scene.getItem(selection.selectedItemIndex);

        const Pt15 = line1.points[0];
        Pt15.sequence = 15;
        this.points.push(Pt15);

        const Pt10 = line1.points[1];
        Pt10.sequence = 10;
        this.points.push(Pt10);

        DesignCore.Scene.selectionManager.reset();
      }

      const op1 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);


      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        const selection2 = await DesignCore.Scene.inputManager.requestInput(op1);

        const line2 = DesignCore.Scene.getItem(selection2.selectedItemIndex);

        const Pt13 = line2.points[0];
        Pt13.sequence = 13;
        this.points.push(Pt13);

        const Pt14 = line2.points[1];
        Pt14.sequence = 14;
        this.points.push(Pt14);

        DesignCore.Scene.selectionManager.reset();
      }

      const op2 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const Pt11 = await DesignCore.Scene.inputManager.requestInput(op2);
      Pt11.sequence = 11;
      this.points.push(Pt11);

      const Pt15 = this.points.find((point) => point === 15);
      const Pt10 = this.getPointBySequence(this.points, 10);

      const Pt16 = Pt11.perpendicular(Pt15, Pt10);
      Pt16.sequence = 16;
      this.points.push(Pt16);

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (this.points.length >= 4) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      mousePoint.sequence = 11;

      const Pt15 = this.getPointBySequence(this.points, 15);
      const Pt10 = this.getPointBySequence(this.points, 10);

      const Pt16 = mousePoint.perpendicular(Pt15, Pt10);
      Pt16.sequence = 16;

      const points = [...this.points, mousePoint, Pt16];
      DesignCore.Scene.createTempItem(this.type, { points: points });
    }
  }

  /**
   * Get sequenced points from user selection
   * @param {any} items
   * @return {Array} array of points
   */
  static getPointsFromSelection(items, textPos) {
  // Transform the items into points
  // Do nothing more than transform the items into points

    const points = [];
    const item1 = items[0];
    const item2 = items[1];

    const tempPt15 = item1.points[0];
    const tempPt10 = item1.points[1];

    const tempPt13 = item2.points[0];
    const tempPt14 = item2.points[1];

    // Check the lines intersect
    const intersect = Intersection.intersectLineLine({ start: tempPt15, end: tempPt10 }, { start: tempPt13, end: tempPt14 }, true);
    const intersectPt = intersect.points[0];

    if (intersectPt === undefined) {
      const err = 'Invalid selection - undefined origin';
      Logging.instance.warn(`${this.type} - ${err}`);
      return;
    }

    const Pt15 = new Point(tempPt15.x, tempPt15.y);
    Pt15.sequence = 15;
    points.push(Pt15);

    const Pt10 = new Point(tempPt10.x, tempPt10.y);
    Pt10.sequence = 10;
    points.push(Pt10);

    const Pt13 = new Point(tempPt13.x, tempPt13.y);
    Pt13.sequence = 13;
    points.push(Pt13);

    const Pt14 = new Point(tempPt14.x, tempPt14.y);
    Pt14.sequence = 14;
    points.push(Pt14);

    // Add text position
    const Pt11 = new Point(textPos.x, textPos.y);
    Pt11.sequence = 11;
    points.push(Pt11);

    // Add arc defining point
    // TODO: Pt16 should be 2/3 of the arc between pt10 and pt14
    const Pt16 = new Point(textPos.x, textPos.y);
    Pt16.sequence = 16;
    points.push(Pt16);

    return points;
  }


  /**
   *  Sort the dimension points
   * @return {Array} - Array of points sorted in the order required for the angular dimension
   */
  sortDimensionPoints() {
    // There are two definitions for angular dimensions;

    // --------------------
    // Type 2 - Angular Dimension
    // --------------------
    // Pt16 = Dimension line position
    // Pt11 = Text position
    // Pt13 = Additional extension line 1 start - Origin of dimension
    // Pt14 = Additional extension line 1 end
    // Pt15 = Additional extension line 2 start
    // Pt10 = Additional extension line 2 end

    // get the points by sequence
    let tempPt15 = this.getPointBySequence(this.points, 15); // Pt15 is second line start point
    let tempPt10 = this.getPointBySequence(this.points, 10); // Pt10 is the second line end point

    let tempPt13 = this.getPointBySequence(this.points, 13); // Pt13 is the first line start point
    let tempPt14 = this.getPointBySequence(this.points, 14); // Pt14 is the first line end point

    // Check the lines intersect
    const intersect = Intersection.intersectLineLine({ start: tempPt15, end: tempPt10 }, { start: tempPt13, end: tempPt14 }, true);
    const intersectPt = intersect.points[0];

    if (tempPt10.distance(intersectPt) < tempPt15.distance(intersectPt)) {
      const swapPt = tempPt10;
      tempPt10 = tempPt15;
      tempPt15 = swapPt;
    }

    if (tempPt14.distance(intersectPt) < tempPt13.distance(intersectPt)) {
      const swapPt = tempPt13;
      tempPt13 = tempPt14;
      tempPt14 = swapPt;
    }

    // Ensure points are in CCW order
    if (intersectPt.angle(tempPt10) < intersectPt.angle(tempPt14)) {
      let swapPt = tempPt15;
      tempPt15 = tempPt13;
      tempPt13 = swapPt;

      swapPt = tempPt10;
      tempPt10 = tempPt14;
      tempPt14 = swapPt;
    }

    const line1Angle = tempPt13.angle(tempPt14);
    const line2Angle = tempPt15.angle(tempPt10);
    const dimension = line2Angle - line1Angle;

    // Ensure points are in CCW order
    if (dimension > Math.PI) {
      let swapPt = tempPt15;
      tempPt15 = tempPt13;
      tempPt13 = swapPt;

      swapPt = tempPt10;
      tempPt10 = tempPt14;
      tempPt14 = swapPt;
    }

    const sortedPoints = [];
    const Pt15 = new Point(tempPt15.x, tempPt15.y);
    Pt15.sequence = 15;
    sortedPoints.push(Pt15);

    const Pt10 = new Point(tempPt10.x, tempPt10.y);
    Pt10.sequence = 10;
    sortedPoints.push(Pt10);

    const Pt13 = new Point(tempPt13.x, tempPt13.y);
    Pt13.sequence = 13;
    sortedPoints.push(Pt13);

    const Pt14 = new Point(tempPt14.x, tempPt14.y);
    Pt14.sequence = 14;
    sortedPoints.push(Pt14);

    return sortedPoints;
  }

  /**
   * Build the dimension
   * @param {Object} style
   * @return {Array} - Array of entities that compose the dimension
   */
  buildDimension(style) {
    // Build dimension based on type
    // Type 2 - Angular dimension
    // Type 5 - 3 Point Angular dimension - Not Supported

    //            10
    //  \        /
    //          /◤
    //    \    /   .
    //        /     .
    //     15/      . 11
    //     13\      .
    //        \    .
    //    /    \  .
    //          \◣
    //  /        \
    //             14

    let dimension = 0;
    const entities = [];

    const sortedPoints = this.sortDimensionPoints();

    // get the points by sequence
    const Pt13 = this.getPointBySequence(sortedPoints, 13); // Pt13 is the first line start point
    const Pt14 = this.getPointBySequence(sortedPoints, 14); // Pt14 is the first line end point
    const Pt15 = this.getPointBySequence(sortedPoints, 15); // Pt15 is second line start point
    const Pt10 = this.getPointBySequence(sortedPoints, 10); // Pt10 is the second line end point

    const Pt16 = this.getPointBySequence(this.points, 16); // Pt16 is the arc position
    const Pt11 = this.getPointBySequence(this.points, 11); // Pt11 is the text position

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
    // Gap between dimension line and text
    const DIMGAP = this.getDimensionStyle().getValue('DIMGAP');

    // Find the line intersection point
    const intersect = Intersection.intersectLineLine({ start: Pt15, end: Pt10 }, { start: Pt13, end: Pt14 }, true);
    const intersectPt = intersect.points[0];

    const radius = intersectPt.distance(Pt16);

    const quadOneStart = Pt14;
    const quadOneEnd = Pt10;
    const quadTwoStart = Pt14.rotate(intersectPt, Math.PI);
    const quadTwoEnd = Pt10.rotate(intersectPt, Math.PI);

    // Define the arrow positions
    let arrow1pos = intersectPt;
    let arrow2pos = intersectPt;

    // Define the line extents
    // These are required to determine if the extension lines are required
    // These extents change based on the quadrant the text is positioned
    let line1Extents = Pt14;
    let line2Extents = Pt10;

    // Check which quadrant Pt16 is positioned in
    // Quadrent One
    if (Pt16.isOnArc(quadOneStart, quadOneEnd, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadOneStart), radius);
      line1Extents = Pt14;
      arrow2pos = intersectPt.project(intersectPt.angle(quadOneEnd), radius);
      line2Extents = Pt10;
    }

    // Quadrent Two
    if (Pt16.isOnArc(quadOneEnd, quadTwoStart, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadOneEnd), radius);
      line1Extents = Pt10;
      arrow2pos = intersectPt.project(intersectPt.angle(quadTwoStart), radius);
      line2Extents = Pt13;
    }

    // Quadrent Three
    if (Pt16.isOnArc(quadTwoStart, quadTwoEnd, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadTwoStart), radius);
      line1Extents = Pt13;
      arrow2pos = intersectPt.project(intersectPt.angle(quadTwoEnd), radius);
      line2Extents = Pt15;
    }

    // Quadrent Four
    if (Pt16.isOnArc(quadTwoEnd, quadOneStart, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadTwoEnd), radius);
      line1Extents = Pt15;
      arrow2pos = intersectPt.project(intersectPt.angle(quadOneStart), radius);
      line2Extents = Pt14;
    }

    const line1Angle = intersectPt.angle(arrow1pos);
    const line2Angle = intersectPt.angle(arrow2pos);

    // calculate the dimension value
    dimension = line2Angle - line1Angle;

    if (dimension < 0) {
      dimension = dimension + Math.PI * 2;
    }

    // calculate the radians to mm conversion
    // Approximate text width based on height using the formatted dimension value i.e with units, precision and symbols
    const approxTextWidth = Text.getApproximateWidth(this.getDimensionValue(Utils.radians2degrees(dimension)), DIMTXT) * 1.25;// 1.25 is a factor to ensure the text is not too close to the arc
    const approxTextHalfWidth = approxTextWidth * 0.5;
    const circumference = 2 * Math.PI * radius;
    // calculate the radians per length unit - this allows converting between liniear and angular values. e.g. 10mm * radiansPerLengthUnit = xx radians
    const radiansPerLengthUnit = (2 * Math.PI) / circumference;
    // get arc adjustment for text width to allow splitting the dimension line
    const arcAdjustment = approxTextHalfWidth * radiansPerLengthUnit;
    // get angle consumed by an arrow
    const arrowRadians = DIMASZ * radiansPerLengthUnit;
    // Check if the text can fit inside extension lines
    const textOutSide = (approxTextWidth * 1.5) * radiansPerLengthUnit >= dimension;
    // Check if the arrows fit inside the extension lines
    const arrowsOutside = arrowRadians * 3 >= dimension;

    // DIMTIH - Text inside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
    // DIMTOH - Text outside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
    const horizontalText = (DIMTIH !== 0 && !textOutSide) || (DIMTOH !== 0 && textOutSide);

    const arcMiddle = intersectPt.project(intersectPt.angle(arrow1pos.midPoint(arrow2pos)), radius);
    let textPosition = arcMiddle;
    let textRotation = this.getTextDirection(horizontalText ? 0 : arrow1pos.angle(arrow2pos));
    // Get the direction for the dimension text offset
    let textAboveDirection = textRotation + Math.PI / 2;
    let textAboveDistance = DIMTXT * 0.5 + DIMGAP;

    // get the direction to offset outside the extension lines
    const outsideOffsetDirection = Pt11.distance(arrow1pos) < Pt11.distance(arrow2pos) ? -1 : 1;

    // Angle from arrow to rotate text position to place in next to an extension line inside
    const textPositionOffsetAngle = arrowRadians * 3;
    // Angle from arc middle to rotate text position to place in next to an extension line inside
    const internalPositionAdjustmentAngle = dimension * 0.5 > textPositionOffsetAngle ? dimension * 0.5 - textPositionOffsetAngle : 0;
    // Angle from arc middle to rotate text position to place in next to an extension line outside
    const externalPositionAdjustmentAngle = dimension * 0.5 + textPositionOffsetAngle;


    switch (DIMJUST) {
      case 0: // 0 = Center-justified between extension lines
        if (textOutSide) {
          textPosition = arcMiddle.rotate(intersectPt, externalPositionAdjustmentAngle * outsideOffsetDirection);
        }
        break;
      case 1: // 1 = Next to first extension line
        if (textOutSide) {
          textPosition = arcMiddle.rotate(intersectPt, externalPositionAdjustmentAngle * outsideOffsetDirection);
        } else {
          textPosition = arcMiddle.rotate(intersectPt, internalPositionAdjustmentAngle);
          textRotation = this.getTextDirection(horizontalText ? 0 : (intersectPt.angle(textPosition) + Math.PI / 2));
        }
        break;
      case 2: // 2 = Next to second extension line
        if (textOutSide) {
          textPosition = arcMiddle.rotate(intersectPt, (dimension * 0.5 + DIMASZ * 2* radiansPerLengthUnit) * outsideOffsetDirection);
        } else {
          textPosition = arcMiddle.rotate(intersectPt, -internalPositionAdjustmentAngle);
          textRotation = this.getTextDirection(horizontalText ? 0 : (intersectPt.angle(textPosition) + Math.PI / 2));
        }
        break;
      case 3: // 3 = Above first extension line
        textPosition = arrow1pos.project(line1Angle, (approxTextHalfWidth+ DIMEXE + DIMTXT));
        textRotation = this.getTextDirection(line1Angle);
        textAboveDirection = textRotation + Math.PI / 2;
        break;
      case 4: // 4 = Above second extension line
        textPosition = arrow2pos.project(line2Angle, (approxTextHalfWidth+ DIMEXE + DIMTXT));
        textRotation = this.getTextDirection(line2Angle);
        textAboveDirection = textRotation + Math.PI / 2;
        break;
    }


    // Check if the text is aligned with the dimension line
    const textAndDimlineAligned = this.alignedOrOpposite(textRotation, (intersectPt.angle(textPosition) + Math.PI / 2));

    // Check if the text position is on an extension line
    const textIsOnExtensionLine = textPosition.perpendicular(intersectPt, arrow1pos).isSame(textPosition) || textPosition.perpendicular(intersectPt, arrow2pos).isSame(textPosition);

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


    // Get the dimension text using the value, position and rotation
    const text = this.getDimensionText(Utils.radians2degrees(dimension), textPosition, textRotation);
    entities.push(text);

    // get the projection of the text position onto the dimension line (arc)
    const textDimlineIntersection = intersectPt.project(intersectPt.angle(textPosition), radius);

    // check if the text position projection is on the dimension line (arc)
    // const textDimlineIntersectionIsOnDimline = textDimlineIntersection.isOnArc(arrow1pos, arrow2pos, intersectPt, 1);

    // check if the text position projection is on the dimension line (arc)
    const textIsOnDimLine = Utils.round(intersectPt.distance(textPosition)) === Utils.round(radius);
    // check if text is on extenstion line one
    const textIsOnExtensionLineOne = textPosition.perpendicular(intersectPt, arrow1pos).isSame(textPosition);
    // check if text is on extenstion line two
    const textIsOnExtensionLineTwo = textPosition.perpendicular(intersectPt, arrow2pos).isSame(textPosition);
    // check if text is aligned with extension line one
    const textAndExtlineOneAligned = this.alignedOrOpposite(textRotation, intersectPt.angle(arrow1pos));
    // check if text is aligned with extension line two
    const textAndExtlineTwoAligned = this.alignedOrOpposite(textRotation, intersectPt.angle(arrow2pos));


    /*
    // generate dimension geometry
    */

    /*
    // Create the arrow heads
    */
    // Arrow alignement - Calculate the distance from the arc tangent to the arc at <arrow size> along the tangent
    const arcOffset = radius - Math.sqrt(radius * radius - DIMASZ * DIMASZ);
    // Calculate the angle from the arc tangent (perpendicular to the extension line) to the arc at <arrow size> along the tangent
    const arcRotationOffset = Math.asin(arcOffset / DIMASZ);
    // Calculate the arrow head rotation to align with the arc - Reversed when the arrows are outside the extension lines
    const arrowRotation = arrowsOutside ? -Math.PI / 2 - arcRotationOffset : Math.PI / 2 + arcRotationOffset;
    const arrowHead1 = this.getArrowHead(arrow1pos, intersectPt.angle(arrow1pos) + arrowRotation);
    const arrowHead2 = this.getArrowHead(arrow2pos, intersectPt.angle(arrow2pos) - arrowRotation);

    /*
    // Add the entities to the dimension
    */

    // define where the the dim line arcs meet
    const arcStart = textIsOnDimLine ? textDimlineIntersection : arcMiddle;

    // create the dimension line / arc
    const arcOneBase = arrowsOutside ? arrow1pos : !textOutSide ? arcStart : arcMiddle;
    const arcOneRotation = arrowsOutside ? (-arrowRadians * 2) : ((textIsOnDimLine && !textOutSide) ? -arcAdjustment : 0);
    const arcOneEnd = arcOneBase.rotate(intersectPt, arcOneRotation);
    const arcOne = new Arc({ points: [intersectPt, arrow1pos, arcOneEnd], direction: arrowsOutside ? -1 : 1 });
    // Supress dimension line 1 if DIMSD1 is true
    if (!style.getValue('DIMSD1')) {
      entities.push(arrowHead1);
      entities.push(arcOne);
    }

    // create the dimension line / arc
    const arcTwoBase = arrowsOutside ? arrow2pos : !textOutSide ? arcStart : arcMiddle;
    const arcTwoRotation = arrowsOutside ? (arrowRadians * 2) : ((textIsOnDimLine && !textOutSide) ? arcAdjustment : 0);
    const arcTwoEnd = arcTwoBase.rotate(intersectPt, arcTwoRotation);
    const arcTwo = new Arc({ points: [intersectPt, arrow2pos, arcTwoEnd], direction: arrowsOutside ? 1 : -1 });
    // Supress dimension line 2 if DIMSD2 is true
    if (!style.getValue('DIMSD2')) {
      entities.push(arrowHead2);
      entities.push(arcTwo);
    }


    /*
    // generate extension line points
    */

    // create extension line one points
    const extensionLineOneStart = intersectPt.project(intersectPt.angle(arrow1pos), intersectPt.distance(line1Extents) + DIMEXO);
    let extensionLineOneEnd = intersectPt.project(intersectPt.angle(arrow1pos), radius + DIMEXE);
    // create extension line two points
    const extensionLineTwoStart = intersectPt.project(intersectPt.angle(arrow2pos), intersectPt.distance(line2Extents) + DIMEXO);
    let extensionLineTwoEnd = intersectPt.project(intersectPt.angle(arrow2pos), radius + DIMEXE);


    // Extend the extension line when text is aligned with the extension line but not on the extension line
    if (textPosition.distance(arrow1pos) < textPosition.distance(arrow2pos)) {
      // Text position is closer to extension line 1
      if (!textIsOnExtensionLineOne && textAndExtlineOneAligned && !textIsOnDimLine) {
        const dist = extensionLineOneEnd.distance(textPosition.perpendicular(extensionLineOneStart, extensionLineOneEnd)) + approxTextHalfWidth;
        extensionLineOneEnd = extensionLineOneEnd.project(extensionLineOneStart.angle(extensionLineOneEnd), dist);
      }
    } else {
      // Text position is closer to extension line 2
      if (!textIsOnExtensionLineTwo && textAndExtlineTwoAligned && !textIsOnDimLine) {
        const dist = extensionLineTwoEnd.distance(textPosition.perpendicular(extensionLineTwoStart, extensionLineTwoEnd)) + approxTextHalfWidth;
        extensionLineTwoEnd = extensionLineTwoEnd.project(extensionLineTwoStart.angle(extensionLineTwoEnd), dist);
      }
    }

    // check if the dimension is beyond the limits of the selection
    // add extension line one
    if (radius > intersectPt.distance(line1Extents) + DIMEXE) {
      const extensionLineOne = new Line({ points: [extensionLineOneStart, extensionLineOneEnd] });
      // Supress extension line 1 if DIMS1 is true
      if (!style.getValue('DIMSE1')) {
        entities.push(extensionLineOne);
      }
    }

    // check if the dimension is beyond the limits of the selection
    // add extension line two
    if (radius > intersectPt.distance(line2Extents) + DIMEXE) {
      const extensionLineTwo = new Line({ points: [extensionLineTwoStart, extensionLineTwoEnd] });
      // Supress extendsion line 2 if DIMSE2 is true
      if (!style.getValue('DIMSE2')) {
        entities.push(extensionLineTwo);
      }
    }


    // debug
    /*
    if (false) {
      const pt10Text = new Text();
      pt10Text.string = 'pt10';
      pt10Text.points = [Pt10];
      entities.push(pt10Text);

      const pt13Text = new Text();
      pt13Text.string = 'pt13';
      pt13Text.points = [Pt13];
      entities.push(pt13Text);

      const pt14Text = new Text();
      pt14Text.string = 'pt14';
      pt14Text.points = [Pt14];
      entities.push(pt14Text);

      const pt15Text = new Text();
      pt15Text.string = 'pt15';
      pt15Text.points = [Pt15];
      entities.push(pt15Text);

      const pt16Text = new Text();
      pt16Text.string = 'pt16';
      pt16Text.points = [Pt16];
      entities.push(pt16Text);

      const q2s = new Text();
      q2s.string = 'q2s';
      q2s.points = [quadTwoStart];
      entities.push(q2s);

      const q2e = new Text();
      q2e.string = 'q2e';
      q2e.points = [quadTwoEnd];
      entities.push(q2e);
    }
    */

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
    const Pt15 = this.getPointBySequence(this.points, 15);
    const Pt16 = Pt11; // this.getPointBySequence(this.points, 16);

    file.writeGroupCode('0', 'DIMENSION');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimension', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    // file.writeGroupCode('2', this.blockName); // Block not required
    file.writeGroupCode('10', Pt10.x); // X - Start of Dimension Line
    file.writeGroupCode('20', Pt10.y); // Y
    file.writeGroupCode('30', '0.0'); // Z
    file.writeGroupCode('11', Pt11.x); // X - Text Midpoint
    file.writeGroupCode('21', Pt11.y); // Y
    file.writeGroupCode('31', '0.0'); // Z
    file.writeGroupCode('70', this.dimType); // DIMENSION TYPE
    file.writeGroupCode('3', this.dimensionStyle); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDb2LineAngularDimension', DXFFile.Version.R2000);
    file.writeGroupCode('13', Pt13.x); // X
    file.writeGroupCode('23', Pt13.y); // Y
    file.writeGroupCode('33', '0.0'); // Z
    file.writeGroupCode('14', Pt14.x); // X
    file.writeGroupCode('24', Pt14.y); // Y
    file.writeGroupCode('34', '0.0'); // Z
    file.writeGroupCode('15', Pt15.x); // X
    file.writeGroupCode('25', Pt15.y); // Y
    file.writeGroupCode('35', '0.0'); // Z
    file.writeGroupCode('16', Pt16.x); // X
    file.writeGroupCode('26', Pt16.y); // Y
    file.writeGroupCode('36', '0.0'); // Z
  }
}
