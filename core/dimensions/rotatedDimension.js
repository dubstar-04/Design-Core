import { Strings } from '../lib/strings.js';
import { Line } from '../entities/line.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Point } from '../entities/point.js';
import { BaseLinearDimension } from './baseLinearDimension.js';

import { DesignCore } from '../designCore.js';


/**
 * Rotated Dimension Entity Class
 * @extends BaseLinearDimension
 */
export class RotatedDimension extends BaseLinearDimension {
  /**
   * Create an Rotated Dimension
   * @param {Array} data
   */
  constructor(data) {
    super(data);
    this.dimType.setDimType(0); // Rotated dimension
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'RotatedDimension', shortcut: 'DIMROT' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      DesignCore.Scene.selectionManager.reset();
      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle();
      this.dimType.setDimType(0); // Rotated dimension

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
      this.points = RotatedDimension.getPointsFromSelection([tempLine], pt11);

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
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

    // Get the primary axis (x or y)
    const iX = ((Math.abs(Pt11.x - Pt13.x) + Math.abs(Pt14.x - Pt11.x)) - Math.abs(dx));
    const iY = ((Math.abs(Pt11.y - Pt13.y) + Math.abs(Pt14.y - Pt11.y)) - Math.abs(dy));

    if (iX >= iY && dy !== 0) {
      Pt10.x = Pt11.x;
      Pt10.y = Pt14.y;
    } else if (iX < iY && dx !== 0) {
      Pt10.x = Pt14.x;
      Pt10.y = Pt11.y;
    }

    points.push(Pt10);
    return points;
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
    file.writeGroupCode('50', this.linearDimAngle); // Utils.radians2degrees(Pt13.angle(Pt14))); // Rotation angle
    file.writeGroupCode('100', 'AcDbRotatedDimension', DXFFile.Version.R2000);
  }
}
