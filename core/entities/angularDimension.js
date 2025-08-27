
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

    const Pt11 = new Point(textPos.x, textPos.y);
    Pt11.sequence = 11;
    points.push(Pt11);

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

    // Type 2 - Angular dimension
    let dimension = 0;
    const entities = [];

    const sortedPoints = this.sortDimensionPoints();

    // get the points by sequence
    const Pt13 = this.getPointBySequence(sortedPoints, 13); // Pt13 is the first line start point
    const Pt14 = this.getPointBySequence(sortedPoints, 14); // Pt14 is the first line end point
    const Pt15 = this.getPointBySequence(sortedPoints, 15); // Pt15 is second line start point
    const Pt10 = this.getPointBySequence(sortedPoints, 10); // Pt10 is the second line end point

    // Temp use 11, should be pt16
    // const Pt16 = this.getPointBySequence(this.points, 11); // Pt16 is the arc position
    const Pt11 = this.getPointBySequence(this.points, 11); // Pt11 is the text position

    // Find the line intersection point
    const intersect = Intersection.intersectLineLine({ start: Pt15, end: Pt10 }, { start: Pt13, end: Pt14 }, true);
    const intersectPt = intersect.points[0];

    const distance = intersectPt.distance(Pt11);

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

    // Check which quadrant the text is positioned in
    // Quadrent One
    if (Pt11.isOnArc(quadOneStart, quadOneEnd, intersectPt, 1)) {
      // console.log('Pt11 is on arc quad One');
      arrow1pos = intersectPt.project(intersectPt.angle(quadOneStart), distance);
      line1Extents = Pt14;
      arrow2pos = intersectPt.project(intersectPt.angle(quadOneEnd), distance);
      line2Extents = Pt10;
    }

    // Quadrent Two
    if (Pt11.isOnArc(quadOneEnd, quadTwoStart, intersectPt, 1)) {
      // console.log('Pt11 is on arc quad Two');
      arrow1pos = intersectPt.project(intersectPt.angle(quadOneEnd), distance);
      line1Extents = Pt10;
      arrow2pos = intersectPt.project(intersectPt.angle(quadTwoStart), distance);
      line2Extents = Pt13;
    }

    // Quadrent Three
    if (Pt11.isOnArc(quadTwoStart, quadTwoEnd, intersectPt, 1)) {
      // console.log("Pt11 is on arc quad Three");
      arrow1pos = intersectPt.project(intersectPt.angle(quadTwoStart), distance);
      line1Extents = Pt13;
      arrow2pos = intersectPt.project(intersectPt.angle(quadTwoEnd), distance);
      line2Extents = Pt15;
    }

    // Quadrent Four
    if (Pt11.isOnArc(quadTwoEnd, quadOneStart, intersectPt, 1)) {
      // console.log('Pt11 is on arc quad Four');
      arrow1pos = intersectPt.project(intersectPt.angle(quadTwoEnd), distance);
      line1Extents = Pt15;
      arrow2pos = intersectPt.project(intersectPt.angle(quadOneStart), distance);
      line2Extents = Pt14;
    }

    const line1Angle = intersectPt.angle(arrow1pos);
    const line2Angle = intersectPt.angle(arrow2pos);

    // calculate the dimension value
    dimension = line2Angle - line1Angle;

    if (dimension < 0) {
      dimension = dimension + Math.PI * 2;
    }

    const arcMiddle = intersectPt.project(intersectPt.angle(arrow1pos.midPoint(arrow2pos)), distance);
    const textPosition = arcMiddle;

    let textRotation = 0;
    if (this.getDimensionStyle().getValue('DIMTOH') === 0) {
    // DIMTIH - Text inside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
    // DIMTOH - Text outside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
      textRotation = arrow1pos.angle(arrow2pos);
    }

    // Get the dimension text using the value, position and rotation
    const text = this.getDimensionText(Utils.radians2degrees(dimension), textPosition, textRotation);
    entities.push(text);

    // Create the arrow heads
    const arrowsize = this.getDimensionStyle().getValue('DIMASZ');
    // Arrow alignement - Calculate the distance from the arc tangent to the arc at <arrow size> along the tangent
    const arcOffset = distance - Math.sqrt(distance * distance - arrowsize * arrowsize);
    // Calculate the angle from the arc tangent (perpendicular to the extension line) to the arc at <arrow size> along the tangent
    const arcRotationOffset = Math.asin(arcOffset / arrowsize);
    // Calculate the arrow head rotation to align with the arc
    const arrowRotation = Math.PI / 2 + arcRotationOffset;
    const arrowHead1 = this.getArrowHead(arrow1pos, intersectPt.angle(arrow1pos) + arrowRotation);
    const arrowHead2 = this.getArrowHead(arrow2pos, intersectPt.angle(arrow2pos) - arrowRotation);

    // Add the entities to the dimension
    // calculate the radians to mm conversion
    // circumference = 2*PI*radius
    // approximate text width based on height
    const approxTextWidth = Text.getApproximateWidth(text.string, text.height) * 1.25;// 1.25 is a factor to ensure the text is not too close to the arc
    const circumference = 2 * Math.PI * distance;
    const circumferencePerRadian = (2 * Math.PI) / circumference;
    const arcAdjustment = (approxTextWidth / 2) * circumferencePerRadian;

    // create the dimension line / arc
    const arcOneEnd = arcMiddle.rotate(intersectPt, -arcAdjustment);
    const arcOne = new Arc({ points: [intersectPt, arrow1pos, arcOneEnd] });
    // Supress dimension line 1 if DIMSD1 is true
    if (!style.getValue('DIMSD1')) {
      entities.push(arrowHead1, arcOne);
    }

    // create the dimension line / arc
    const arcTwoEnd = arcMiddle.rotate(intersectPt, arcAdjustment);
    const arcTwo = new Arc({ points: [intersectPt, arcTwoEnd, arrow2pos] });
    // Supress dimension line 2 if DIMSD2 is true
    if (!style.getValue('DIMSD2')) {
      entities.push(arrowHead2, arcTwo);
    }

    // debug
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

      const q2s = new Text();
      q2s.string = 'q2s';
      q2s.points = [quadTwoStart];
      entities.push(q2s);

      const q2e = new Text();
      q2e.string = 'q2e';
      q2e.points = [quadTwoEnd];
      entities.push(q2e);
    }

    // generate extension line points
    // get style properties
    const extension = style.getValue('DIMEXE');
    const offset = style.getValue('DIMEXO');

    // check if the dimension is beyond the limits of the selection
    // add extension line one
    if (distance > intersectPt.distance(line1Extents) + extension) {
      const extensionLineOneStart = intersectPt.project(intersectPt.angle(arrow1pos), intersectPt.distance(line1Extents) + offset);
      const extensionLineOneEnd = intersectPt.project(intersectPt.angle(arrow1pos), distance + extension);
      const extensionLineOne = new Line({ points: [extensionLineOneStart, extensionLineOneEnd] });
      // Supress extension line 1 if DIMS1 is true
      if (!style.getValue('DIMSE1')) {
        entities.push(extensionLineOne);
      }
    }

    // check if the dimension is beyond the limits of the selection
    // add extension line two
    if (distance > intersectPt.distance(line2Extents) + extension) {
      const extensionLineTwoStart = intersectPt.project(intersectPt.angle(arrow2pos), intersectPt.distance(line2Extents) + offset);
      const extensionLineTwoEnd = intersectPt.project(intersectPt.angle(arrow2pos), distance + extension);
      const extensionLineTwo = new Line({ points: [extensionLineTwoStart, extensionLineTwoEnd] });
      // Supress extendsion line 2 if DIMSE2 is true
      if (!style.getValue('DIMSE2')) {
        entities.push(extensionLineTwo);
      }
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
