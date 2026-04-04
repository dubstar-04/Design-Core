import { Tool } from './tool.js';
import { Strings } from '../lib/strings.js';
import { Constants } from '../lib/constants.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { RemoveState, UpdateState } from '../lib/stateManager.js';
import { CornerEntity } from './cornerEntity.js';
import { Intersection } from '../lib/intersect.js';

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
    this.firstPick = new CornerEntity();
    this.secondPick = new CornerEntity();
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
    if (!this.firstPick.resolveEndpoints()) {
      DesignCore.Core.notify(`${this.type} - ${this.firstPick.entity.type} ${noEntityMsg}`);
      return false;
    }
    if (!this.secondPick.resolveEndpoints()) {
      DesignCore.Core.notify(`${this.type} - ${this.secondPick.entity.type} ${noEntityMsg}`);
      return false;
    }

    const result = Intersection.intersectSegmentSegment(
        this.firstPick.lineStart, this.firstPick.lineEnd,
        this.secondPick.lineStart, this.secondPick.lineEnd,
        true, true,
    );
    this.intersectionPoint = result.points[0] || null;

    if (!this.intersectionPoint) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.PARALLELLINES}`);
      return false;
    }

    if (this.firstPick.clickDistance(this.intersectionPoint) < Constants.Tolerance.EPSILON ||
        this.secondPick.clickDistance(this.intersectionPoint) < Constants.Tolerance.EPSILON) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.SELECTION}`);
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
    const firstIsPolyline = this.firstPick.entity instanceof BasePolyline;
    const secondIsPolyline = this.secondPick.entity instanceof BasePolyline;

    // Line + Line: trim both lines to the intersection point.
    if (!firstIsPolyline && !secondIsPolyline) {
      return [
        new UpdateState(this.firstPick.entity, { points: [this.firstPick.lineKeptEnd(this.intersectionPoint), this.intersectionPoint] }),
        new UpdateState(this.secondPick.entity, { points: [this.secondPick.lineKeptEnd(this.intersectionPoint), this.intersectionPoint] }),
      ];
    }

    // Polyline + Polyline (same entity): replace the shared corner vertex (or open endpoints)
    // with the intersection point.
    if (firstIsPolyline && secondIsPolyline && this.firstPick.entity === this.secondPick.entity) {
      const lastIdx = this.firstPick.entity.points.length - 1;
      const segDiff = Math.abs(this.firstPick.segmentIndex - this.secondPick.segmentIndex);
      const isOpenEnds = !this.firstPick.entity.flags.hasFlag(1) && segDiff !== 1 && (
        (this.firstPick.segmentIndex === 1 && this.secondPick.segmentIndex === lastIdx) ||
        (this.firstPick.segmentIndex === lastIdx && this.secondPick.segmentIndex === 1)
      );

      const newPoints = this.firstPick.entity.points.map((p) => p.clone());

      if (isOpenEnds) {
        newPoints[0] = this.intersectionPoint.clone();
        newPoints[lastIdx] = this.intersectionPoint.clone();
      } else {
        const closeSegIdx = this.firstPick.entity.points.length;
        const seg1 = this.firstPick.segmentIndex;
        const seg2 = this.secondPick.segmentIndex;
        const isClosingWrap = (seg1 === closeSegIdx && seg2 === 1) || (seg2 === closeSegIdx && seg1 === 1);
        const cornerIdx = isClosingWrap ? 0 : Math.min(seg1, seg2);
        newPoints.splice(cornerIdx, 1, this.intersectionPoint.clone());
      }
      return [new UpdateState(this.firstPick.entity, { points: newPoints })];
    }

    // Line + Polyline (or Polyline + Line): consume the line into the polyline.
    const poly = firstIsPolyline ? this.firstPick : this.secondPick;
    const line = firstIsPolyline ? this.secondPick : this.firstPick;
    const polySegIdx = poly.segmentIndex;
    const keepStart = poly.keepStart(this.intersectionPoint);
    let newPoints;
    if (keepStart) {
      // Keep the polyline points up to (not including) the selected segment start,
      // trim to the intersection and append the kept end of the line.
      newPoints = [
        ...poly.entity.points.slice(0, polySegIdx).map((p) => p.clone()),
        this.intersectionPoint.clone(),
        line.lineKeptEnd(this.intersectionPoint).clone(),
      ];
    } else {
      // Keep the polyline points from the selected segment start onwards,
      // prepending the kept end of the line and the intersection.
      newPoints = [
        line.lineKeptEnd(this.intersectionPoint).clone(),
        this.intersectionPoint.clone(),
        ...poly.entity.points.slice(polySegIdx).map((p) => p.clone()),
      ];
    }
    return [
      new RemoveState(line.entity),
      new UpdateState(poly.entity, { points: newPoints }),
    ];
  }
}
