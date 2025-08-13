import { Strings } from '../lib/strings.js';
import { Line } from './line.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BaseDimension } from './baseDimension.js';

import { DesignCore } from '../designCore.js';

/**
 * Diametric Dimension Entity Class
 * @extends BaseDimension
 */
export class DiametricDimension extends BaseDimension {
  /**
   * Create a Diametric Dimension
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
    const command = { command: 'DiametricDimension', shortcut: 'DIMDIA' };
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
        // const selection =
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op1);
      pt1.sequence = 11;
      this.points.push(pt1);
      const selectionPoints = DiametricDimension.getPointsFromSelection();
      this.points.push(...selectionPoints);

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      mousePoint.sequence = 11;

      const selectionPoints = DiametricDimension.getPointsFromSelection();
      const points = [...selectionPoints, mousePoint];
      DesignCore.Scene.createTempItem(this.type, { points: points });
    }
  }

  /**
   * Get sequenced points from user selection
   * @param {any} items
   * @return {Array} array of points
   */
  static getPointsFromSelection(items) {
    const item = items[0];
    const center = item.points[0];
    const mousePoint = DesignCore.Mouse.pointOnScene();

    const angle = center.angle(mousePoint);
    const radPoint = center.project(angle, item.getRadius());
    radPoint.sequence = 15;

    const angle2 = mousePoint.angle(center);
    const radPoint2 = center.project(angle2, item.getRadius());
    radPoint2.sequence = 10;

    const points = [radPoint2, radPoint];
    return points;
  }

  /**
   * Build the dimension
   * @param {Object} style
   * @return {Array} - Array of entities that compose the dimension
   */
  buildDimension(style) {
    // Diameter
    let dimension = 0;
    const entities = [];

    const Pt1 = this.getPointBySequence(15); // diameter point
    const Pt2 = this.getPointBySequence(10); // diameter point
    const Pt3 = this.getPointBySequence(11); // text position

    const textPosition = Pt3;
    const textRotation = Pt1.angle(Pt2);
    dimension = Pt1.distance(Pt2);

    // Set the text value, position and rotation
    this.setDimensionValue(dimension, textPosition, textRotation);

    if (dimension < Pt1.distance(Pt3) || dimension < Pt2.distance(Pt3)) {
      // Text is outside the radius
      const endPoint = Pt1.project(Pt2.angle(Pt1), Pt1.distance(Pt3));
      const line1 = new Line({ points: [Pt2, endPoint] });
      const arrowHead1 = this.getArrowHead(Pt1, Pt1.angle(Pt2));
      const arrowHead2 = this.getArrowHead(Pt2, Pt2.angle(Pt1));

      entities.push(line1, arrowHead1, arrowHead2);
    } else {
      // Text is inside the radius
      const line1 = new Line({ points: [Pt1, Pt3] });
      const arrowHead1 = this.getArrowHead(Pt1, Pt1.angle(Pt3));
      entities.push(line1, arrowHead1);
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
    const Pt15 = this.getPointBySequence(15);

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
    file.writeGroupCode('100', 'AcDbDiametricDimension', DXFFile.Version.R2000);
    file.writeGroupCode('15', Pt15.x); // X - End of Dimension Line
    file.writeGroupCode('25', Pt15.y); // Y
    file.writeGroupCode('35', '0.0'); // Z
  }
}
