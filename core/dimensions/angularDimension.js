
import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Arc } from '../entities/arc.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { Line } from '../entities/line.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BaseDimension } from './baseDimension.js';
import { Intersection } from '../lib/intersect.js';
import { Point } from '../entities/point.js';

import { Text } from '../entities/text.js'; // used to debug the dimension points

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
    this.dimType.setDimType(2); // Angular dimension
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
      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle();
      this.dimType.setDimType(2); // Angular dimension

      let Pt10;
      let Pt15;
      let Pt13;
      let Pt14;

      while (!Pt10 && !Pt15) {
        this.points = [];
        DesignCore.Scene.selectionManager.reset();

        const op = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        const selection = await DesignCore.Scene.inputManager.requestInput(op);
        let selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);

        if ([Line, BasePolyline].some((entity) => selectedItem instanceof entity)) {
          if (selectedItem instanceof BasePolyline) {
            // get the segment closest to the mouse point
            const segment = selectedItem.getClosestSegment(selection.selectedPoint);

            if (segment instanceof Line) {
              // update the selected item to be the polyline arc segment
              selectedItem = segment;
            }
          }

          if (selectedItem instanceof Line) {
            Pt15 = selectedItem.points[0];
            Pt15.sequence = 15;
            this.points.push(Pt15);

            Pt10 = selectedItem.points[1];
            Pt10.sequence = 10;
            this.points.push(Pt10);
          }
        }
      }

      while (!Pt13 && !Pt14) {
        DesignCore.Scene.selectionManager.reset();
        const op1 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        const selection2 = await DesignCore.Scene.inputManager.requestInput(op1);
        let selectedItem = DesignCore.Scene.entities.get(selection2.selectedItemIndex);

        if ([Line, BasePolyline].some((entity) => selectedItem instanceof entity)) {
          if (selectedItem instanceof BasePolyline) {
            // get the segment closest to the mouse point
            const segment = selectedItem.getClosestSegment(selection2.selectedPoint);

            if (segment instanceof Line) {
              // update the selected item to be the polyline arc segment
              selectedItem = segment;
            }
          }
          if (selectedItem instanceof Line) {
            Pt13 = selectedItem.points[0];
            Pt13.sequence = 13;
            this.points.push(Pt13);

            Pt14 = selectedItem.points[1];
            Pt14.sequence = 14;
            this.points.push(Pt14);
          }
        }
      }

      const op2 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const Pt11 = await DesignCore.Scene.inputManager.requestInput(op2);

      const tempLineOne = new Line({ points: [Pt15, Pt10] });
      const tempLineTwo = new Line({ points: [Pt13, Pt14] });

      this.points = AngularDimension.getPointsFromSelection([tempLineOne, tempLineTwo], Pt11);

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
      const Pt11 = DesignCore.Mouse.pointOnScene();
      Pt11.sequence = 11;

      const Pt15 = this.getPointBySequence(this.points, 15);
      const Pt10 = this.getPointBySequence(this.points, 10);
      const Pt13 = this.getPointBySequence(this.points, 13);
      const Pt14 = this.getPointBySequence(this.points, 14);

      const tempLineOne = new Line({ points: [Pt15, Pt10] });
      const tempLineTwo = new Line({ points: [Pt13, Pt14] });

      const points = AngularDimension.getPointsFromSelection([tempLineOne, tempLineTwo], Pt11);

      DesignCore.Scene.tempEntities.create(this.type, { points: points, dimensionStyle: this.dimensionStyle });
    }
  }

  /**
   * Get sequenced points from user selection
   * @param {any} items
   * @param {Point} textPos
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
  buildDimension() {
  // Get sorted and sequenced points
    const sortedPoints = this.sortDimensionPoints();
    const Pt13 = this.getPointBySequence(sortedPoints, 13);
    const Pt14 = this.getPointBySequence(sortedPoints, 14);
    const Pt15 = this.getPointBySequence(sortedPoints, 15);
    const Pt10 = this.getPointBySequence(sortedPoints, 10);
    const Pt16 = this.getPointBySequence(this.points, 16);
    const Pt11 = this.getPointBySequence(this.points, 11);

    // Style values
    const DIMTIH = this.getDimensionStyle().getValue('DIMTIH'); // Text inside horizontal alignment
    const DIMTOH = this.getDimensionStyle().getValue('DIMTOH'); // Text outside horizontal alignment
    const DIMASZ = this.getDimensionStyle().getValue('DIMASZ'); // Arrow size (used for extension line length)
    const DIMTXT = this.getDimensionStyle().getValue('DIMTXT'); // Text size (used for estimated text width)
    const DIMTAD = this.getDimensionStyle().getValue('DIMTAD'); // Text vertical position
    const DIMEXE = this.getDimensionStyle().getValue('DIMEXE'); // Extend beyond dimension line distance
    const DIMEXO = this.getDimensionStyle().getValue('DIMEXO'); // Offset from origin distance
    const DIMJUST = this.getDimensionStyle().getValue('DIMJUST'); // Justification of the dimension text
    const DIMGAP = this.getDimensionStyle().getValue('DIMGAP'); // Gap between dimension line and text
    const DIMSE1 = this.getDimensionStyle().getValue('DIMSE1'); // Suppress first extension line
    const DIMSE2 = this.getDimensionStyle().getValue('DIMSE2'); // Suppress second extension line
    const DIMSD1 = this.getDimensionStyle().getValue('DIMSD1'); // Suppress first dimension line
    const DIMSD2 = this.getDimensionStyle().getValue('DIMSD2'); // Suppress second dimension line

    // Intersection and radius
    const intersectPt = Intersection.intersectLineLine({ start: Pt15, end: Pt10 }, { start: Pt13, end: Pt14 }, true).points[0];
    const radius = intersectPt.distance(Pt16);

    // check dimension is valid
    if (radius === 0) {
      return;
    }

    // Inline quadrant/arrow/line logic
    const quadOneStart = Pt14;
    const quadOneEnd = Pt10;
    const quadTwoStart = Pt14.rotate(intersectPt, Math.PI);
    const quadTwoEnd = Pt10.rotate(intersectPt, Math.PI);
    let arrow1pos = intersectPt;
    let arrow2pos = intersectPt;
    let line1Extents = Pt14;
    let line2Extents = Pt10;
    if (Pt16.isOnArc(quadOneStart, quadOneEnd, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadOneStart), radius);
      arrow2pos = intersectPt.project(intersectPt.angle(quadOneEnd), radius);
      line1Extents = Pt14;
      line2Extents = Pt10;
    } else if (Pt16.isOnArc(quadOneEnd, quadTwoStart, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadOneEnd), radius);
      arrow2pos = intersectPt.project(intersectPt.angle(quadTwoStart), radius);
      line1Extents = Pt10;
      line2Extents = Pt13;
    } else if (Pt16.isOnArc(quadTwoStart, quadTwoEnd, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadTwoStart), radius);
      arrow2pos = intersectPt.project(intersectPt.angle(quadTwoEnd), radius);
      line1Extents = Pt13;
      line2Extents = Pt15;
    } else if (Pt16.isOnArc(quadTwoEnd, quadOneStart, intersectPt, 1)) {
      arrow1pos = intersectPt.project(intersectPt.angle(quadTwoEnd), radius);
      arrow2pos = intersectPt.project(intersectPt.angle(quadOneStart), radius);
      line1Extents = Pt15;
      line2Extents = Pt14;
    }

    const line1Angle = intersectPt.angle(arrow1pos);
    const line2Angle = intersectPt.angle(arrow2pos);
    let dimension = line2Angle - line1Angle;
    if (dimension < 0) dimension += Math.PI * 2;

    // Text and arc calculations
    const approxTextWidth = Text.getApproximateWidth(this.getDimensionValue(Utils.radians2degrees(dimension)), DIMTXT) * 1.25;
    const approxTextHalfWidth = approxTextWidth * 0.5;
    const circumference = 2 * Math.PI * radius;
    const radiansPerLengthUnit = (2 * Math.PI) / circumference;
    const arcAdjustment = approxTextHalfWidth * radiansPerLengthUnit;
    const arrowRadians = DIMASZ * radiansPerLengthUnit;
    const textOutSide = (approxTextWidth * 1.5) * radiansPerLengthUnit >= dimension;
    const arrowsOutside = arrowRadians * 3 >= dimension;
    const horizontalText = (DIMTIH !== 0 && !textOutSide) || (DIMTOH !== 0 && textOutSide);

    // Arc/text positions
    const arcMiddle = intersectPt.project(intersectPt.angle(arrow1pos.midPoint(arrow2pos)), radius);
    let textPosition = arcMiddle;
    let textRotation = this.getTextDirection(horizontalText ? 0 : arrow1pos.angle(arrow2pos));
    let textAboveDirection = textRotation + Math.PI / 2;
    let textAboveDistance = DIMTXT * 0.5 + DIMGAP;
    const outsideOffsetDirection = Pt11.distance(arrow1pos) < Pt11.distance(arrow2pos) ? -1 : 1;
    const textPositionOffsetAngle = arrowRadians * 3;
    const internalPositionAdjustmentAngle = dimension * 0.5 > textPositionOffsetAngle ? dimension * 0.5 - textPositionOffsetAngle : 0;
    const externalPositionAdjustmentAngle = dimension * 0.5 + textPositionOffsetAngle;

    // Text justification
    switch (DIMJUST) {
      case 0:
        if (textOutSide) textPosition = arcMiddle.rotate(intersectPt, externalPositionAdjustmentAngle * outsideOffsetDirection);
        break;
      case 1:
        if (textOutSide) {
          textPosition = arcMiddle.rotate(intersectPt, externalPositionAdjustmentAngle * outsideOffsetDirection);
        } else {
          textPosition = arcMiddle.rotate(intersectPt, internalPositionAdjustmentAngle);
          textRotation = this.getTextDirection(horizontalText ? 0 : (intersectPt.angle(textPosition) + Math.PI / 2));
        }
        break;
      case 2:
        if (textOutSide) {
          textPosition = arcMiddle.rotate(intersectPt, (dimension * 0.5 + DIMASZ * 2 * radiansPerLengthUnit) * outsideOffsetDirection);
        } else {
          textPosition = arcMiddle.rotate(intersectPt, -internalPositionAdjustmentAngle);
          textRotation = this.getTextDirection(horizontalText ? 0 : (intersectPt.angle(textPosition) + Math.PI / 2));
        }
        break;
      case 3:
        textPosition = arrow1pos.project(line1Angle, (approxTextHalfWidth + DIMEXE + DIMTXT));
        textRotation = this.getTextDirection(line1Angle);
        textAboveDirection = textRotation + Math.PI / 2;
        break;
      case 4:
        textPosition = arrow2pos.project(line2Angle, (approxTextHalfWidth + DIMEXE + DIMTXT));
        textRotation = this.getTextDirection(line2Angle);
        textAboveDirection = textRotation + Math.PI / 2;
        break;
    }

    // Text vertical position
    const textAndDimlineAligned = this.alignedOrOpposite(textRotation, (intersectPt.angle(textPosition) + Math.PI / 2));
    const textIsOnExtensionLine = textPosition.perpendicular(intersectPt, arrow1pos).isSame(textPosition) || textPosition.perpendicular(intersectPt, arrow2pos).isSame(textPosition);
    if (!textAndDimlineAligned && !textIsOnExtensionLine) textAboveDistance = 0;
    switch (DIMTAD) {
      case 1:
      case 2:
      case 3:
        textPosition = textPosition.project(textAboveDirection, textAboveDistance);
        break;
      case 4:
        textPosition = textPosition.project(textAboveDirection, -textAboveDistance);
        break;
    }

    // Add dimension text entity
    const entities = [];
    entities.push(this.getDimensionText(Utils.radians2degrees(dimension), textPosition, textRotation));

    // Arc and arrow geometry
    const textDimlineIntersection = intersectPt.project(intersectPt.angle(textPosition), radius);
    const textIsOnDimLine = Utils.round(intersectPt.distance(textPosition)) === Utils.round(radius);
    const textIsOnExtensionLineOne = textPosition.perpendicular(intersectPt, arrow1pos).isSame(textPosition);
    const textIsOnExtensionLineTwo = textPosition.perpendicular(intersectPt, arrow2pos).isSame(textPosition);
    const textAndExtlineOneAligned = this.alignedOrOpposite(textRotation, intersectPt.angle(arrow1pos));
    const textAndExtlineTwoAligned = this.alignedOrOpposite(textRotation, intersectPt.angle(arrow2pos));

    // Arrow heads
    const arcOffset = radius - Math.sqrt(radius * radius - DIMASZ * DIMASZ);
    const arcRotationOffset = Math.asin(arcOffset / DIMASZ);
    const arrowRotation = arrowsOutside ? -Math.PI / 2 - arcRotationOffset : Math.PI / 2 + arcRotationOffset;
    const arrowHead1 = this.getArrowHead(arrow1pos, intersectPt.angle(arrow1pos) + arrowRotation);
    const arrowHead2 = this.getArrowHead(arrow2pos, intersectPt.angle(arrow2pos) - arrowRotation);

    // Arc geometry
    const arcStart = textIsOnDimLine ? textDimlineIntersection : arcMiddle;
    const arcOneBase = arrowsOutside ? arrow1pos : !textOutSide ? arcStart : arcMiddle;
    const arcOneRotation = arrowsOutside ? (-arrowRadians * 2) : ((textIsOnDimLine && !textOutSide) ? -arcAdjustment : 0);
    const arcOneEnd = arcOneBase.rotate(intersectPt, arcOneRotation);
    const arcOne = new Arc({ points: [intersectPt, arrow1pos, arcOneEnd], direction: arrowsOutside ? -1 : 1 });
    if (!DIMSD1) {
      entities.push(arrowHead1);
      entities.push(arcOne);
    }
    const arcTwoBase = arrowsOutside ? arrow2pos : !textOutSide ? arcStart : arcMiddle;
    const arcTwoRotation = arrowsOutside ? (arrowRadians * 2) : ((textIsOnDimLine && !textOutSide) ? arcAdjustment : 0);
    const arcTwoEnd = arcTwoBase.rotate(intersectPt, arcTwoRotation);
    const arcTwo = new Arc({ points: [intersectPt, arrow2pos, arcTwoEnd], direction: arrowsOutside ? 1 : -1 });
    if (!DIMSD2) {
      entities.push(arrowHead2);
      entities.push(arcTwo);
    }

    // Extension lines
    const extensionLineOneStart = intersectPt.project(intersectPt.angle(arrow1pos), intersectPt.distance(line1Extents) + DIMEXO);
    let extensionLineOneEnd = intersectPt.project(intersectPt.angle(arrow1pos), radius + DIMEXE);
    const extensionLineTwoStart = intersectPt.project(intersectPt.angle(arrow2pos), intersectPt.distance(line2Extents) + DIMEXO);
    let extensionLineTwoEnd = intersectPt.project(intersectPt.angle(arrow2pos), radius + DIMEXE);
    if (textPosition.distance(arrow1pos) < textPosition.distance(arrow2pos)) {
      if (!textIsOnExtensionLineOne && textAndExtlineOneAligned && !textIsOnDimLine) {
        const dist = extensionLineOneEnd.distance(textPosition.perpendicular(extensionLineOneStart, extensionLineOneEnd)) + approxTextHalfWidth;
        extensionLineOneEnd = extensionLineOneEnd.project(extensionLineOneStart.angle(extensionLineOneEnd), dist);
      }
    } else {
      if (!textIsOnExtensionLineTwo && textAndExtlineTwoAligned && !textIsOnDimLine) {
        const dist = extensionLineTwoEnd.distance(textPosition.perpendicular(extensionLineTwoStart, extensionLineTwoEnd)) + approxTextHalfWidth;
        extensionLineTwoEnd = extensionLineTwoEnd.project(extensionLineTwoStart.angle(extensionLineTwoEnd), dist);
      }
    }
    if (radius > intersectPt.distance(line1Extents) + DIMEXE) {
      const extensionLineOne = new Line({ points: [extensionLineOneStart, extensionLineOneEnd] });
      if (!DIMSE1) entities.push(extensionLineOne);
    }
    if (radius > intersectPt.distance(line2Extents) + DIMEXE) {
      const extensionLineTwo = new Line({ points: [extensionLineTwoStart, extensionLineTwoEnd] });
      if (!DIMSE2) entities.push(extensionLineTwo);
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
    const Pt16 = this.getPointBySequence(this.points, 16);

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
