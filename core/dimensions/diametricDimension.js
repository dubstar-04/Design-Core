import { Strings } from '../lib/strings.js';
import { Line } from '../entities/line.js';
import { Text } from '../entities/text.js';
import { Arc } from '../entities/arc.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { Circle } from '../entities/circle.js';
import { Point } from '../entities/point.js';
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
    this.dimType.setDimType(3); // Diametric dimension
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
      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle();
      this.dimType.setDimType(3); // Diametric dimension

      let Pt10;
      let Pt15;

      while (!Pt10 && !Pt15) {
        this.points = [];
        DesignCore.Scene.selectionManager.reset();
        const op = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        const selection = await DesignCore.Scene.inputManager.requestInput(op);

        let selectedItem = DesignCore.Scene.getItem(selection.selectedItemIndex);

        if ([Circle, Arc, BasePolyline].some((entity) => selectedItem instanceof entity)) {
          if (selectedItem instanceof BasePolyline) {
            // get the segment closest to the mouse point
            const segment = selectedItem.getClosestSegment(selection.selectedPoint);

            if (segment instanceof Arc) {
              // update the selected item to be the polyline arc segment
              selectedItem = segment;
            }
          }

          if (selectedItem instanceof Circle || selectedItem instanceof Arc) {
            Pt15 = selectedItem.points[1];
            Pt15.sequence = 15;
            this.points.push(Pt15);

            Pt10 = selectedItem.points[0];
            Pt10.sequence = 10;
            this.points.push(Pt10);
          }
        }
      }

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const Pt11 = await DesignCore.Scene.inputManager.requestInput(op1);

      const tempCircle = new Circle({ points: [Pt10, Pt15] });
      this.points = DiametricDimension.getPointsFromSelection([tempCircle], Pt11);

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
      const Pt11 = DesignCore.Mouse.pointOnScene();
      Pt11.sequence = 11;

      const Pt15 = this.getPointBySequence(this.points, 15);
      const Pt10 = this.getPointBySequence(this.points, 10);

      const tempCircle = new Circle({ points: [Pt10, Pt15] });
      const points = DiametricDimension.getPointsFromSelection([tempCircle], Pt11);

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
  buildDimension() {
    // Diameter
    let dimension = 0;
    const entities = [];

    const Pt15 = this.getPointBySequence(this.points, 15); // diameter point
    const Pt10 = this.getPointBySequence(this.points, 10); // diameter point
    let Pt11 = this.getPointBySequence(this.points, 11); // text position

    if (!Pt10 || !Pt11 || !Pt15) {
      return entities;
    }

    const centre = Pt10.midPoint(Pt15);

    // Style values
    const DIMTIH = this.getDimensionStyle().getValue('DIMTIH'); // Text inside horizontal alignment
    const DIMTOH = this.getDimensionStyle().getValue('DIMTOH'); // Text outside horizontal alignment
    const DIMASZ = this.getDimensionStyle().getValue('DIMASZ'); // Arrow size (used for extension line length)
    const DIMTXT = this.getDimensionStyle().getValue('DIMTXT'); // Text size (used for estimated text width)
    const DIMTOFL = this.getDimensionStyle().getValue('DIMTOFL'); // Force extension line if text outside
    const DIMTAD = this.getDimensionStyle().getValue('DIMTAD'); // Text vertical position
    const DIMGAP = this.getDimensionStyle().getValue('DIMGAP'); // Gap between dimension line and text

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
    let textPosition = Pt11.project(Pt15.angle(Pt11), approxTextWidth * 0.5);
    let textRotation = this.getTextDirection(Pt15.angle(Pt10));
    // Get the direction for the dimension text offset
    const textAboveDirection = textRotation + Math.PI / 2;
    const textAboveDistance = DIMTXT * 0.5 + DIMGAP;
    dimension = Pt15.distance(Pt10);

    const isInside = centre.distance(Pt11) < centre.distance(Pt15);

    // Check if the dimension text is aligned with the dimension line or horizontal
    // This is determined by the DIMTIH and DIMTOH values
    // 0 = Aligns text with the dimension line
    // 1 = Draws text horizontally
    // Determine if text should be horizontal, and handle extension line and text position
    const shouldDrawTextHorizontal = (isInside && DIMTIH === 1) || (!isInside && DIMTOH === 1);

    if (shouldDrawTextHorizontal) {
      // Determine extension line direction (+1 or -1)
      const extDir = isInside ? Math.sign(Pt10.x - Pt11.x) : Math.sign(Pt11.x - Pt10.x);

      // Calculate distances for extension line and text offset
      let textOffset = approxTextWidth * 0.5 + DIMTXT;
      let extLineDist = DIMASZ * extDir;

      if (DIMTAD > 0) {
        extLineDist += approxTextWidth * extDir;
        textOffset = -approxTextWidth;
      }

      const extLineEnd = new Point(Pt11.x + extLineDist, Pt11.y);
      textRotation = 0;

      if (!Pt10.isSame(Pt11)) {
        textPosition = extLineEnd.project(Pt11.angle(extLineEnd), textOffset);
        entities.push(new Line({ points: [Pt11, extLineEnd] }));
      }
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

    // Check if the text is aligned with the dimension line
    const textAndDimlineAligned = this.alignedOrOpposite(textRotation, Pt10.angle(Pt15));

    // Add the dimension line and arrow head
    let lineLength = Pt15.distance(Pt11);
    if (DIMTAD !== 0 && textAndDimlineAligned) {
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
    file.writeGroupCode('70', this.dimType.getDimType()); // DIMENSION TYPE
    file.writeGroupCode('3', this.dimensionStyle); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDbDiametricDimension', DXFFile.Version.R2000);
    file.writeGroupCode('15', Pt15.x); // X - End of Dimension Line
    file.writeGroupCode('25', Pt15.y); // Y
    file.writeGroupCode('35', '0.0'); // Z
  }
}
