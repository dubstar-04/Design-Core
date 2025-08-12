
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

      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle()

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
      const Pt10 = this.getPointBySequence(10);

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

      const Pt15 = this.getPointBySequence(15);
      const Pt10 = this.getPointBySequence(10);

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
  static getPointsFromSelection(items) {
    // There are two definitions for angular dimensions; with and without additional extension lines
    // --------------------
    // Type 5 - 3 Point Angular Dimension - Without additional extension lines (5 Points)
    // --------------------
    // Pt10 = Dimension line position
    // Pt11 = Text position
    // Pt13 = Extension line 1 - Origin of dimension
    // Pt14 = Extension line 2
    // Pt15 = Intersection of extension lines
    // --------------------
    // Type 2 - Angular Dimension - With additional extension lines (6 Points)
    // --------------------
    // Pt16 = Dimension line position
    // Pt11 = Text position
    // Pt13 = Additional extension line 1 start - Origin of dimension
    // Pt14 = Additional extension line 1 end
    // Pt15 = Additional extension line 2 start
    // Pt10 = Additional extension line 2 end

    const points = [];
    const mousePoint = DesignCore.Mouse.pointOnScene();

    const item1 = items[0];
    const item2 = items[1];

    let tempPt15 = item1.points[0];
    let tempPt10 = item1.points[1];

    let tempPt13 = item2.points[0];
    let tempPt14 = item2.points[1];

    const intersect = Intersection.intersectLineLine({ start: tempPt15, end: tempPt10 }, { start: tempPt13, end: tempPt14 }, true);
    const intersectPt = intersect.points[0]

    if (intersectPt === undefined) {
      const err = 'Invalid selection - undefined origin';
      Logging.instance.warn(`${this.type} - ${err}`);
      return
    }

    if (tempPt10.distance(intersectPt) < tempPt15.distance(intersectPt)) {
      tempPt15 = item1.points[1];
      tempPt10 = item1.points[0];
    }

    if (tempPt14.distance(intersectPt) < tempPt13.distance(intersectPt)) {
      tempPt13 = item2.points[1];
      tempPt14 = item2.points[0];
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
    if (/*dimension < 0 ||*/ dimension > Math.PI) {
      let swapPt = tempPt15;
      tempPt15 = tempPt13;
      tempPt13 = swapPt;

      swapPt = tempPt10;
      tempPt10 = tempPt14;
      tempPt14 = swapPt;
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

    return points;
  }

  /**
   * Build the dimension
   * @param {Object} style
   * @return {Array} - Array of entities that compose the dimension
   */
  buildDimension(style) {

    // Build dimension based on type
    // Type 2 - Angular dimension
    // Type 5 - 3 Point Angular dimension

    if (this.getBaseDimType() === 2) {
      //console.log('build extended dimension')
      return this.buildExtendedDimension(style);
    } else {
      console.log('build regular dimension')
      return this.buildRegularDimension(style);
    }
  }

  /**
   * Build regular dimension without extension lines
   * @param {Object} style
   * @return {Array} - Array of entities that compose the dimension
   */
  buildRegularDimension(style) {

    const err = 'Regular angular dimension not implemented';
    Logging.instance.warn(`${this.type} - ${err}`)

  }


  buildExtendedDimension(style) {
    // Angular
    let dimension = 0;
    const entities = [];

    const Pt15 = this.getPointBySequence(15);
    const Pt10 = this.getPointBySequence(10);
    const Pt13 = this.getPointBySequence(13);
    const Pt14 = this.getPointBySequence(14);
    const Pt16 = this.getPointBySequence(11); //Temp use 11, should be pt16
    const Pt11 = this.getPointBySequence(11);

    // get intersection point
    const intersect = Intersection.intersectLineLine({ start: Pt15, end: Pt10 }, { start: Pt13, end: Pt14 }, true);
    const intersectPt = intersect.points[0];

    const distance = intersectPt.distance(Pt11);

    const arrow1pos = intersectPt.project(Pt13.angle(Pt14), distance) //Pt16.perpendicular(Pt13, Pt14);
    const arrow2pos = intersectPt.project(Pt15.angle(Pt10), distance) //Pt16.perpendicular(Pt15, Pt10);

    let line1Angle = Pt13.angle(Pt14);
    let line2Angle = Pt15.angle(Pt10);

    // check if the dimension is inside the arc
    const inside = Pt11.isOnArc(Pt14, Pt10, intersectPt, 1);

    // calculate the dimension value
    dimension = inside ? line2Angle - line1Angle : line1Angle - line2Angle;
    if (dimension < 0) {
      dimension = dimension + Math.PI * 2
    }
    // get the precision from the style or use default
    const precision = style.getValue('DIMADEC') || 2; // Default precision
    // get the text height
    const textHeight = style.getValue('DIMTXT');
    // approximate text width based on height
    const approxTextWidth = textHeight * this.text.string.length * 0.75; // Approximate width based on character count
    // set the text height
    this.text.height = textHeight;
    // Always set text horizontal alignment to center
    this.text.horizontalAlignment = 1;
    // Always set text vertical alignment to middle
    this.text.verticalAlignment = 2
    // set the text value
    this.text.string = `${Math.abs(Utils.radians2degrees(dimension).toFixed(precision)).toString()}${Strings.Symbol.DEGREE}`;
    // calculate the text position
    const arcMiddle = intersectPt.project(intersectPt.angle(Pt14.midPoint(Pt10)), inside ? distance : -distance)
    //const textOffsetDistance = distance + textHeight * 0.5 + style.getValue('DIMGAP')
    const textPosition = arcMiddle;
    // set the text position
    this.text.points = [textPosition];
    // calculate the text rotation
    const textRotation = 0 //Pt10.angle(Pt14);

    if (style.getValue('DIMTIH') === 0) {
      // DIMTIH - Text inside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
      // DIMTOH - Text outside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
      //this.text.setRotation(Utils.radians2degrees(textRotation) % 180);
    }

    // get the arrow size
    const arrowSize = style.getValue('DIMASZ');
    const arrowRotation = inside ? Math.PI / 2 : -Math.PI / 2;
    const arrowHead1 = this.getArrowHead(arrow1pos, Pt13.angle(Pt14) + arrowRotation, arrowSize);
    const arrowHead2 = this.getArrowHead(arrow2pos, Pt15.angle(Pt10) - arrowRotation, arrowSize);

    // Add the entities to the dimension
    // calculate the radians to mm conversion
    // circumference = 2*PI*radius
    const circumference = 2 * Math.PI * distance
    const circumferencePerRadian = (2 * Math.PI) / circumference
    const arcAdjustment = (approxTextWidth / 2) * circumferencePerRadian

    //create the dimension line / arc
    const arcOneEnd = arcMiddle.rotate(intersectPt, inside ? -arcAdjustment : arcAdjustment)
    const arcOne = new Arc({ points: [intersectPt, inside ? arrow1pos : arcOneEnd, inside ? arcOneEnd : arrow1pos] });
    // Supress dimension line 1 if DIMSD1 is true
    if (!style.getValue('DIMSD1')) {
      entities.push(arrowHead1, arcOne);
    }

    //create the dimension line / arc
    const arcTwoEnd = arcMiddle.rotate(intersectPt, inside ? arcAdjustment : -arcAdjustment)
    const arcTwo = new Arc({ points: [intersectPt, inside ? arcTwoEnd : arrow2pos, inside ? arrow2pos : arcTwoEnd] });
    // Supress dimension line 2 if DIMSD2 is true
    if (!style.getValue('DIMSD2')) {
      entities.push(arrowHead2, arcTwo);
    }

    // debug
    if (true) {
      const pt10Text = new Text()
      pt10Text.string = "pt10"
      pt10Text.points = [Pt10]
      entities.push(pt10Text)

      const pt13Text = new Text()
      pt13Text.string = "pt13"
      pt13Text.points = [Pt13]
      entities.push(pt13Text)

      const pt14Text = new Text()
      pt14Text.string = "pt14"
      pt14Text.points = [Pt14]
      entities.push(pt14Text)

      const pt15Text = new Text()
      pt15Text.string = "pt15"
      pt15Text.points = [Pt15]
      entities.push(pt15Text)
    }

    // generate extension line points
    // get style properties
    const extension = style.getValue('DIMEXE');
    const offset = style.getValue('DIMEXO');

    // check if the dimension is beyond the limits of the selection
    // add extension line one
    if (distance > intersectPt.distance(Pt14) + offset * 2) {
      const extensionLineOneStart = intersectPt.project(intersectPt.angle(Pt14), intersectPt.distance(Pt14) + offset)
      const extensionLineOneEnd = intersectPt.project(intersectPt.angle(Pt14), distance + extension)
      const extensionLineOne = new Line({ points: [extensionLineOneStart, extensionLineOneEnd] });
      // Supress extension line 1 if DIMS1 is true
      if (!style.getValue('DIMSE1')) {
        entities.push(extensionLineOne)
      }
    }

    // check if the dimension is beyond the limits of the selection
    // add extension line two
    if (distance > intersectPt.distance(Pt10) + offset * 2) {
      const extensionLineTwoStart = intersectPt.project(intersectPt.angle(Pt10), intersectPt.distance(Pt10) + offset)
      const extensionLineTwoEnd = intersectPt.project(intersectPt.angle(Pt10), distance + extension)
      const extensionLineTwo = new Line({ points: [extensionLineTwoStart, extensionLineTwoEnd] });
      // Supress extendsion line 2 if DIMSE2 is true
      if (!style.getValue('DIMSE2')) {
        entities.push(extensionLineTwo)
      }
    }

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
    const Pt15 = this.getPointBySequence(15);
    const Pt16 = Pt11; // this.getPointBySequence(16);

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
