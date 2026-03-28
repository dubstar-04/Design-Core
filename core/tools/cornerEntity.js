import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';

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
   * Set the entity and click point, then resolve the polyline segment.
   * For polylines, populates segment and segmentIndex from the closest segment.
   * For plain Lines, segment and segmentIndex are cleared to null.
   * Returns false and notifies the user if the closest polyline segment is an arc.
   * @param {object} entity - the selected entity
   * @param {Point} clickPoint - the point where the user clicked
   * @param {string} arcSegmentErrorMsg - notification string shown when the segment is an arc
   * @return {boolean}
   */
  setPick(entity, clickPoint, arcSegmentErrorMsg) {
    this.entity = entity;
    this.clickPoint = clickPoint;
    if (!(this.entity instanceof BasePolyline)) {
      this.segment = null;
      this.segmentIndex = null;
      return true;
    }
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
   * The perpendicular foot of clickPoint onto the line defined by lineStart/lineEnd.
   * @return {Point}
   */
  get #clickOnLine() {
    return this.clickPoint.perpendicular(this.lineStart, this.lineEnd);
  }

  /**
   * Distance from the perpendicular foot to the intersection point.
   * A value below Constants.Tolerance.EPSILON indicates an ambiguous corner.
   * @param {Point} intersectionPoint - the corner intersection point
   * @return {number}
   */
  clickDistance(intersectionPoint) {
    return this.#clickOnLine.distance(intersectionPoint);
  }

  /**
   * Vector from the intersection point toward the perpendicular foot (i.e. toward the click side).
   * @param {Point} intersectionPoint - the corner intersection point
   * @return {Point}
   */
  clickDir(intersectionPoint) {
    return this.#clickOnLine.subtract(intersectionPoint);
  }

  /**
   * Unit vector in the clickDir direction.
   * @param {Point} intersectionPoint - the corner intersection point
   * @return {Point}
   */
  clickUnit(intersectionPoint) {
    return this.clickDir(intersectionPoint).normalise();
  }

  /**
   * The line endpoint on the same side of the intersection as the click.
   * @param {Point} intersectionPoint - the corner intersection point
   * @return {Point}
   */
  lineKeptEnd(intersectionPoint) {
    const dir = this.clickDir(intersectionPoint);
    return dir.dot(this.lineStart.subtract(intersectionPoint)) >= dir.dot(this.lineEnd.subtract(intersectionPoint)) ?
      this.lineStart : this.lineEnd;
  }

  /**
   * Determine whether the start of the polyline segment should be kept when trimming.
   * @param {Point} intersectionPoint - the corner intersection point
   * @return {boolean}
   */
  keepStart(intersectionPoint) {
    const segStart = this.entity.points[this.segmentIndex - 1];
    const segEnd = this.entity.points[this.segmentIndex % this.entity.points.length];
    const dir = this.clickDir(intersectionPoint);
    return dir.dot(segStart.subtract(intersectionPoint)) >= dir.dot(segEnd.subtract(intersectionPoint));
  }
}
