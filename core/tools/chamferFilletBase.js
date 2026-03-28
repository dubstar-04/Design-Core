import { Tool } from './tool.js';
import { Strings } from '../lib/strings.js';
import { Constants } from '../lib/constants.js';
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
    if (!this.first.resolveEndpoints()) {
      DesignCore.Core.notify(`${this.first.entity.type} ${noEntityMsg}`);
      return false;
    }
    if (!this.second.resolveEndpoints()) {
      DesignCore.Core.notify(`${this.second.entity.type} ${noEntityMsg}`);
      return false;
    }

    const directionCross = this.first.direction.cross(this.second.direction);

    if (Math.abs(directionCross) < Constants.Tolerance.EPSILON) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return false;
    }

    const startDiff = this.second.lineStart.subtract(this.first.lineStart);
    const intersectParam = startDiff.cross(this.second.direction) / directionCross;
    this.intersectionPoint = this.first.lineStart.lerp(this.first.lineEnd, intersectParam);

    if (!this.first.resolveGeometry(this.intersectionPoint) ||
        !this.second.resolveGeometry(this.intersectionPoint)) {
      DesignCore.Core.notify(Strings.Error.SELECTION);
      return false;
    }

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
      const segDiff = Math.abs(this.first.segmentIndex - this.second.segmentIndex);
      const isOpenEnds = !this.first.entity.flags.hasFlag(1) && segDiff !== 1 && (
        (this.first.segmentIndex === 1 && this.second.segmentIndex === lastIdx) ||
        (this.first.segmentIndex === lastIdx && this.second.segmentIndex === 1)
      );
      const newPoints = this.first.entity.points.map((p) => p.clone());
      if (isOpenEnds) {
        newPoints[0] = intersectionPoint.clone();
        newPoints[lastIdx] = intersectionPoint.clone();
      } else {
        const closeSegIdx = this.first.entity.points.length;
        const seg1 = this.first.segmentIndex;
        const seg2 = this.second.segmentIndex;
        const isClosingWrap = (seg1 === closeSegIdx && seg2 === 1) || (seg2 === closeSegIdx && seg1 === 1);
        const cornerIdx = isClosingWrap ? 0 : Math.min(seg1, seg2);
        newPoints.splice(cornerIdx, 1, intersectionPoint.clone());
      }
      stateChanges = [new UpdateState(this.first.entity, { points: newPoints })];
    } else {
      const [poly, line] = firstIsPolyline ? [this.first, this.second] : [this.second, this.first];
      const polySegIdx = poly.segmentIndex;
      const keepStart = poly.keepStart(intersectionPoint);
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
