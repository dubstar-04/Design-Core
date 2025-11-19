import { Point } from './point.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { Property } from '../properties/property.js';

import { DesignCore } from '../designCore.js';
import { AddState, RemoveState } from '../lib/stateManager.js';

/**
 * Circle Entity Class
 * @extends Entity
 */
export class Circle extends Entity {
  /**
   * Create a Circle Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // add radius property with getter and setter
    // needs to be enumerable to appear in the object props
    Object.defineProperty(this, 'radius', {
      get: this.getRadius,
      set: this.setRadius,
      enumerable: true,
    });

    if (data) {
      if (data.hasOwnProperty('radius') || data.hasOwnProperty('40')) {
        // DXF Groupcode 40 - Radius
        this.setRadius(Property.loadValue([data.radius, data[40]], 0));
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
    const command = { command: 'Circle', shortcut: 'C', type: 'Entity' };
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

      const op2 = new PromptOptions(Strings.Input.RADIUS, [Input.Type.POINT, Input.Type.NUMBER]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
      if (Input.getType(pt2) === Input.Type.POINT) {
        this.points.push(pt2);
      }

      if (Input.getType(pt2) === Input.Type.NUMBER) {
        this.setRadius(pt2);
      }
      DesignCore.Scene.inputManager.executeCommand(this);
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
   * Get Circle radius
   * @return {number} - circle radius
   */
  getRadius() {
    return this.points[0].distance(this.points[1]);
  }

  /**
   * Set Circle radius
   * @param {number} rad
   */
  setRadius(rad) {
    this.points[1] = this.points[0].project(0, rad);
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    ctx.arc(this.points[0].x, this.points[0].y, this.radius, 0, 6.283);
    ctx.stroke();
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'CIRCLE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbCircle', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    this.writeDxfColour(file);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('40', this.radius);
  }

  /**
   * Return a list of points representing a polyline version of this entity
   * @return {Array}
   */
  decompose() {
    const startPoint = this.points[0].project(0, this.radius);
    startPoint.bulge = 1;
    const endPoint = this.points[0].project(0, -this.radius);
    endPoint.bulge = 1;
    const closurePoint = this.points[0].project(0, this.radius);
    return [startPoint, endPoint, closurePoint];
  }

  /**
   * Trim the entity
   * @param {Array} points
   * @return {Array} - array of state changes
   */
  trim(points) {
    if (points.length > 1) {
      const start = points[0];
      const cen = DesignCore.Mouse.pointOnScene();
      const end = points[1];

      const arcPoints = [this.points[0]];

      const dir = (start.x - cen.x) * (end.y - cen.y) - (start.y - cen.y) * (end.x - cen.x);
      if (dir > 0) {
        arcPoints.push(points[0], points[1]);
      } else if (dir < 0) {
        arcPoints.push(points[1], points[0]);
      }


      const data = {
        points: arcPoints,
        colour: this.colour,
        layer: this.layer,
        lineWidth: this.lineWidth,
      };

      // DesignCore.Scene.addItem('Arc', data, DesignCore.Scene.items.indexOf(this));

      // create a new arc entity
      const arc = DesignCore.CommandManager.createNew('Arc', data);

      const stateChanges = [];
      // Remove the circle and add the new arc
      const removeState = new RemoveState(this);
      const addState = new AddState(arc);
      stateChanges.push(removeState, addState);
      return stateChanges;
    }
  }

  /**
   * Intersect points
   * @return {Object} - object defining data required by intersect methods
   */
  intersectPoints() {
    return {
      centre: this.points[0],
      radius: this.radius,
    };
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];

    if (DesignCore.Settings.centresnap) {
      const centre = new Point(this.points[0].x, this.points[0].y);
      snaps.push(centre);
    }

    if (DesignCore.Settings.quadrantsnap) {
      const angle0 = new Point(this.points[0].x + this.radius, this.points[0].y);
      const angle90 = new Point(this.points[0].x, this.points[0].y + this.radius);
      const angle180 = new Point(this.points[0].x - this.radius, this.points[0].y);
      const angle270 = new Point(this.points[0].x, this.points[0].y - this.radius);

      snaps.push(angle0, angle90, angle180, angle270);
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
    // find the closest point on the circle
    const closest = P.closestPointOnArc(this.points[1], this.points[1], this.points[0]);
    const distance = closest.distance(P);

    return [closest, distance];
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    const xmin = this.points[0].x - this.radius;
    const xmax = this.points[0].x + this.radius;
    const ymin = this.points[0].y - this.radius;
    const ymax = this.points[0].y + this.radius;

    const topLeft = new Point(xmin, ymax);
    const bottomRight = new Point(xmax, ymin);

    return new BoundingBox(topLeft, bottomRight);
  }
}
