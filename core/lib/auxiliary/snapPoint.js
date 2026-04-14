import { DesignCore } from '../../designCore.js';

/** SnapPoint Class */
export class SnapPoint {
  static Type = Object.freeze({
    NONE: 'none',
    END: 'end',
    MID: 'mid',
    CENTRE: 'centre',
    QUADRANT: 'quadrant',
    NEAREST: 'nearest',
    TANGENT: 'tangent',
    NODE: 'node',
    PERPENDICULAR: 'perpendicular',
  });

  /**
   * Create SnapPoint
   * @param {Point} snapPoint
   * @param {string} type - snap type from SnapPoint.Type
   */
  constructor(snapPoint, type = SnapPoint.Type.END) {
    this.snapPoint = snapPoint;
    this.type = type;
  }

  /**
   * Draw the entity
   * @param {Object} renderer
   * @param {number} scale
   */
  draw(renderer, scale) {
    const snapColour = DesignCore.Settings.accentcolour;
    const size = 6 / scale;
    const x = this.snapPoint.x;
    const y = this.snapPoint.y;
    const lineWidth = 2.5 / scale;

    renderer.setColour(snapColour);
    renderer.setLineWidth(lineWidth);
    renderer.setDash([], 0);

    // Full circle encoded as two bulge semi-arcs (same encoding as Circle entity)
    const circlePoints = (cx, cy, r) => [
      { x: cx + r, y: cy, bulge: 1 },
      { x: cx - r, y: cy, bulge: 1 },
      { x: cx + r, y: cy },
    ];

    switch (this.type) {
      case SnapPoint.Type.END: // square
        renderer.drawShape(null, [
          { x: x - size, y: y - size },
          { x: x + size, y: y - size },
          { x: x + size, y: y + size },
          { x: x - size, y: y + size },
        ], { closed: true });
        break;
      case SnapPoint.Type.MID: // triangle
        renderer.drawShape(null, [
          { x, y: y + size },
          { x: x - size, y: y - size },
          { x: x + size, y: y - size },
        ], { closed: true });
        break;
      case SnapPoint.Type.QUADRANT: // diamond
        renderer.drawShape(null, [
          { x, y: y - size },
          { x: x + size, y },
          { x, y: y + size },
          { x: x - size, y },
        ], { closed: true });
        break;
      case SnapPoint.Type.NEAREST: // hourglass
        renderer.drawShape(null, [
          { x: x - size, y: y - size },
          { x: x + size, y: y - size },
          { x: x - size, y: y + size },
          { x: x + size, y: y + size },
        ], { closed: true });
        break;
      case SnapPoint.Type.TANGENT: // circle + horizontal line above
        renderer.drawShape(null, circlePoints(x, y, size));
        renderer.drawShape(null, [
          { x: x - size, y: y + size * 1.5 },
          { x: x + size, y: y + size * 1.5 },
        ]);
        break;
      case SnapPoint.Type.NODE: // circle + X inside
        renderer.drawShape(null, circlePoints(x, y, size));
        renderer.drawShape(null, [
          { x: x - size * 0.7, y: y - size * 0.7 },
          { x: x + size * 0.7, y: y + size * 0.7 },
        ]);
        renderer.drawShape(null, [
          { x: x + size * 0.7, y: y - size * 0.7 },
          { x: x - size * 0.7, y: y + size * 0.7 },
        ]);
        break;
      case SnapPoint.Type.PERPENDICULAR: // L-shape corner
        renderer.drawShape(null, [
          { x: x - size, y: y + size },
          { x: x - size, y: y - size },
          { x: x + size, y: y - size },
        ]);
        break;
      default: // CENTRE - circle
        renderer.drawShape(null, circlePoints(x, y, size));
        break;
    }
  }
}
