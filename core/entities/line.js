import { Point } from './point.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { AddState, RemoveState, UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';
import { Utils } from '../lib/utils.js';


/**
 * Line Entity Class
 * @extends Entity
 */
export class Line extends Entity {
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
      this.points.push(pt1);

      let pt2;
      const op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT, Input.Type.DYNAMIC]);
      while (true) {
        pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
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
      DesignCore.Scene.tempEntities.create(this.type, { points: points });
    }
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    ctx.moveTo(this.points[0].x, this.points[0].y);
    ctx.lineTo(this.points[1].x, this.points[1].y);
    ctx.stroke();
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'LINE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbLine', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('11', this.points[1].x);
    file.writeGroupCode('21', this.points[1].y);
    file.writeGroupCode('31', '0.0');
  }

  /**
   * Return a list of points representing a polyline version of this entity
   * @return {Array}
   */
  decompose() {
    return this.points;
  }

  /**
   * Trim the entity
   * @param {Array} intersections
   * @return {Array} - array of state changes
   */
  trim(intersections) {
    // array to hold state changes
    const stateChanges = [];

    // get the mouse position
    const mousePosition = DesignCore.Mouse.pointOnScene();
    // get the point on the line closest to the mouse
    const pointOnLine = mousePosition.closestPointOnLine(this.points[0], this.points[1]);

    // remove any intersections that are at the end points of the line
    intersections = intersections.filter((p) => !p.isSame(this.points[0]) || !p.isSame(this.points[1]));

    Utils.sortPointsByDistance(intersections, this.points[0]);

    // Add line points to the start and the end of the point array
    const testPoints = [this.points[0], ...intersections, this.points[1]];

    // Test if mouse position is between two intersection points
    if (testPoints.length > 1) {
      for (let i = 0; i < testPoints.length - 1; i++) {
        const startPoint = testPoints[i];
        const endPoint = testPoints[i + 1];

        // check if the mouse is between startPoint and endPoint
        if (pointOnLine.isOnLine(startPoint, endPoint)) {
          const newPoints = [];

          for (const p of testPoints) {
            const inOriginalLine = this.points.indexOf(p) !== -1;
            const inIntersections = intersections.indexOf(p) !== -1;

            // Keep points which:
            // - The mouse is between are intersections
            // - The mouse is not between and in this line
            const isBetween = p.isSame(startPoint) || p.isSame(endPoint);
            if ((isBetween && inIntersections) || (!isBetween && inOriginalLine)) {
              newPoints.push(p);
            }
          }

          if (newPoints.length % 2 === 0) {
            // Add lines for each point pair
            for (let j = 0; j < newPoints.length; j += 2) {
              const line = Utils.cloneObject(this);
              line.points = [newPoints[j], newPoints[j + 1]];
              const addState = new AddState(line);
              stateChanges.push(addState);
            }
          }
          // Remove the existing line
          const removeState = new RemoveState(this);
          stateChanges.push(removeState);
        }
      }
    }

    return stateChanges;
  }

  /**
   * Extend the entity
   * @param {Array} intersections
   * @return {Array} - array of state changes
   */
  extend(intersections) {
    // array to hold state changes
    const stateChanges = [];
    let originPoint;

    // Find which end is closer to the mouse
    if (this.points[0].distance(DesignCore.Mouse.pointOnScene()) < this.points[1].distance(DesignCore.Mouse.pointOnScene())) {
      originPoint = 0;
    } else {
      originPoint = 1;
    }

    Utils.sortPointsByDistance(intersections, this.points[originPoint]);
    // closest point is the extension point
    const newEndPoint = intersections.at(0);

    if (newEndPoint.distance(this.points[originPoint]) > newEndPoint.distance(this.points[1 - originPoint])) {
      // end of the line selected is further away than the opposite end - no extension
      return stateChanges;
    }

    const newPoints = [];
    if (originPoint === 0) {
      newPoints.push(newEndPoint, this.points[1]);
    } else {
      newPoints.push(this.points[0], newEndPoint);
    }

    if (newPoints[0].isSame(this.points[0]) && newPoints[1].isSame(this.points[1])) {
      // No change
      return stateChanges;
    }

    // update the line
    const addState = new UpdateState(this, { points: newPoints });
    stateChanges.push(addState);

    return stateChanges;
  }

  /**
   * Intersect points
   * @return {Object} - object defining data required by intersect methods
   */
  intersectPoints() {
    return {
      start: this.points[0],
      end: this.points[1],
    };
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

    if (DesignCore.Settings.endsnap) {
      const start = new Point(this.points[0].x, this.points[0].y);
      const end = new Point(this.points[1].x, this.points[1].y);
      snaps.push(start, end);
    }

    if (DesignCore.Settings.midsnap) {
      snaps.push(this.midPoint());
    }

    if (DesignCore.Settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint);

      // Crude way to snap to the closest point or a node
      if (closest[1] < delta / 10) {
        snaps.push(closest[0]);
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
