import { Strings } from '../lib/strings.js';
import { Line } from './line.js';
import { Text } from './text.js';
import { Point } from './point.js';
import { Intersection } from '../lib/intersect.js';
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
      const Pt11 = await DesignCore.Scene.inputManager.requestInput(op1);
      Pt11.sequence = 11;
      this.points.push(Pt11);
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
   * @param {Point} textPos
   * @return {Array} array of points
   */
  static getPointsFromSelection(items, textPos) {
    const item = items[0];
    const center = item.points[0];

    const Pt11 = textPos;
    Pt11.sequence = 11;

    const angle = Pt11.angle(center);
    const Pt10 = center.project(angle, item.getRadius());
    Pt10.sequence = 10;
    // Pt15 should be closest point to the text position
    const Pt15 = center.project(angle - Math.PI, item.getRadius());
    Pt15.sequence = 15;

    const points = [Pt10, Pt15, Pt11];
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

    const Pt15 = this.getPointBySequence(this.points, 15); // diameter point
    const Pt10 = this.getPointBySequence(this.points, 10); // diameter point
    let Pt11 = this.getPointBySequence(this.points, 11); // text position

    const centre = Pt10.midPoint(Pt15);

    // Helper to get style values
    const getStyle = (key) => this.getDimensionStyle().getValue(key);
    // Style values
    const DIMTIH = getStyle('DIMTIH'); // Text inside horizontal alignment
    const DIMTOH = getStyle('DIMTOH'); // Text outside horizontal alignment
    const DIMASZ = getStyle('DIMASZ'); // Arrow size (used for extension line length)
    const DIMTXT = getStyle('DIMTXT'); // Text size (used for estimated text width)
    const DIMTOFL = getStyle('DIMTOFL'); // Force extension line if text outside
    const DIMTAD = getStyle('DIMTAD'); // Text vertical position

    // Ensure points are aligned Pt10 > Pt15 > Pt11
    // This resets the points to a known state to allow application of the dimstyle
    if (Pt15.isOnLine(Pt10, Pt11) === false) {
      // Find the intersection between Pt10 > Pt15 and a horizontal ray from Pt11
      const line2 = { start: Pt10, end: Pt15 };
      const line1 = { start: Pt11, end: new Point(Pt10.x, Pt11.y) };
      const intersect = Intersection.intersectLineLine(line1, line2, true);
      // Reset Pt11 - This should be the same as the originally selected Pt11
      // Pt11 position can be changed depending on the dimstyle
      Pt11 = intersect.points[0];
    }

    // set a minimum postion for the text
    if (Pt15.distance(Pt11) < DIMASZ + DIMTXT) {
      Pt11 = Pt15.project(Pt10.angle(Pt11), DIMASZ + DIMTXT);
    }

    const formattedDimensionValue = this.getDimensionValue(dimension);
    // approximate text width based on height
    const approxTextWidth = Text.getApproximateWidth(formattedDimensionValue, DIMTXT);

    // let textPosition = Pt11;
    let textPosition = Pt11.project(Pt15.angle(Pt11), approxTextWidth * 0.5 + DIMTXT);
    let textRotation = Pt15.angle(Pt10);
    dimension = Pt15.distance(Pt10);

    const isInside = centre.distance(Pt11) < centre.distance(Pt15);

    // Check if the dimension text is aligned with the dimension line or horizontal
    // This is determined by the DIMTIH and DIMTOH values
    // 0 = Aligns text with the dimension line
    // 1 = Draws text horizontally
    if (isInside && DIMTIH === 1 || !isInside && DIMTOH === 1) {
      // get a + or - to define the direction of the extension line - Reverse for internal radius dimension
      const extLineDirection = isInside ? Math.sign(centre.x - Pt11.x) : Math.sign(Pt11.x - centre.x);
      const extLineEnd = new Point(Pt11.x + DIMASZ * extLineDirection, Pt11.y);
      const extLine = new Line({ points: [Pt11, extLineEnd] });
      textRotation = 0;
      if (Pt10.isSame(Pt11) === false) {
        textPosition = extLineEnd.project(Pt11.angle(extLineEnd), approxTextWidth * 0.5 + DIMTXT);
        entities.push(extLine);
      }
    }

    // Add the dimension line and arrow head
    // Add the dimension line and arrow head
    let lineLength = Pt15.distance(Pt11);
    if (DIMTAD !== 0) {
      lineLength = lineLength + approxTextWidth + DIMTXT; // Add text offset to line length
    }
    const startPoint = DIMTOFL ? Pt10.project(Pt15.angle(Pt10), DIMTXT + DIMASZ) : Pt15;
    const endPoint = Pt15.project(Pt10.angle(Pt15), isInside ? -lineLength : lineLength);
    const line = new Line({ points: [startPoint, endPoint] });
    const arrowDirection = isInside ? Pt15.angle(Pt10) : Pt10.angle(Pt15);
    const arrowHead = this.getArrowHead(Pt15, arrowDirection);
    entities.push(line, arrowHead);

    // If DIMTOFL is true show a second arrow head
    if (DIMTOFL) {
      const arrowHead2 = this.getArrowHead(Pt10, arrowDirection + Math.PI);
      entities.push(arrowHead2);
    }

    // Get the dimension text using the value, position and rotation
    const text = this.getDimensionText(dimension, textPosition, textRotation);
    entities.push(text);

    // If DIMTOFL is true, the centre mark is not drawn
    if (!DIMTOFL) {
    // Add the centre mark for radial dimensions
      entities.push(...this.getCentreMark(centre));
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
    file.writeGroupCode('3', this.dimensionStyle); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDbDiametricDimension', DXFFile.Version.R2000);
    file.writeGroupCode('15', Pt15.x); // X - End of Dimension Line
    file.writeGroupCode('25', Pt15.y); // Y
    file.writeGroupCode('35', '0.0'); // Z
  }
}
