import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Line} from './line.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BaseDimension} from './baseDimension.js';

import {Core} from '../core.js';

export class RadialDimension extends BaseDimension {
  constructor(data) {
    super(data);
  }

  static register() {
    const command = {command: 'RadialDimension', shortcut: 'DIMRADIUS'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);

      if (!Core.Scene.selectionManager.selectionSet.selectionSet.length) {
        const selection = await Core.Scene.inputManager.requestInput(op);
      }

      const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt1 = await Core.Scene.inputManager.requestInput(op1);
      pt1.sequence = 11;
      this.points.push(pt1);

      const selectionPoints = RadialDimension.getPointsFromSelection();
      this.points.push(...selectionPoints);

      Core.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    if (Core.Scene.selectionManager.selectionSet.selectionSet.length) {
      const mousePoint = Core.Mouse.pointOnScene();
      mousePoint.sequence = 11;

      const selectionPoints = this.getPointsFromSelection();
      const points = [...selectionPoints, mousePoint];
      Core.Scene.createTempItem(this.type, {points: points});
    }
  }

  static getPointsFromSelection(items) {
    const item = items[0];
    const mousePoint = Core.Mouse.pointOnScene();
    const center = item.points[0];
    center.sequence = 10;
    const angle = center.angle(mousePoint);
    const radPoint = center.project(angle, item.getRadius());
    radPoint.sequence = 15;

    const points = [center, radPoint];
    return points;
  }

  buildDimension() {
    // Radius

    let dimension = 0;
    const entities = [];

    const Pt1 = this.getPointBySequence(15); // radius point
    const Pt2 = this.getPointBySequence(10); // center point
    const Pt3 = this.getPointBySequence(11); // text position

    const line1 = new Line({points: [Pt1, Pt2]});
    const arrowHead1 = this.getArrowHead(Pt1, Pt2.angle(Pt1), this.text.height / 2);

    entities.push(line1, arrowHead1);

    this.text.points = [Pt3];
    const angle = Utils.radians2degrees(Pt1.angle(Pt2));
    this.text.rotation = angle;
    dimension = Pt1.distance(Pt2);

    // If the text is outside the radius
    // Draw an extra line
    if (dimension < Pt2.distance(Pt3)) {
      const vector = Pt2.angle(Pt1);
      const endPoint = Pt1.project(vector, Pt1.distance(Pt3));
      const line2 = new Line({points: [Pt1, endPoint]});
      entities.push(line2);
    }

    this.text.string = `R${Math.abs(dimension.toFixed(2)).toString()}`;

    return entities;
  }

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
    file.writeGroupCode('3', 'STANDARD'); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDbRadialDimension', DXFFile.Version.R2000);
    file.writeGroupCode('15', Pt15.x); // X - End of Dimension Line
    file.writeGroupCode('25', Pt15.y); // Y
    file.writeGroupCode('35', '0.0'); // Z
  }
}
