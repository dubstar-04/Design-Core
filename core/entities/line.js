import { Point } from './point.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';


import { DesignCore } from '../designCore.js';

import { SnapPoint } from '../lib/auxiliary/snapPoint.js';


/**
 * Line Entity Class
 * @extends Entity
 */
export class Line extends Entity {
  static type = 'Line';

  /**
   * Create a Line Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    if (data) {
      if (data.hasOwnProperty('points')) {
        // clear points
        this.points = [];

        const startPoint = data.points.at(-2);
        const endPoint = data.points.at(-1);
        this.points.push(new Point(startPoint.x, startPoint.y));
        this.points.push(new Point(endPoint.x, endPoint.y));
      }
    }
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Line', shortcut: 'L', type: 'Entity' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      while (true) {
        const canClose = this.points.length >= 3;
        const options = canClose ? ['Close'] : [];
        const op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT, Input.Type.DYNAMIC], options);
        const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
        if (pt2 === undefined) break;

        if (Input.getType(pt2) === Input.Type.STRING && pt2 === 'Close') {
          this.points.push(pt1);
          DesignCore.Scene.inputManager.executeCommand(this);
          return;
        }

        this.points.push(pt2);
        DesignCore.Scene.inputManager.actionCommand(this);
      }
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (this.points.length >= 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const points = [this.points.at(-1), mousePoint];
      DesignCore.Scene.previewEntities.create(this.type, { points: points });
    }
  }

  /**
   * Draw the entity
   * @param {Object} renderer
   */
  draw(renderer) {
    renderer.drawShape(this.toPolylinePoints());
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'LINE');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbLine', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('6', this.lineType);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('11', this.points[1].x);
    file.writeGroupCode('21', this.points[1].y);
    file.writeGroupCode('31', '0.0');
    file.writeGroupCode('39', this.lineWidth);
  }

  /**
   * Return a list of points representing a polyline version of this entity
   * @return {Array}
   */
  toPolylinePoints() {
    return this.points;
  }

  /**
   * Set entity points from a polyline point representation
   * @param {Array} points
   * @return {Line}
   */
  fromPolylinePoints(points) {
    this.points = [new Point(points[0].x, points[0].y), new Point(points[1].x, points[1].y)];
    return this;
  }

  /**
   * Get the length of a line
   * @return {number}
   */
  length() {
    const A = (this.points[0].x - this.points[1].x);
    const B = (this.points[0].y - this.points[1].y);
    const ASQ = Math.pow(A, 2);
    const BSQ = Math.pow(B, 2);
    const dist = Math.sqrt(ASQ + BSQ);

    return dist;
  }

  /**
   * Get the lines mid point
   * @return {Point}
   */
  midPoint() {
    const midPoint = this.points[0].midPoint(this.points[1]);
    return midPoint;
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];

    snaps.push(new SnapPoint(this.points[0], SnapPoint.Type.END));
    snaps.push(new SnapPoint(this.points[1], SnapPoint.Type.END));

    snaps.push(new SnapPoint(this.midPoint(), SnapPoint.Type.MID));

    if (mousePoint) {
      const closest = this.closestPoint(mousePoint);
      // Crude way to snap to the closest point or a node
      if (closest[1] < delta / 10) {
        snaps.push(new SnapPoint(closest[0], SnapPoint.Type.NEAREST));
      }
    }

    const fromPoint = DesignCore.Scene.inputManager.inputPoint;
    if (fromPoint !== null) {
      const foot = fromPoint.perpendicular(this.points[0], this.points[1]);
      if (foot.isOnLine(this.points[0], this.points[1])) {
        snaps.push(new SnapPoint(foot, SnapPoint.Type.PERPENDICULAR));
      }
    }

    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    const pnt = P.closestPointOnLine(this.points[0], this.points[1]);
    if (pnt === null) {
      return [P, Infinity];
    }

    const distance = P.distance(pnt);
    return [pnt, distance];
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    return BoundingBox.lineBoundingBox(this.points[0], this.points[1]);
  }
}
