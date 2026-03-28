import { Point } from '../entities/point.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { Constants } from '../lib/constants.js';

import { DesignCore } from '../designCore.js';

/**
 * CornerEntity
 * Holds the per-side state for one of the two entities involved in a Chamfer or Fillet operation.
 */
export class CornerEntity {
  /** Create a CornerEntity */
  constructor() {
    // Set during execute() when the user selects an entity
    this.entity = null;
    this.clickPoint = null;
    // For polyline selections: the resolved Line segment and its 1-based index
    this.segment = null;
    this.segmentIndex = null;
    // Geometry set by resolveCornerGeometry() before action()
    this.lineStart = null;
    this.lineEnd = null;
    this.clickDir = null;
    this.clickDistance = null;
    this.clickUnit = null;
    this.lineKeptEnd = null;
  }
  /**
   * The direction vector of the line segment (lineEnd − lineStart).
   * @return {Point}
   */
  get direction() {
    return this.lineEnd.subtract(this.lineStart);
  }

  /**
   * The active line segment: the resolved polyline segment, or the entity itself for a plain Line.
   * @return {Line|null}
   */
  get activeSeg() {
    return this.segment ?? this.entity;
  }

  /**
   * Validate that the active segment is a Line and populate lineStart and lineEnd from it.
   * Returns false if the active segment is not a Line.
   * @return {boolean}
   */
  resolveEndpoints() {
    if (!(this.activeSeg instanceof Line)) return false;
    this.lineStart = this.activeSeg.points[0];
    this.lineEnd = this.activeSeg.points[1];
    return true;
  }

  /**
   * Resolve the entity to its closest straight segment.
   * Populates segment and segmentIndex for polyline entities.
   * Returns false and notifies the user if the closest segment is an arc.
   * @param {string} arcSegmentErrorMsg - notification string shown when the segment is an arc
   * @return {boolean}
   */
  resolveSegment(arcSegmentErrorMsg) {
    if (!(this.entity instanceof BasePolyline)) return true;
    const index = this.entity.getClosestSegmentIndex(this.clickPoint);
    const segment = this.entity.getClosestSegment(this.clickPoint);
    if (!(segment instanceof Line)) {
      DesignCore.Core.notify(arcSegmentErrorMsg);
      return false;
    }
    this.segment = segment;
    this.segmentIndex = index;
    return true;
  }

  /**
   * Compute click-side geometry relative to the corner intersection point.
   * Populates clickDistance, clickDir, clickUnit, and lineKeptEnd.
   * Requires lineStart and lineEnd to be set first.
   * Returns false when the click projects to the intersection point (zero-distance — ambiguous corner).
   * @param {Point} intersectionPoint - the virtual intersection of the two lines
   * @return {boolean}
   */
  resolveGeometry(intersectionPoint) {
    const clickOnLine = this.clickPoint.perpendicular(this.lineStart, this.lineEnd);
    this.clickDistance = clickOnLine.distance(intersectionPoint);
    if (this.clickDistance < Constants.Tolerance.EPSILON) return false;
    this.clickDir = clickOnLine.subtract(intersectionPoint);
    this.lineKeptEnd = this.clickDir.dot(this.lineStart.subtract(intersectionPoint)) >= this.clickDir.dot(this.lineEnd.subtract(intersectionPoint)) ? this.lineStart : this.lineEnd;
    this.clickUnit = new Point(this.clickDir.x / this.clickDistance, this.clickDir.y / this.clickDistance);
    return true;
  }

  /**
   * Determine whether the start of the polyline segment should be kept when trimming.
   * @param {Point} intersectionPoint - the corner intersection point
   * @return {boolean}
   */
  keepStart(intersectionPoint) {
    const segStart = this.entity.points[this.segmentIndex - 1];
    const segEnd = this.entity.points[this.segmentIndex];
    return this.clickDir.dot(segStart.subtract(intersectionPoint)) >= this.clickDir.dot(segEnd.subtract(intersectionPoint));
  }
}
