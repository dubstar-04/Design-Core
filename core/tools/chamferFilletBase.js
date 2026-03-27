import { Tool } from './tool.js';
import { Strings } from '../lib/strings.js';
import { Point } from '../entities/point.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { RemoveState, UpdateState } from '../lib/stateManager.js';
import { CornerEntity } from './cornerEntity.js';

import { DesignCore } from '../designCore.js';

/**
 * ChamferFilletBase Class
 * Base class for Chamfer and Fillet commands, providing shared entity selection
 * state, segment resolution, and sharp-trim logic.
 * @extends Tool
 */
export class ChamferFilletBase extends Tool {
  /** Create a ChamferFilletBase command */
  constructor() {
    super();
    this.first = new CornerEntity();
    this.second = new CornerEntity();
    // Shared corner geometry computed by resolveCornerGeometry() before action()
    // If the lines form a cross there are four possible locations.
    // The click points are used to determine which corner to operate on.
    this.intersectionPoint = null;
    this.secondLineDirection = null;
  }

  /**
   * Resolve a CornerEntity's entity to its closest straight segment.
   * Populates corner.segment and corner.segmentIndex for polyline entities.
   * Returns false and notifies the user if the closest segment is an arc.
   * @param {CornerEntity} corner
   * @param {string} arcSegmentErrorMsg - notification string shown when the segment is an arc
   * @return {boolean}
   */
  resolveSegment(corner, arcSegmentErrorMsg) {
    if (!(corner.entity instanceof BasePolyline)) return true;
    const index = corner.entity.getClosestSegmentIndex(corner.clickPoint);
    const segment = corner.entity.getClosestSegment(corner.clickPoint);
    if (!(segment instanceof Line)) {
      DesignCore.Core.notify(arcSegmentErrorMsg);
      return false;
    }
    corner.segment = segment;
    corner.segmentIndex = index;
    return true;
  }

  /**
   * Compute the corner geometry shared by Fillet and Chamfer and store it on the instance.
   * Validates that both resolved segments are Lines, finds the virtual intersection
   * of the two infinite lines, and derives click-side directions and kept endpoints.
   * Returns false and notifies the user on any invalid configuration.
   * @param {string} noEntityMsg - message shown when a resolved segment is not a Line
   * @return {boolean}
   */
  resolveCornerGeometry(noEntityMsg) {
    const firstSeg = this.first.segment ?? this.first.entity;
    const secondSeg = this.second.segment ?? this.second.entity;

    if (!(firstSeg instanceof Line)) {
      DesignCore.Core.notify(`${this.first.entity.type} ${noEntityMsg}`);
      return false;
    }
    if (!(secondSeg instanceof Line)) {
      DesignCore.Core.notify(`${this.second.entity.type} ${noEntityMsg}`);
      return false;
    }

    this.first.lineStart = firstSeg.points[0];
    this.first.lineEnd = firstSeg.points[1];
    this.second.lineStart = secondSeg.points[0];
    this.second.lineEnd = secondSeg.points[1];

    const firstLineDirection = this.first.lineEnd.subtract(this.first.lineStart);
    this.secondLineDirection = this.second.lineEnd.subtract(this.second.lineStart);
    const directionCross = firstLineDirection.cross(this.secondLineDirection);

    if (Math.abs(directionCross) < 1e-10) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return false;
    }

    const startDiff = this.second.lineStart.subtract(this.first.lineStart);
    const intersectParam = startDiff.cross(this.secondLineDirection) / directionCross;
    this.intersectionPoint = this.first.lineStart.lerp(this.first.lineEnd, intersectParam);

    const firstClickOnLine = this.first.clickPoint.perpendicular(this.first.lineStart, this.first.lineEnd);
    const secondClickOnLine = this.second.clickPoint.perpendicular(this.second.lineStart, this.second.lineEnd);

    this.first.clickDistance = firstClickOnLine.distance(this.intersectionPoint);
    this.second.clickDistance = secondClickOnLine.distance(this.intersectionPoint);

    this.first.clickDir = firstClickOnLine.subtract(this.intersectionPoint);
    this.second.clickDir = secondClickOnLine.subtract(this.intersectionPoint);

    this.first.lineKeptEnd = this.first.clickDir.dot(this.first.lineStart.subtract(this.intersectionPoint)) >= this.first.clickDir.dot(this.first.lineEnd.subtract(this.intersectionPoint)) ? this.first.lineStart : this.first.lineEnd;
    this.second.lineKeptEnd = this.second.clickDir.dot(this.second.lineStart.subtract(this.intersectionPoint)) >= this.second.clickDir.dot(this.second.lineEnd.subtract(this.intersectionPoint)) ? this.second.lineStart : this.second.lineEnd;

    this.first.clickUnit = new Point(this.first.clickDir.x / this.first.clickDistance, this.first.clickDir.y / this.first.clickDistance);
    this.second.clickUnit = new Point(this.second.clickDir.x / this.second.clickDistance, this.second.clickDir.y / this.second.clickDistance);

    return true;
  }

  /**
   * Trim both entities to the sharp intersection point with no arc or chamfer line.
   * Handles Line+Line, Polyline+Polyline (same entity), and Line+Polyline cases.
   * Reads geometry from instance fields set by resolveCornerGeometry().
   * @return {Array} - array of state changes to be committed by the caller
   */
  applySharpTrim() {
    const firstIsPolyline = this.first.entity instanceof BasePolyline;
    const secondIsPolyline = this.second.entity instanceof BasePolyline;
    const { intersectionPoint } = this;
    let stateChanges;
    if (!firstIsPolyline && !secondIsPolyline) {
      stateChanges = [
        new UpdateState(this.first.entity, { points: [this.first.lineKeptEnd, intersectionPoint] }),
        new UpdateState(this.second.entity, { points: [this.second.lineKeptEnd, intersectionPoint] }),
      ];
    } else if (firstIsPolyline && secondIsPolyline && this.first.entity === this.second.entity) {
      const lastIdx = this.first.entity.points.length - 1;
      const isOpenEnds = (this.first.segmentIndex === 1 && this.second.segmentIndex === lastIdx) ||
                         (this.first.segmentIndex === lastIdx && this.second.segmentIndex === 1);
      const newPoints = this.first.entity.points.map((p) => p.clone());
      if (isOpenEnds) {
        newPoints[0] = intersectionPoint.clone();
        newPoints[lastIdx] = intersectionPoint.clone();
      } else {
        const cornerIdx = Math.min(this.first.segmentIndex, this.second.segmentIndex);
        newPoints.splice(cornerIdx, 1, intersectionPoint.clone());
      }
      stateChanges = [new UpdateState(this.first.entity, { points: newPoints })];
    } else {
      const [poly, line] = firstIsPolyline ? [this.first, this.second] : [this.second, this.first];
      const polySegIdx = poly.segmentIndex;
      const segStart = poly.entity.points[polySegIdx - 1];
      const segEnd = poly.entity.points[polySegIdx];
      const keepStart = poly.clickDir.dot(segStart.subtract(intersectionPoint)) >= poly.clickDir.dot(segEnd.subtract(intersectionPoint));
      let newPoints;
      if (keepStart) {
        newPoints = [
          ...poly.entity.points.slice(0, polySegIdx).map((p) => p.clone()),
          intersectionPoint.clone(),
          line.lineKeptEnd.clone(),
        ];
      } else {
        newPoints = [
          line.lineKeptEnd.clone(),
          intersectionPoint.clone(),
          ...poly.entity.points.slice(polySegIdx).map((p) => p.clone()),
        ];
      }
      stateChanges = [
        new RemoveState(line.entity),
        new UpdateState(poly.entity, { points: newPoints }),
      ];
    }
    return stateChanges;
  }
}
