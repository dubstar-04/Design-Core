import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState } from '../lib/stateManager.js';
import { Intersection } from '../lib/intersect.js';

import { DesignCore } from '../designCore.js';

/**
 * Offset Command Class
 * @extends Tool
 */
export class Offset extends Tool {
  static type = 'Offset';

  /** Create an Offset command */
  constructor() {
    super();
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
      const defaultValue = storedDistance > 0 ? storedDistance : undefined;

      const op = new PromptOptions(Strings.Input.DISTANCE, [Input.Type.NUMBER], ['Through'], defaultValue);
      const distanceInput = await DesignCore.Scene.inputManager.requestInput(op);
      if (distanceInput === undefined) return;

      const throughMode = Input.getType(distanceInput) === Input.Type.STRING && distanceInput === 'Through';

      if (throughMode) {
        DesignCore.Scene.headers.offsetDistance = -1;
      } else {
        const distance = distanceInput;
        if (distance <= 0) {
          DesignCore.Core.notify(`${this.type} - ${Strings.Error.NONZERO}`);
          return;
        }
        DesignCore.Scene.headers.offsetDistance = distance;
      }

      const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
      const op3 = new PromptOptions(throughMode ? Strings.Input.THROUGHPOINT : Strings.Input.SIDE, [Input.Type.POINT]);

      while (true) {
        const preselected = DesignCore.Scene.selectionManager.selectionSet.selectionSet;
        if (preselected.length === 1) {
          this.selectedItem = DesignCore.Scene.entities.get(preselected[0]);
          DesignCore.Scene.selectionManager.reset();
        } else {
          DesignCore.Scene.selectionManager.reset();
          const selection = await DesignCore.Scene.inputManager.requestInput(op2);
          if (selection === undefined) break;
          this.selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);
          DesignCore.Scene.selectionManager.removeLastSelection();
        }

        const point = await DesignCore.Scene.inputManager.requestInput(op3);
        if (point === undefined) {
          this.selectedItem = null;
          break;
        }

        if (throughMode) {
          DesignCore.Scene.headers.offsetDistance = this.getThroughDistance(this.selectedItem, point);
        }
        this.points = [point];
        DesignCore.Scene.inputManager.actionCommand();
        this.selectedItem = null;
      }

      DesignCore.Scene.inputManager.reset();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    const offsetDistance = DesignCore.Scene.headers.offsetDistance;
    if (this.selectedItem && offsetDistance > 0) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const offsetPoints = this.getOffsetPoints(this.selectedItem, mousePoint, offsetDistance);

      if (offsetPoints) {
        const previewEntity = Utils.cloneObject(this.selectedItem).fromPolylinePoints(offsetPoints);
        DesignCore.Scene.previewEntities.add(previewEntity);
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    const offsetDistance = DesignCore.Scene.headers.offsetDistance;
    if (!this.selectedItem || offsetDistance <= 0) return;

    const sidePoint = this.points[0];
    const entity = this.selectedItem;
    const offsetPoints = this.getOffsetPoints(entity, sidePoint, offsetDistance);

    if (!offsetPoints) {
      Logging.instance.warn(`${this.type}: ${entity.type} ${Strings.Message.CANNOTBEACTIONED}`);
      return;
    }

    const offsetEntity = Utils.cloneObject(entity).fromPolylinePoints(offsetPoints);

    const stateChange = new AddState(offsetEntity);
    DesignCore.Scene.commit([stateChange]);
  }

  /**
   * Get offset points for an entity in polyline point format
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset polyline points or null if unsupported
   */
  getOffsetPoints(entity, sidePoint, distance) {
    if (typeof entity.toPolylinePoints !== 'function') return null;

    const polyPts = entity.toPolylinePoints();
    if (!polyPts || polyPts.length < 2) return null;

    const isClosed = polyPts.length >= 3 && polyPts[0].isSame(polyPts.at(-1));
    const points = isClosed ? polyPts.slice(0, -1) : polyPts;

    return this.getOffsetPolylinePoints(points, isClosed, sidePoint, distance);
  }

  /**
   * Get offset points for polyline points
   * @param {Array} points
   * @param {boolean} isClosed
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset points or null if unsupported
   */
  getOffsetPolylinePoints(points, isClosed, sidePoint, distance) {
    const n = points.length;
    if (n < 2) return null;

    const segCount = isClosed ? n : n - 1;

    // Determine offset sign from the closest segment to sidePoint.
    // Use the actual distance to the segment (not the infinite-line perpendicular)
    // so that sidePoints projecting beyond a segment endpoint pick the correct segment.
    let sign = 1;
    let minDist = Infinity;
    for (let i = 0; i < segCount; i++) {
      const A = points[i];
      const B = points[(i + 1) % n];
      if (A.bulge === 0) {
        const closestPt = sidePoint.closestPointOnLine(A, B);
        if (closestPt === null) continue;
        const dist = sidePoint.distance(closestPt);
        if (dist < minDist) {
          minDist = dist;
          const dir = B.subtract(A);
          const cross = dir.cross(sidePoint.subtract(A));
          sign = cross >= 0 ? 1 : -1;
        }
      } else {
        const center = A.bulgeCentrePoint(B);
        const currentRadius = center.distance(A);
        const arcDir = A.bulge > 0 ? 1 : -1;
        const closestPt = sidePoint.closestPointOnArc(A, B, center, arcDir);
        if (closestPt === null) continue;
        const dist = sidePoint.distance(closestPt);
        if (dist < minDist) {
          minDist = dist;
          const distToCenter = center.distance(sidePoint);
          // For CCW arc (arcDir>0): left of travel = toward center (smaller radius)
          // For CW arc (arcDir<0): left of travel = away from center (larger radius)
          sign = arcDir > 0 ?
            (distToCenter < currentRadius ? 1 : -1) :
            (distToCenter >= currentRadius ? 1 : -1);
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
        const offset = normal.scale(distance * sign);
        offsetSegs.push({
          type: 'line',
          A: A.add(offset),
          B: B.add(offset),
          bulge: 0,
        });
      } else {
        const center = A.bulgeCentrePoint(B);
        const currentRadius = center.distance(A);
        const arcDir = A.bulge > 0 ? 1 : -1;
        const newRadius = currentRadius - arcDir * distance * sign;
        if (newRadius <= 0) return null;
        const startAngle = Math.atan2(A.y - center.y, A.x - center.x);
        const endAngle = Math.atan2(B.y - center.y, B.x - center.x);
        offsetSegs.push({
          type: 'arc',
          A: new Point(center.x + newRadius * Math.cos(startAngle), center.y + newRadius * Math.sin(startAngle)),
          B: new Point(center.x + newRadius * Math.cos(endAngle), center.y + newRadius * Math.sin(endAngle)),
          bulge: A.bulge,
          center,
          radius: newRadius,
        });
      }
    }

    const newPoints = [];
    if (!isClosed) {
      newPoints.push(new Point(offsetSegs[0].A.x, offsetSegs[0].A.y, offsetSegs[0].bulge));
      for (let i = 0; i < segCount - 1; i++) {
        const junction = this.findJunction(offsetSegs[i], offsetSegs[i + 1]);
        newPoints.push(new Point(junction.x, junction.y, offsetSegs[i + 1].bulge));
      }
      newPoints.push(new Point(offsetSegs[segCount - 1].B.x, offsetSegs[segCount - 1].B.y, 0));
    } else {
      for (let i = 0; i < segCount; i++) {
        const nextSeg = offsetSegs[(i + 1) % segCount];
        const junction = this.findJunction(offsetSegs[i], nextSeg);
        newPoints.push(new Point(junction.x, junction.y, nextSeg.bulge));
      }
    }

    return newPoints;
  }

  /**
   * Find the junction point between two consecutive offset segments
   * @param {Object} seg
   * @param {Object} nextSeg
   * @return {Point}
   */
  findJunction(seg, nextSeg) {
    const midpoint = new Point((seg.B.x + nextSeg.A.x) / 2, (seg.B.y + nextSeg.A.y) / 2);

    const segA = new Point(seg.A.x, seg.A.y, seg.bulge);
    const segB = new Point(seg.B.x, seg.B.y);
    const nextA = new Point(nextSeg.A.x, nextSeg.A.y, nextSeg.bulge);
    const nextB = new Point(nextSeg.B.x, nextSeg.B.y);

    const result = Intersection.intersectSegmentSegment(segA, segB, nextA, nextB, true, true);
    const candidates = result.points;

    if (candidates.length === 0) return midpoint;
    if (candidates.length === 1) return candidates[0];

    return candidates[0].distance(midpoint) <= candidates[1].distance(midpoint) ? candidates[0] : candidates[1];
  }

  /**
   * Calculate through distance from entity to through point
   * @param {Object} entity
   * @param {Point} throughPoint
   * @return {number} distance
   */
  getThroughDistance(entity, throughPoint) {
    if (typeof entity.toPolylinePoints !== 'function') return 0;

    const polyPts = entity.toPolylinePoints();
    if (!polyPts || polyPts.length < 2) return 0;

    const isClosed = polyPts.length >= 3 && polyPts[0].isSame(polyPts.at(-1));
    const points = isClosed ? polyPts.slice(0, -1) : polyPts;
    const n = points.length;
    const segCount = isClosed ? n : n - 1;

    let minDist = Infinity;

    for (let i = 0; i < segCount; i++) {
      const A = points[i];
      const B = points[(i + 1) % n];

      if (A.bulge === 0) {
        const closest = throughPoint.perpendicular(A, B);
        const dist = throughPoint.distance(closest);
        if (dist < minDist) minDist = dist;
      } else {
        const center = A.bulgeCentrePoint(B);
        const radius = center.distance(A);
        const dist = Math.abs(center.distance(throughPoint) - radius);
        if (dist < minDist) minDist = dist;
      }
    }

    return minDist === Infinity ? 0 : minDist;
  }
}
