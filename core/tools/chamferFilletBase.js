import { Tool } from './tool.js';
import { Strings } from '../lib/strings.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { RemoveState, UpdateState } from '../lib/stateManager.js';

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
    this.firstEntity = null;
    this.secondEntity = null;
    // If the lines form a cross there are four possible locations.
    // The click points are used to determine which corner to operate on.
    this.firstClickPoint = null;
    this.secondClickPoint = null;
    // For polyline selections: the resolved Line segment and its 1-based index
    this.firstSegment = null;
    this.firstSegmentIndex = null;
    this.secondSegment = null;
    this.secondSegmentIndex = null;
    // Corner geometry computed by resolveCornerGeometry() before action()
    this.firstLineStart = null;
    this.firstLineEnd = null;
    this.secondLineStart = null;
    this.secondLineEnd = null;
    this.secondLineDirection = null;
    this.intersectionPoint = null;
    this.firstClickDir = null;
    this.secondClickDir = null;
    this.firstClickDistance = null;
    this.secondClickDistance = null;
    this.firstLineKeptEnd = null;
    this.secondLineKeptEnd = null;
  }

  /**
   * Resolve an entity to its closest straight segment and 1-based index.
   * Returns null and notifies the user if the closest segment is an arc.
   * @param {Line|BasePolyline} entity
   * @param {Point} clickPoint
   * @param {string} arcSegmentErrorMsg - notification string shown when the segment is an arc
   * @return {Object|null}
   */
  resolveSegment(entity, clickPoint, arcSegmentErrorMsg) {
    if (!(entity instanceof BasePolyline)) return { segment: entity, index: null };
    const index = entity.getClosestSegmentIndex(clickPoint);
    const segment = entity.getClosestSegment(clickPoint);
    if (!(segment instanceof Line)) {
      DesignCore.Core.notify(arcSegmentErrorMsg);
      return null;
    }
    return { segment, index };
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
    const firstSeg = this.firstSegment ?? this.firstEntity;
    const secondSeg = this.secondSegment ?? this.secondEntity;

    if (!(firstSeg instanceof Line)) {
      DesignCore.Core.notify(`${this.firstEntity.type} ${noEntityMsg}`);
      return false;
    }
    if (!(secondSeg instanceof Line)) {
      DesignCore.Core.notify(`${this.secondEntity.type} ${noEntityMsg}`);
      return false;
    }

    this.firstLineStart = firstSeg.points[0];
    this.firstLineEnd = firstSeg.points[1];
    this.secondLineStart = secondSeg.points[0];
    this.secondLineEnd = secondSeg.points[1];

    const firstLineDirection = this.firstLineEnd.subtract(this.firstLineStart);
    this.secondLineDirection = this.secondLineEnd.subtract(this.secondLineStart);
    const directionCross = firstLineDirection.cross(this.secondLineDirection);

    if (Math.abs(directionCross) < 1e-10) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return false;
    }

    const startDiff = this.secondLineStart.subtract(this.firstLineStart);
    const intersectParam = startDiff.cross(this.secondLineDirection) / directionCross;
    this.intersectionPoint = this.firstLineStart.lerp(this.firstLineEnd, intersectParam);

    const firstClickOnLine = this.firstClickPoint.perpendicular(this.firstLineStart, this.firstLineEnd);
    const secondClickOnLine = this.secondClickPoint.perpendicular(this.secondLineStart, this.secondLineEnd);

    this.firstClickDistance = firstClickOnLine.distance(this.intersectionPoint);
    this.secondClickDistance = secondClickOnLine.distance(this.intersectionPoint);

    this.firstClickDir = firstClickOnLine.subtract(this.intersectionPoint);
    this.secondClickDir = secondClickOnLine.subtract(this.intersectionPoint);

    this.firstLineKeptEnd = this.firstClickDir.dot(this.firstLineStart.subtract(this.intersectionPoint)) >= this.firstClickDir.dot(this.firstLineEnd.subtract(this.intersectionPoint)) ? this.firstLineStart : this.firstLineEnd;
    this.secondLineKeptEnd = this.secondClickDir.dot(this.secondLineStart.subtract(this.intersectionPoint)) >= this.secondClickDir.dot(this.secondLineEnd.subtract(this.intersectionPoint)) ? this.secondLineStart : this.secondLineEnd;

    return true;
  }

  /**
   * Trim both entities to the sharp intersection point with no arc or chamfer line.
   * Handles Line+Line, Polyline+Polyline (same entity), and Line+Polyline cases.
   * Reads geometry from instance fields set by resolveCornerGeometry().
   * @return {Array} - array of state changes to be committed by the caller
   */
  applySharpTrim() {
    const firstIsPolyline = this.firstEntity instanceof BasePolyline;
    const secondIsPolyline = this.secondEntity instanceof BasePolyline;
    const { intersectionPoint, firstClickDir, secondClickDir, firstLineKeptEnd, secondLineKeptEnd } = this;
    let stateChanges;
    if (!firstIsPolyline && !secondIsPolyline) {
      stateChanges = [
        new UpdateState(this.firstEntity, { points: [firstLineKeptEnd, intersectionPoint] }),
        new UpdateState(this.secondEntity, { points: [secondLineKeptEnd, intersectionPoint] }),
      ];
    } else if (firstIsPolyline && secondIsPolyline && this.firstEntity === this.secondEntity) {
      const lastIdx = this.firstEntity.points.length - 1;
      const isOpenEnds = (this.firstSegmentIndex === 1 && this.secondSegmentIndex === lastIdx) ||
                         (this.firstSegmentIndex === lastIdx && this.secondSegmentIndex === 1);
      const newPoints = this.firstEntity.points.map((p) => p.clone());
      if (isOpenEnds) {
        newPoints[0] = intersectionPoint.clone();
        newPoints[lastIdx] = intersectionPoint.clone();
      } else {
        const cornerIdx = Math.min(this.firstSegmentIndex, this.secondSegmentIndex);
        newPoints.splice(cornerIdx, 1, intersectionPoint.clone());
      }
      stateChanges = [new UpdateState(this.firstEntity, { points: newPoints })];
    } else {
      const lineEntity = !firstIsPolyline ? this.firstEntity : this.secondEntity;
      const polyEntity = firstIsPolyline ? this.firstEntity : this.secondEntity;
      const lineKeptEnd = !firstIsPolyline ? firstLineKeptEnd : secondLineKeptEnd;
      const polySegIdx = firstIsPolyline ? this.firstSegmentIndex : this.secondSegmentIndex;
      const polyClickDir = firstIsPolyline ? firstClickDir : secondClickDir;
      const segStart = polyEntity.points[polySegIdx - 1];
      const segEnd = polyEntity.points[polySegIdx];
      const keepStart = polyClickDir.dot(segStart.subtract(intersectionPoint)) >= polyClickDir.dot(segEnd.subtract(intersectionPoint));
      let newPoints;
      if (keepStart) {
        newPoints = [
          ...polyEntity.points.slice(0, polySegIdx).map((p) => p.clone()),
          intersectionPoint.clone(),
          lineKeptEnd.clone(),
        ];
      } else {
        newPoints = [
          lineKeptEnd.clone(),
          intersectionPoint.clone(),
          ...polyEntity.points.slice(polySegIdx).map((p) => p.clone()),
        ];
      }
      stateChanges = [
        new RemoveState(lineEntity),
        new UpdateState(polyEntity, { points: newPoints }),
      ];
    }
    return stateChanges;
  }
}
