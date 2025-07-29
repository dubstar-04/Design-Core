
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

        const Pt155 = line1.points[0];
        Pt155.sequence = 15;
        this.points.push(Pt155);

        const Pt150 = line1.points[1];
        Pt150.sequence = 10;
        this.points.push(Pt150);

        DesignCore.Scene.selectionManager.reset();
      }

      const op1 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);


      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        const selection2 = await DesignCore.Scene.inputManager.requestInput(op1);

        const line2 = DesignCore.Scene.getItem(selection2.selectedItemIndex);

        const Pt153 = line2.points[0];
        Pt153.sequence = 13;
        this.points.push(Pt153);

        const Pt154 = line2.points[1];
        Pt154.sequence = 14;
        this.points.push(Pt154);

        DesignCore.Scene.selectionManager.reset();
      }

      const op2 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const Pt151 = await DesignCore.Scene.inputManager.requestInput(op2);
      Pt151.sequence = 11;
      this.points.push(Pt151);

      const Pt155 = this.points.find((point) => point === 15);
      const Pt150 = this.getPointBySequence(10);

      const Pt156 = Pt151.perpendicular(Pt155, Pt150);
      Pt156.sequence = 16;
      this.points.push(Pt156);

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

      const Pt155 = this.getPointBySequence(15);
      const Pt150 = this.getPointBySequence(10);

      const Pt156 = mousePoint.perpendicular(Pt155, Pt150);
      Pt156.sequence = 16;

      const points = [...this.points, mousePoint, Pt156];
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

    const Pt155 = item1.points[0];
    Pt155.sequence = 15;
    points.push(Pt155);

    const Pt150 = item1.points[1];
    Pt150.sequence = 10;
    points.push(Pt150);

    const Pt153 = item2.points[0];
    Pt153.sequence = 13;
    points.push(Pt153);

    const Pt154 = item2.points[1];
    Pt154.sequence = 14;
    points.push(Pt154);

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
    const Pt16 = this.getPointBySequence(16);
    const Pt11 = this.getPointBySequence(11);

    const line1 = new Line({ points: [Pt15, Pt10] });
    const line2 = new Line({ points: [Pt13, Pt14] });

    const arrow1pos = Pt16.perpendicular(Pt15, Pt10);
    const arrow2pos = Pt16.perpendicular(Pt13, Pt14);

    const arrowHead1 = this.getArrowHead(arrow1pos, Pt15.angle(Pt10) + 1.5708, this.text.height / 2);
    const arrowHead2 = this.getArrowHead(arrow2pos, Pt13.angle(Pt14) + 1.5708, this.text.height / 2);

    const intersect = Intersection.intersectLineLine({ start: Pt15, end: Pt10 }, { start: Pt13, end: Pt14 }, true);
    const arc = new Arc({ points: [intersect.points[0], arrow1pos, arrow2pos] });

    entities.push(line1, line2, arrowHead1, arrowHead2, arc);

    this.text.points = [Pt11];
    // this.text.setRotation(Pt15.angle(Pt10));
    const angle = Utils.radians2degrees(Pt15.angle(Pt10));
    this.text.rotation = angle;

    const line1Angle = Pt15.angle(Pt10);
    const line2Angle = Pt13.angle(Pt14);

    dimension = Utils.radians2degrees(line1Angle - line2Angle);
    const precision = style.getValue('DIMADEC') || 2; // Default precision
    this.text.string = `${Math.abs(dimension.toFixed(precision)).toString()}${Strings.Symbol.DEGREE}`;

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
