import { Tool } from './tool.js';
import { Strings } from '../lib/strings.js';
import { Constants } from '../lib/constants.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { AddState, RemoveState, UpdateState } from '../lib/stateManager.js';
import { CornerEntity } from './cornerEntity.js';
import { Intersection } from '../lib/intersect.js';

import { DesignCore } from '../designCore.js';

/**
 * ChamferFilletBase Class
 * Base class for Chamfer and Fillet commands, providing shared entity selection
 * state, segment resolution, and shared corner-trim logic.
 * @extends Tool
 */
export class ChamferFilletBase extends Tool {
  static type = 'ChamferFilletBase';

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

    // Reject parallel, collinear, or overlapping segments — no unique corner exists.
    const status = result.status;
    if (status === Intersection.Status.PARALLEL ||
        status === Intersection.Status.OVERLAPPING ||
        status === Intersection.Status.COINCIDENT) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.PARALLELLINES}`);
      return false;
    }

    // Guard against near-parallel directions that pass the status check but
    // produce an unreliable intersection point far from both segments.
    const dir1 = this.firstPick.lineEnd.subtract(this.firstPick.lineStart);
    const dir2 = this.secondPick.lineEnd.subtract(this.secondPick.lineStart);
    const cross = dir1.cross(dir2);
    const len1 = dir1.length();
    const len2 = dir2.length();
    if (len1 === 0 || len2 === 0 || Math.abs(cross) / (len1 * len2) < Constants.Tolerance.EPSILON) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.PARALLELLINES}`);
      return false;
    }

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
   * Resolves the preview second-pick and virtual intersection for the mouse position.
   * Returns { candidate, tempSecond, intersectionPoint } or null if no valid preview exists.
   * @return {{candidate, tempSecond, intersectionPoint}|null}
   */
  validateSelection() {
    if (!this.firstPick.entity) return null;
    if (!this.firstPick.resolveEndpoints()) return null;

    const mousePoint = DesignCore.Mouse.pointOnScene();
    const index = DesignCore.Scene.selectionManager.findClosestItem(mousePoint);
    if (index === undefined) return null;

    const candidate = DesignCore.Scene.entities.get(index);
    if (!(candidate instanceof Line) && !(candidate instanceof BasePolyline)) return null;

    const tempSecond = new CornerEntity();
    if (!tempSecond.setPick(candidate, mousePoint, '')) return null;
    if (!tempSecond.resolveEndpoints()) return null;

    const result = Intersection.intersectSegmentSegment(
        this.firstPick.lineStart, this.firstPick.lineEnd,
        tempSecond.lineStart, tempSecond.lineEnd,
        true, true,
    );
    if (result.status === Intersection.Status.PARALLEL ||
        result.status === Intersection.Status.OVERLAPPING ||
        result.status === Intersection.Status.COINCIDENT) return null;

    const intersectionPoint = result.points[0];
    if (!intersectionPoint) return null;

    return { candidate, tempSecond, intersectionPoint };
  }

  /**
   * Unified corner-trim method for sharp trims, chamfer, and fillet.
   * Computes and applies state changes based on entity types.
   *
   * For sharp trims (newEntity === null), both corner points are the intersection
   * point and a single point is spliced/assigned (not two copies).
   *
   * For fillet, firstCornerPoint carries the arc bulge from arc.toPolylinePoints().
   * This method transfers the bulge to whichever point comes first in the polyline
   * traversal order, ensuring correct arc encoding.
   *
   * @param {Point} firstCornerPoint - trim/chamfer/tangent point on the first entity
   * @param {Point} secondCornerPoint - trim/chamfer/tangent point on the second entity
   * @param {Entity|null} newEntity - entity to add (Arc for fillet, Line for chamfer, null for sharp trim)
   * @return {Array} - array of state changes
   */
  applyCornerTrim(firstCornerPoint, secondCornerPoint, newEntity) {
    const isSharpTrim = newEntity === null;
    const firstIsPolyline = this.firstPick.entity instanceof BasePolyline;
    const secondIsPolyline = this.secondPick.entity instanceof BasePolyline;

    // Two standalone entities: update both, optionally add the new entity.
    if (!firstIsPolyline && !secondIsPolyline) {
      const stateChanges = isSharpTrim ? [] : [new AddState(newEntity)];
      // Corner points may carry a bulge value from arc.toPolylinePoints() — a Line
      // endpoint must never have a non-zero bulge or it renders as an arc.
      // toPolylinePoints() returns fresh Point objects so direct mutation is safe.
      firstCornerPoint.bulge = 0;
      secondCornerPoint.bulge = 0;
      stateChanges.push(
          new UpdateState(this.firstPick.entity, { points: [this.firstPick.lineKeptEnd(this.intersectionPoint), firstCornerPoint] }),
          new UpdateState(this.secondPick.entity, { points: [this.secondPick.lineKeptEnd(this.intersectionPoint), secondCornerPoint] }),
      );
      return stateChanges;
    }

    // Same polyline: splice the corner points into the point array.
    if (firstIsPolyline && secondIsPolyline && this.firstPick.entity === this.secondPick.entity) {
      const closeSegIdx = this.firstPick.entity.points.length;
      const lastIdx = closeSegIdx - 1;
      const segDiff = Math.abs(this.firstPick.segmentIndex - this.secondPick.segmentIndex);
      const isOpenEnds = !this.firstPick.entity.flags.hasFlag(1) && segDiff !== 1 && (
        (this.firstPick.segmentIndex === 1 && this.secondPick.segmentIndex === lastIdx) ||
        (this.firstPick.segmentIndex === lastIdx && this.secondPick.segmentIndex === 1)
      );
      const newPoints = this.firstPick.entity.points.map((p) => p.clone());
      const stateChanges = [];

      if (isOpenEnds) {
        if (!isSharpTrim) stateChanges.push(new AddState(newEntity));
        if (this.firstPick.segmentIndex === 1) {
          newPoints[0] = firstCornerPoint.clone();
          newPoints[lastIdx] = secondCornerPoint.clone();
        } else {
          newPoints[0] = secondCornerPoint.clone();
          newPoints[lastIdx] = firstCornerPoint.clone();
        }
      } else {
        const seg1 = this.firstPick.segmentIndex;
        const seg2 = this.secondPick.segmentIndex;
        const isClosingWrap = (seg1 === closeSegIdx && seg2 === 1) || (seg2 === closeSegIdx && seg1 === 1);
        const isFirstLower = seg1 < seg2;
        const cornerIdx = isClosingWrap ? 0 : Math.min(seg1, seg2);

        if (isSharpTrim) {
          // Sharp trim: splice in a single copy of the intersection point.
          newPoints.splice(cornerIdx, 1, firstCornerPoint.clone());
        } else {
          // Chamfer/fillet: splice in two points. Ensure the bulge (if any) is on
          // the lower point (the one that comes first in polyline traversal).
          const swapped = isClosingWrap ? seg1 !== closeSegIdx : !isFirstLower;
          const lowerSrc = swapped ? secondCornerPoint : firstCornerPoint;
          const upperSrc = swapped ? firstCornerPoint : secondCornerPoint;
          const arcBulge = firstCornerPoint.bulge || 0;
          const lowerClone = lowerSrc.clone();
          const upperClone = upperSrc.clone();
          lowerClone.bulge = swapped ? -arcBulge : arcBulge;
          upperClone.bulge = 0;
          newPoints.splice(cornerIdx, 1, lowerClone, upperClone);
        }
      }

      stateChanges.push(new UpdateState(this.firstPick.entity, { points: newPoints }));
      return stateChanges;
    }

    // Standalone + Polyline: consume the standalone entity into the polyline.
    const [poly, standalone] = firstIsPolyline ? [this.firstPick, this.secondPick] : [this.secondPick, this.firstPick];
    const polyCornerPoint = poly === this.firstPick ? firstCornerPoint : secondCornerPoint;
    const standaloneCornerPoint = poly === this.firstPick ? secondCornerPoint : firstCornerPoint;
    const arcBulge = firstCornerPoint.bulge || 0;
    const polySegIdx = poly.segmentIndex;
    const keepStart = poly.keepStart(this.intersectionPoint);
    let newPoints;
    if (isSharpTrim) {
      // Sharp trim: single intersection point between poly and standalone kept ends.
      if (keepStart) {
        newPoints = [
          ...poly.entity.points.slice(0, polySegIdx).map((p) => p.clone()),
          polyCornerPoint.clone(),
          standalone.lineKeptEnd(this.intersectionPoint).clone(),
        ];
      } else {
        newPoints = [
          standalone.lineKeptEnd(this.intersectionPoint).clone(),
          polyCornerPoint.clone(),
          ...poly.entity.points.slice(polySegIdx).map((p) => p.clone()),
        ];
      }
    } else if (keepStart) {
      // Keep start: [...polyBefore, polyCorner(with bulge), standaloneCorner, lineKeptEnd]
      // The arc runs from polyCorner to standaloneCorner in polyline traversal order.
      const polyClone = polyCornerPoint.clone();
      polyClone.bulge = poly === this.firstPick ? arcBulge : -arcBulge;
      newPoints = [
        ...poly.entity.points.slice(0, polySegIdx).map((p) => p.clone()),
        polyClone,
        standaloneCornerPoint.clone(),
        standalone.lineKeptEnd(this.intersectionPoint).clone(),
      ];
    } else {
      // Keep end: [lineKeptEnd, standaloneCorner(with negated bulge), polyCorner, ...polyAfter]
      // The arc runs from standaloneCorner to polyCorner in reversed traversal.
      const standaloneClone = standaloneCornerPoint.clone();
      standaloneClone.bulge = poly === this.firstPick ? -arcBulge : arcBulge;
      newPoints = [
        standalone.lineKeptEnd(this.intersectionPoint).clone(),
        standaloneClone,
        polyCornerPoint.clone(),
        ...poly.entity.points.slice(polySegIdx).map((p) => p.clone()),
      ];
    }
    return [
      new RemoveState(standalone.entity),
      new UpdateState(poly.entity, { points: newPoints }),
    ];
  }
}
