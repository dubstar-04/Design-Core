import { Point } from './point.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { DesignCore } from '../designCore.js';

import { Property } from '../properties/property.js';
import { SnapPoint } from '../lib/auxiliary/snapPoint.js';
import { RubberBand } from '../lib/auxiliary/rubberBand.js';

/**
 * Circle Entity Class
 * @extends Entity
 */
export class Circle extends Entity {
  static type = 'Circle';

  /**
   * Create a Circle Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // radius: computed from points — stored in EntityProperties
    this.properties.add(Property.Names.RADIUS, {
      type: Property.Type.NUMBER,
      get: (entity) => entity.points[1] ? entity.points[0].distance(entity.points[1]) : 0,
      set: (entity, rad) => {
        entity.points[1] = entity.points[0].project(0, rad);
      },
      dxfCode: 40,
    });

    // Named scalar radius (internal API / named prop) — projects points[1] from center.
    // Full-points data (post-execute or post-fromDxf) skips this.
    if (data?.radius !== undefined && this.points.length < 2) {
      this.setRadius(data.radius);
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
   * Normalise DXF group codes into the canonical points-based representation.
   * Called by the DXF loader before construction.
   * @param {Object} data
   * @return {Object}
   */
  static fromDxf(data) {
    const center = data.points?.[0];
    if (!center || data[40] === undefined) return data;
    return {
      ...data,
      points: [center, center.project(0, data[40])],
    };
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.CENTER, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.RADIUS, [Input.Type.POINT, Input.Type.NUMBER], ['Diameter']);

      while (true) {
        const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
        if (pt2 === undefined) return;

        if (Input.getType(pt2) === Input.Type.POINT) {
          if (pt1.distance(pt2) <= 0) {
            DesignCore.Core.notify(`${this.type} - ${Strings.Error.NONZERO}`);
            continue;
          }
          this.points.push(pt2);
          break;
        } else if (Input.getType(pt2) === Input.Type.NUMBER) {
          if (pt2 <= 0) {
            DesignCore.Core.notify(`${this.type} - ${Strings.Error.NONZERO}`);
            continue;
          }
          this.setRadius(pt2);
          break;
        } else if (Input.getType(pt2) === Input.Type.STRING && pt2 === 'Diameter') {
          const op3 = new PromptOptions(Strings.Input.DIAMETER, [Input.Type.NUMBER]);
          while (true) {
            const diameter = await DesignCore.Scene.inputManager.requestInput(op3);
            if (diameter === undefined) return;
            if (diameter <= 0) {
              DesignCore.Core.notify(`${this.type} - ${Strings.Error.NONZERO}`);
              continue;
            }
            this.setRadius(diameter / 2);
            break;
          }
          break;
        }
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
      DesignCore.Scene.auxiliaryEntities.add(new RubberBand([this.points.at(0), mousePoint]));
      DesignCore.Scene.previewEntities.create(this.type, { points: [this.points.at(0), mousePoint] });
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
  /**
   * Draw the circle
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
    file.writeGroupCode('0', 'CIRCLE');
    file.writeGroupCode('5', this.getProperty(Property.Names.HANDLE), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbCircle', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.getProperty(Property.Names.LAYER));
    file.writeGroupCode('6', this.getProperty(Property.Names.LINETYPE));
    this.writeDxfColour(file);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('39', this.getProperty(Property.Names.LINEWIDTH));
    file.writeGroupCode('40', this.getProperty(Property.Names.RADIUS));
  }

  /**
   * Return a list of points representing a polyline version of this entity
   * @return {Array}
   */
  toPolylinePoints() {
    const radius = this.getProperty(Property.Names.RADIUS);
    const startPoint = this.points[0].project(0, radius);
    startPoint.bulge = 1;
    const endPoint = this.points[0].project(0, -radius);
    endPoint.bulge = 1;
    const closurePoint = this.points[0].project(0, radius);
    return [startPoint, endPoint, closurePoint];
  }

  /**
   * Set entity points from a polyline point representation.
   * If the points describe a full circle (start === end), mutates this Circle
   * in place and returns it. Otherwise creates and returns an Arc, since a
   * Circle cannot represent an open arc.
   * @param {Array} points
   * @return {Circle|Arc}
   */
  fromPolylinePoints(points) {
    if (points.length >= 3 && points[0].isSame(points.at(-1))) {
      const center = points[0].bulgeCentrePoint(points[1]);
      const radius = center.distance(points[0]);
      this.points = [center, center.project(0, radius)];
      return this;
    }
    const arc = DesignCore.CommandManager.createNew('Arc', this);
    arc.setProperty('handle', undefined);
    arc.fromPolylinePoints(points);
    return arc;
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];

    const centre = this.points[0]; // circle centre point

    const radius = this.getProperty(Property.Names.RADIUS);
    snaps.push(new SnapPoint(centre, SnapPoint.Type.CENTRE));

    snaps.push(
        new SnapPoint(new Point(centre.x + radius, centre.y), SnapPoint.Type.QUADRANT), // 0°
        new SnapPoint(new Point(centre.x, centre.y + radius), SnapPoint.Type.QUADRANT), // 90°
        new SnapPoint(new Point(centre.x - radius, centre.y), SnapPoint.Type.QUADRANT), // 180°
        new SnapPoint(new Point(centre.x, centre.y - radius), SnapPoint.Type.QUADRANT), // 270°
    );

    if (mousePoint) {
      const [nearestPoint, nearestDistance] = this.closestPoint(mousePoint);
      // Crude way to snap to the closest point on the circle
      if (nearestDistance < delta / 10) {
        snaps.push(new SnapPoint(nearestPoint, SnapPoint.Type.NEAREST));
      }
    }

    const fromPoint = DesignCore.Scene.inputManager.inputPoint; // last confirmed input point (line start)
    if (fromPoint !== null) {
      const distanceToCenter = centre.distance(fromPoint); // distance from the input point to the circle centre
      const angleFromCentreToInput = centre.angle(fromPoint); // angle from centre toward fromPoint

      // Tangent: only possible when fromPoint is outside the circle radius
      if (distanceToCenter > radius) {
        const tangentHalfAngle = Math.acos(radius / distanceToCenter); // half-angle between the two tangent directions

        snaps.push(new SnapPoint(centre.project(angleFromCentreToInput + tangentHalfAngle, radius), SnapPoint.Type.TANGENT));
        snaps.push(new SnapPoint(centre.project(angleFromCentreToInput - tangentHalfAngle, radius), SnapPoint.Type.TANGENT));
      }

      // Perpendicular: point on the circle that lies on the line from fromPoint through the centre
      if (distanceToCenter > 0) {
        snaps.push(new SnapPoint(centre.project(angleFromCentreToInput, radius), SnapPoint.Type.PERPENDICULAR));
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
    const radius = this.getProperty(Property.Names.RADIUS);
    const xmin = this.points[0].x - radius;
    const xmax = this.points[0].x + radius;
    const ymin = this.points[0].y - radius;
    const ymax = this.points[0].y + radius;

    const topLeft = new Point(xmin, ymax);
    const bottomRight = new Point(xmax, ymin);

    return new BoundingBox(topLeft, bottomRight);
  }
}
