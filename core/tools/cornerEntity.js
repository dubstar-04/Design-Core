/**
 * CornerEntity
 * Holds the per-side state for one of the two entities involved in a Chamfer or Fillet operation.
 * The base class ChamferFilletBase maintains two instances: `first` and `second`.
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
}
