
import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Arc } from './arc.js';
import { Line } from './line.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BaseDimension } from './baseDimension.js';
import { Intersection } from '../lib/intersect.js';

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
    const points = [];

    const item1 = items[0];
    const item2 = items[1];

    let tempPt15 = item1.points[0];
    let tempPt10 = item1.points[1];

    let tempPt13 = item2.points[0];
    let tempPt14 = item2.points[1];

    const intersect = Intersection.intersectLineLine({ start: tempPt15, end: tempPt10 }, { start: tempPt13, end: tempPt14 }, true);
    const intersectPt = intersect.points[0]

    if (tempPt10.distance(intersectPt) < tempPt15.distance(intersectPt)) {
      tempPt15 = item1.points[1];
      tempPt10 = item1.points[0];
    }

    if (tempPt14.distance(intersectPt) < tempPt13.distance(intersectPt)) {
      tempPt13 = item2.points[1];
      tempPt14 = item2.points[0];
    }

    // Ensure points are in correct order based on angles
    if ((intersectPt.angle(tempPt10) + Math.PI) % Math.PI < (intersectPt.angle(tempPt14) + Math.PI) % Math.PI) {
      let swapPt = tempPt15;
      tempPt15 = tempPt13;
      tempPt13 = swapPt;

      swapPt = tempPt10;
      tempPt10 = tempPt14;
      tempPt14 = swapPt;
    }

    const Pt15 = tempPt15
    Pt15.sequence = 15;
    points.push(Pt15);

    const Pt10 = tempPt10
    Pt10.sequence = 10;
    points.push(Pt10);

    const Pt13 = tempPt13
    Pt13.sequence = 13;
    points.push(Pt13);

    const Pt14 = tempPt14
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

    const arrow1pos = intersectPt.project(Pt15.angle(Pt10), distance) //Pt16.perpendicular(Pt15, Pt10);
    const arrow2pos = intersectPt.project(Pt13.angle(Pt14), distance) //Pt16.perpendicular(Pt13, Pt14);

    let line1Angle = Pt15.angle(Pt10);
    let line2Angle = Pt13.angle(Pt14);

    // check if the dimension is inside the arc
    const inside = Pt11.isOnArc(Pt10, Pt14, intersectPt, 1);
    console.log(`inside: ${inside}`);

    if (inside) {
      line1Angle = (line1Angle + Math.PI) % Math.PI;
      line2Angle = (line2Angle + Math.PI) % Math.PI;
    }

    // calculate the dimension value
    dimension = Utils.radians2degrees(line1Angle - line2Angle);
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
    this.text.string = `${Math.abs(dimension.toFixed(precision)).toString()}${Strings.Symbol.DEGREE}`;
    // calculate the text position
    const textPositionRotation = inside ? ((line2Angle - line1Angle) / 2) : ((line1Angle - line2Angle) / 2);
    const textPosition = intersectPt.project(Pt15.angle(Pt10) - textPositionRotation, distance + textHeight * 0.5 + style.getValue('DIMGAP'));
    // set the text position
    this.text.points = [textPosition];
    // calculate the text rotation
    const textRotation = Pt10.angle(Pt14);

    if (style.getValue('DIMTIH') === 0) {
      // DIMTIH - Text inside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
      // DIMTOH - Text outside horizontal if nonzero, 0 = Aligns text with the dimension line, 1 = Draws text horizontally
      this.text.setRotation(Utils.radians2degrees(textRotation) % 180);
    }

    // get the arrow size
    const arrowsize = style.getValue('DIMASZ');
    const arrowRotation = inside ? Math.PI / 2 : -Math.PI / 2;
    const arrowHead1 = this.getArrowHead(arrow1pos, Pt15.angle(Pt10) + arrowRotation, arrowsize);
    const arrowHead2 = this.getArrowHead(arrow2pos, Pt13.angle(Pt14) - arrowRotation, arrowsize);

    const arc = new Arc({ points: [intersectPt, inside ? arrow1pos : arrow2pos, inside ? arrow2pos : arrow1pos] });
    //const line1 = new Line({ points: [Pt15, Pt10] });
    //const line2 = new Line({ points: [Pt13, Pt14] });

    entities.push(/*line1, line2,*/ arrowHead1, arrowHead2, arc);
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
