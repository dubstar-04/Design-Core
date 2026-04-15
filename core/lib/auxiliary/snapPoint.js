import { DesignCore } from '../../designCore.js';
import { Point } from '../../entities/point.js';

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
      new Point(cx + r, cy, 1),
      new Point(cx - r, cy, 1),
      new Point(cx + r, cy),
    ];

    switch (this.type) {
      case SnapPoint.Type.END: // square
        renderer.drawShape(null, [
          new Point(x - size, y - size),
          new Point(x + size, y - size),
          new Point(x + size, y + size),
          new Point(x - size, y + size),
        ], { closed: true });
        break;
      case SnapPoint.Type.MID: // triangle
        renderer.drawShape(null, [
          new Point(x, y + size),
          new Point(x - size, y - size),
          new Point(x + size, y - size),
        ], { closed: true });
        break;
      case SnapPoint.Type.QUADRANT: // diamond
        renderer.drawShape(null, [
          new Point(x, y - size),
          new Point(x + size, y),
          new Point(x, y + size),
          new Point(x - size, y),
        ], { closed: true });
        break;
      case SnapPoint.Type.NEAREST: // hourglass
        renderer.drawShape(null, [
          new Point(x - size, y - size),
          new Point(x + size, y - size),
          new Point(x - size, y + size),
          new Point(x + size, y + size),
        ], { closed: true });
        break;
      case SnapPoint.Type.TANGENT: // circle + horizontal line above
        renderer.drawShape(null, circlePoints(x, y, size));
        renderer.drawShape(null, [
          new Point(x - size, y + size * 1.5),
          new Point(x + size, y + size * 1.5),
        ]);
        break;
      case SnapPoint.Type.NODE: // circle + X inside
        renderer.drawShape(null, circlePoints(x, y, size));
        renderer.drawShape(null, [
          new Point(x - size * 0.7, y - size * 0.7),
          new Point(x + size * 0.7, y + size * 0.7),
        ]);
        renderer.drawShape(null, [
          new Point(x + size * 0.7, y - size * 0.7),
          new Point(x - size * 0.7, y + size * 0.7),
        ]);
        break;
      case SnapPoint.Type.PERPENDICULAR: // L-shape corner
        renderer.drawShape(null, [
          new Point(x - size, y + size),
          new Point(x - size, y - size),
          new Point(x + size, y - size),
        ]);
        break;
      default: // CENTRE - circle
        renderer.drawShape(null, circlePoints(x, y, size));
        break;
    }
  }
}
