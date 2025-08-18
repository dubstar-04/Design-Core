import { Strings } from '../lib/strings.js';
import { Line } from './line.js';
import { Text } from './text.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BaseDimension } from './baseDimension.js';

import { DesignCore } from '../designCore.js';

/**
 * Radial Dimension Entity Class
 * @extends BaseDimension
 */
export class RadialDimension extends BaseDimension {
  /**
   * Create a Radial Dimension
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
    const command = { command: 'RadialDimension', shortcut: 'DIMRADIUS' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        // const selection =
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const Pt11 = await DesignCore.Scene.inputManager.requestInput(op1);
      Pt11.sequence = 11;
      this.points.push(Pt11);

      const selectionPoints = RadialDimension.getPointsFromSelection();
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

      const selectionPoints = this.getPointsFromSelection();
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
    const mousePoint = DesignCore.Mouse.pointOnScene();
    const center = item.points[0];
    center.sequence = 10;
    const angle = center.angle(mousePoint);
    const radPoint = center.project(angle, item.getRadius());
    radPoint.sequence = 15;

    const points = [center, radPoint];
    return points;
  }

  /**
   * Build the dimension
   * @param {Object} style
   * @return {Array} - Array of entities that compose the dimension
   */
  buildDimension() {
    // Radius

    let dimension = 0;
    const entities = [];

    const Pt15 = this.getPointBySequence(this.points, 15); // radius point
    const Pt10 = this.getPointBySequence(this.points, 10); // center point
    const Pt11 = this.getPointBySequence(this.points, 11); // text position

    const textPosition = Pt11;
    const textRotation = Pt15.angle(Pt10);
    dimension = Pt15.distance(Pt10);

    // Get the dimension text using the value, position and rotation
    const text = this.getDimensionText(dimension, textPosition, textRotation);
    entities.push(text);

    // approximate text width based on height
    const approxTextWidth = Text.getApproximateWidth(text.string, text.height);
    const lineLength = Pt15.distance(Pt11) - approxTextWidth;

    // If the text is outside the radius
    // Draw an extra line
    if (dimension < Pt10.distance(Pt11)) {
      // Text is outside the radius
      const endPoint = Pt15.project(Pt10.angle(Pt15), lineLength);
      const line1 = new Line({ points: [Pt15, endPoint] });
      const arrowHead1 = this.getArrowHead(Pt15, Pt10.angle(Pt11));
      entities.push(line1, arrowHead1);
    } else {
      // Text is inside the radius
      const endPoint = Pt15.project(Pt10.angle(Pt15), -lineLength);
      const line1 = new Line({ points: [Pt15, endPoint] });
      const arrowHead1 = this.getArrowHead(Pt15, Pt11.angle(Pt10));
      entities.push(line1, arrowHead1);
    }

    entities.push(...this.getCentreMark(Pt10));

    return entities;
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    const Pt10 = this.getPointBySequence(this.points, 10);
    const Pt11 = this.getPointBySequence(this.points, 10);
    const Pt15 = this.getPointBySequence(this.points, 15);

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
    file.writeGroupCode('3', 'STANDARD'); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDbRadialDimension', DXFFile.Version.R2000);
    file.writeGroupCode('15', Pt15.x); // X - End of Dimension Line
    file.writeGroupCode('25', Pt15.y); // Y
    file.writeGroupCode('35', '0.0'); // Z
  }
}
