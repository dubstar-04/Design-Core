
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Arc} from './arc.js';
import {Line} from './line.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BaseDimension} from './baseDimension.js';
import {Intersection} from '../lib/intersect.js';

import {DesignCore} from '../designCore.js';

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
   * @returns {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = {command: 'AngularDimension', shortcut: 'DIMANG'};
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
        const selection = await DesignCore.Scene.inputManager.requestInput(op);

        const line1 = DesignCore.Scene.getItem(selection.selectedItemIndex);

        const pt15 = line1.points[0];
        pt15.sequence = 15;
        this.points.push(pt15);

        const pt10 = line1.points[1];
        pt10.sequence = 10;
        this.points.push(pt10);

        DesignCore.Scene.selectionManager.reset();
      }

      const op1 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);


      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        const selection2 = await DesignCore.Scene.inputManager.requestInput(op1);

        const line2 = DesignCore.Scene.getItem(selection2.selectedItemIndex);

        const pt13 = line2.points[0];
        pt13.sequence = 13;
        this.points.push(pt13);

        const pt14 = line2.points[1];
        pt14.sequence = 14;
        this.points.push(pt14);

        DesignCore.Scene.selectionManager.reset();
      }

      const op2 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt11 = await DesignCore.Scene.inputManager.requestInput(op2);
      pt11.sequence = 11;
      this.points.push(pt11);

      const pt15 = this.points.find((point) => point === 15);
      const pt10 = this.getPointBySequence(10);

      const pt16 = pt11.perpendicular(pt15, pt10);
      pt16.sequence = 16;
      this.points.push(pt16);

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

      const pt15 = this.getPointBySequence(15);
      const pt10 = this.getPointBySequence(10);

      const pt16 = mousePoint.perpendicular(pt15, pt10);
      pt16.sequence = 16;

      const points = [...this.points, mousePoint, pt16];
      DesignCore.Scene.createTempItem(this.type, {points: points});
    }
  }

  static getPointsFromSelection(items) {
    const points = [];

    const item1= items[0];
    const item2 = items[1];

    const pt15 = item1.points[0];
    pt15.sequence = 15;
    points.push(pt15);

    const pt10 = item1.points[1];
    pt10.sequence = 10;
    points.push(pt10);

    const pt13 = item2.points[0];
    pt13.sequence = 13;
    points.push(pt13);

    const pt14 = item2.points[1];
    pt14.sequence = 14;
    points.push(pt14);

    return points;
  }

  buildDimension(style) {
    // Angular
    let dimension = 0;
    const entities = [];

    const Pt1 = this.getPointBySequence(15);
    const Pt2 = this.getPointBySequence(10);
    const Pt3 = this.getPointBySequence(13);
    const Pt4 = this.getPointBySequence(14);
    const Pt5 = this.getPointBySequence(11); // 16); // should be point 16 changed to debug
    const Pt6 = this.getPointBySequence(11);

    const line1 = new Line({points: [Pt1, Pt2]});
    const line2 = new Line({points: [Pt3, Pt4]});
    const arrow1pos = Pt5.perpendicular(Pt1, Pt2);
    const arrow2pos = Pt5.perpendicular(Pt3, Pt4);
    const arrowHead1 = this.getArrowHead(arrow1pos, Pt1.angle(Pt2) + 1.5708, this.text.height / 2);
    const arrowHead2 = this.getArrowHead(arrow2pos, Pt3.angle(Pt4) + 1.5708, this.text.height / 2);

    const intersect = Intersection.intersectLineLine({start: Pt1, end: Pt2}, {start: Pt3, end: Pt4}, true);
    const arc = new Arc({points: [intersect.points[0], arrow1pos, arrow2pos]});

    entities.push(line1, line2, arrowHead1, arrowHead2, arc);

    this.text.points = [Pt6];
    // this.text.setRotation(Pt1.angle(Pt2));
    const angle = Utils.radians2degrees(Pt1.angle(Pt2));
    this.text.rotation = angle;
    const line1Angle = Pt1.angle(Pt2);
    const line2Angle = Pt3.angle(Pt4);
    dimension = Utils.radians2degrees(line1Angle - line2Angle);
    this.text.string = `${Math.abs(dimension.toFixed(2)).toString()}${Strings.Symbol.DEGREE}`;

    return entities;
  }

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
    file.writeGroupCode('3', 'STANDARD'); // DIMENSION STYLE
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
