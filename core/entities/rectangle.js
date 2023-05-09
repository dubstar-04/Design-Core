import {Point} from './point.js';
import {Strings} from '../lib/strings.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {Polyline} from './polyline.js';

export class Rectangle extends Entity {
  constructor(data) {
    super(data);
    // There is no DXF representation of a Rectangle
    // Convenience entity to create a polyline from two points
  }

  static register() {
    const command = {command: 'Rectangle', shortcut: 'REC', type: 'Entity'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt2 = await core.scene.inputManager.requestInput(op2);
      this.points.push(pt2);

      const points = this.rectPoints(this.points[0], this.points[1]);
      const polyline = new Polyline({points: points});

      core.scene.inputManager.executeCommand(polyline);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview(core) {
    if (this.points.length >= 1) {
      const mousePoint = core.mouse.pointOnScene();
      const points = this.rectPoints(this.points.at(-1), mousePoint);
      core.scene.createTempItem('Polyline', {points: points});
    }
  }

  rectPoints(pt1, pt2) {
    const points = [];
    points.push( new Point(pt1.x, pt1.y));
    points.push(new Point(pt2.x, pt1.y));
    points.push( new Point(pt2.x, pt2.y));
    points.push( new Point(pt1.x, pt2.y));
    points.push(new Point(pt1.x, pt1.y));
    return points;
  }
}
