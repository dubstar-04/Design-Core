import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Offset Command Class
 * @extends Tool
 */
export class Offset extends Tool {
  /** Create an Offset command */
  constructor() {
    super();
    this.offsetDistance = 0;
    this.selectedItem = null;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Offset', shortcut: 'O' }; // , type: 'Tool' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      // Initialise from the last used offset distance stored in headers
      const storedDistance = DesignCore.Scene.headers.offsetDistance;
      if (storedDistance > 0) this.offsetDistance = storedDistance;

      const op = new PromptOptions(Strings.Input.DISTANCE, [Input.Type.NUMBER], ['Through']);
      const distanceInput = await DesignCore.Scene.inputManager.requestInput(op);
      if (distanceInput === undefined) return;

      if (Input.getType(distanceInput) === Input.Type.STRING && distanceInput === 'Through') {
        DesignCore.Scene.headers.offsetDistance = -1;
        // Through mode: select entity, then specify a through point
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const selection = await DesignCore.Scene.inputManager.requestInput(op2);
          if (selection === undefined) break;
          this.selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);

          const op3 = new PromptOptions(Strings.Input.THROUGHPOINT, [Input.Type.POINT]);
          const throughPoint = await DesignCore.Scene.inputManager.requestInput(op3);
          if (throughPoint === undefined) break;

          this.offsetDistance = this.getThroughDistance(this.selectedItem, throughPoint);
          this.points = [throughPoint];
          DesignCore.Scene.inputManager.actionCommand();
        }
      } else {
        // Distance mode
        this.offsetDistance = distanceInput;

        if (this.offsetDistance <= 0) {
          DesignCore.Core.notify(`${this.type} - ${Strings.Error.NONZERO}`);
          return;
        }

        DesignCore.Scene.headers.offsetDistance = this.offsetDistance;

        // Select entity and side point (repeating)
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const selection = await DesignCore.Scene.inputManager.requestInput(op2);
          if (selection === undefined) break;
          this.selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);

          const op3 = new PromptOptions(Strings.Input.SIDE, [Input.Type.POINT]);
          const sidePoint = await DesignCore.Scene.inputManager.requestInput(op3);
          if (sidePoint === undefined) break;

          this.points = [sidePoint];
          DesignCore.Scene.inputManager.actionCommand();
        }
      }

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    if (this.selectedItem && this.offsetDistance > 0) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const offsetPoints = this.getOffsetPoints(this.selectedItem, mousePoint, this.offsetDistance);

      if (offsetPoints) {
        const data = { points: offsetPoints };

        if (this.selectedItem.type === 'Arc') {
          data.direction = this.selectedItem.direction;
        } else if (this.selectedItem.type === 'Polyline') {
          data.flags = this.selectedItem.flags;
        }

        DesignCore.Scene.tempEntities.create(this.selectedItem.type, data);
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    if (!this.selectedItem || this.offsetDistance <= 0) return;

    const sidePoint = this.points[0];
    const entity = this.selectedItem;
    const offsetPoints = this.getOffsetPoints(entity, sidePoint, this.offsetDistance);

    if (!offsetPoints) {
      Logging.instance.warn(`${this.type}: ${entity.type} ${Strings.Message.CANNOTBEACTIONED}`);
      return;
    }

    const offsetEntity = Utils.cloneObject(entity);
    offsetEntity.setProperty('points', offsetPoints);

    if (entity.type === 'Arc') {
      offsetEntity.radius = entity.points[0].distance(offsetPoints[1]);
    }

    const stateChange = new AddState(offsetEntity);
    DesignCore.Scene.commit([stateChange]);
  }

  /**
   * Get offset points for an entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset points or null if unsupported
   */
  getOffsetPoints(entity, sidePoint, distance) {
    switch (entity.type) {
      case 'Line':
        return this.getOffsetLinePoints(entity, sidePoint, distance);
      case 'Circle':
        return this.getOffsetCirclePoints(entity, sidePoint, distance);
      case 'Arc':
        return this.getOffsetArcPoints(entity, sidePoint, distance);
      case 'Polyline':
        return this.getOffsetPolylinePoints(entity, sidePoint, distance);
      default:
        return null;
    }
  }

  /**
   * Get offset points for a line entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array} offset line points
   */
  getOffsetLinePoints(entity, sidePoint, distance) {
    const p1 = entity.points[0];
    const p2 = entity.points[1];

    // Line direction and perpendicular normal
    const direction = p2.subtract(p1);
    const normal = new Point(-direction.y, direction.x).normalise();

    // Determine which side using cross product
    const toSide = sidePoint.subtract(p1);
    const sign = direction.cross(toSide) >= 0 ? 1 : -1;

    const offset = normal.scale(distance * sign);
    return [p1.add(offset), p2.add(offset)];
  }

  /**
   * Get offset points for a circle entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset circle points or null if radius would be non-positive
   */
  getOffsetCirclePoints(entity, sidePoint, distance) {
    const center = entity.points[0];
    const currentRadius = center.distance(entity.points[1]);

    // Outside: grow, Inside: shrink
    const distFromCenter = center.distance(sidePoint);
    const newRadius = distFromCenter >= currentRadius ?
      currentRadius + distance :
      currentRadius - distance;

    if (newRadius <= 0) return null;

    const angle = center.angle(entity.points[1]);
    return [center, center.project(angle, newRadius)];
  }

  /**
   * Get offset points for an arc entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset arc points or null if radius would be non-positive
   */
  getOffsetArcPoints(entity, sidePoint, distance) {
    const center = entity.points[0];
    const currentRadius = center.distance(entity.points[1]);

    const distFromCenter = center.distance(sidePoint);
    const newRadius = distFromCenter >= currentRadius ?
      currentRadius + distance :
      currentRadius - distance;

    if (newRadius <= 0) return null;

    // Preserve start and end angles
    const startAngle = center.angle(entity.points[1]);
    const endAngle = center.angle(entity.points[2]);

    return [center, center.project(startAngle, newRadius), center.project(endAngle, newRadius)];
  }

  /**
   * Get offset points for a polyline entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset points or null if unsupported
   */
  getOffsetPolylinePoints(entity, sidePoint, distance) {
    const points = entity.points;
    const isClosed = entity.flags.hasFlag(1);
    const n = points.length;
    if (n < 2) return null;

    const segCount = isClosed ? n : n - 1;

    // Determine offset sign from the closest segment to sidePoint
    let sign = 1;
    let minDist = Infinity;
    for (let i = 0; i < segCount; i++) {
      const A = points[i];
      const B = points[(i + 1) % n];
      if (A.bulge === 0) {
        const dir = B.subtract(A);
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        if (len > 0) {
          const cross = dir.cross(sidePoint.subtract(A));
          const dist = Math.abs(cross) / len;
          if (dist < minDist) {
            minDist = dist;
            sign = cross >= 0 ? 1 : -1;
          }
        }
      } else {
        const center = A.bulgeCentrePoint(B);
        const currentRadius = center.distance(A);
        const arcDir = A.bulge > 0 ? 1 : -1;
        const distToCenter = center.distance(sidePoint);
        const dist = Math.abs(distToCenter - currentRadius);
        if (dist < minDist) {
          minDist = dist;
          // CCW arc: left of travel = outward; CW arc: left of travel = inward
          sign = arcDir > 0
            ? (distToCenter >= currentRadius ? 1 : -1)
            : (distToCenter >= currentRadius ? -1 : 1);
        }
      }
    }

    // Compute the offset segment data for each segment
    const offsetSegs = [];
    for (let i = 0; i < segCount; i++) {
      const A = points[i];
      const B = points[(i + 1) % n];
      if (A.bulge === 0) {
        const dir = B.subtract(A);
        const normal = new Point(-dir.y, dir.x).normalise();
        const ox = normal.x * distance * sign;
        const oy = normal.y * distance * sign;
        offsetSegs.push({
          type: 'line',
          A: new Point(A.x + ox, A.y + oy),
          B: new Point(B.x + ox, B.y + oy),
          bulge: 0,
        });
      } else {
        const center = A.bulgeCentrePoint(B);
        const currentRadius = center.distance(A);
        const arcDir = A.bulge > 0 ? 1 : -1;
        const newRadius = currentRadius + arcDir * distance * sign;
        if (newRadius <= 0) return null;
        const startAngle = Math.atan2(A.y - center.y, A.x - center.x);
        const endAngle = Math.atan2(B.y - center.y, B.x - center.x);
        offsetSegs.push({
          type: 'arc',
          A: new Point(center.x + newRadius * Math.cos(startAngle), center.y + newRadius * Math.sin(startAngle)),
          B: new Point(center.x + newRadius * Math.cos(endAngle), center.y + newRadius * Math.sin(endAngle)),
          bulge: A.bulge,
        });
      }
    }

    // At each junction between consecutive offset segments, compute the meeting point
    const findJunction = (seg, nextSeg) => {
      if (seg.type === 'line' && nextSeg.type === 'line') {
        return this.lineLineIntersect(seg.A, seg.B, nextSeg.A, nextSeg.B);
      }
      // Mixed or arc-arc: use the midpoint between the two endpoints
      return new Point((seg.B.x + nextSeg.A.x) / 2, (seg.B.y + nextSeg.A.y) / 2);
    };

    const newPoints = [];
    if (!isClosed) {
      newPoints.push(new Point(offsetSegs[0].A.x, offsetSegs[0].A.y, offsetSegs[0].bulge));
      for (let i = 0; i < segCount - 1; i++) {
        const junction = findJunction(offsetSegs[i], offsetSegs[i + 1]);
        newPoints.push(new Point(junction.x, junction.y, offsetSegs[i + 1].bulge));
      }
      newPoints.push(new Point(offsetSegs[segCount - 1].B.x, offsetSegs[segCount - 1].B.y, 0));
    } else {
      for (let i = 0; i < segCount; i++) {
        const nextSeg = offsetSegs[(i + 1) % segCount];
        const junction = findJunction(offsetSegs[i], nextSeg);
        newPoints.push(new Point(junction.x, junction.y, nextSeg.bulge));
      }
    }

    return newPoints;
  }

  /**
   * Find the intersection of two infinite lines defined by A,B and C,D
   * @param {Point} A
   * @param {Point} B
   * @param {Point} C
   * @param {Point} D
   * @return {Point}
   */
  lineLineIntersect(A, B, C, D) {
    const d1 = B.subtract(A);
    const d2 = D.subtract(C);
    const det = d1.cross(d2);
    if (Math.abs(det) < 1e-10) {
      return new Point((B.x + C.x) / 2, (B.y + C.y) / 2);
    }
    const t = C.subtract(A).cross(d2) / det;
    return new Point(A.x + t * d1.x, A.y + t * d1.y);
  }

  /**
   * Calculate through distance from entity to through point
   * @param {Object} entity
   * @param {Point} throughPoint
   * @return {number} distance
   */
  getThroughDistance(entity, throughPoint) {
    switch (entity.type) {
      case 'Line': {
        const closest = throughPoint.perpendicular(entity.points[0], entity.points[1]);
        return throughPoint.distance(closest);
      }
      case 'Circle':
      case 'Arc': {
        const center = entity.points[0];
        const currentRadius = center.distance(entity.points[1]);
        return Math.abs(center.distance(throughPoint) - currentRadius);
      }
      case 'Polyline': {
        const closest = entity.closestPoint(throughPoint);
        return closest[1];
      }
      default:
        return 0;
    }
  }
}
