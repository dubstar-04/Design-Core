import { Point } from '../../entities/point.js';

import { DesignCore } from '../../designCore.js';

/** TrackingLine Class - dotted tracking line for polar/ortho snap */
export class TrackingLine {
  /**
   * Create TrackingLine
   * @param {Point} inputPoint - the previous input point (defines direction)
   * @param {Point} snapPoint - the current snapped mouse point (line starts here)
   */
  constructor(inputPoint, snapPoint) {
    this.inputPoint = inputPoint;
    this.snapPoint = snapPoint;
  }

  /**
   * Draw the tracking line, extended to the visible canvas edges
   * @param {Object} renderer
   * @param {number} scale
   */
  draw(renderer, scale) {
    const from = this.snapPoint;
    const dir = this.snapPoint.subtract(this.inputPoint);
    const lineWidth = 2 / scale;

    if (dir.x === 0 && dir.y === 0) {
      return;
    }

    // Compute visible canvas bounds in scene space
    const w = DesignCore.Canvas.width;
    const h = DesignCore.Canvas.height;
    const corner0 = DesignCore.Mouse.transformToScene(new Point(0, 0));
    const corner1 = DesignCore.Mouse.transformToScene(new Point(w, h));
    const boundsMin = corner0.min(corner1);
    const boundsMax = corner0.max(corner1);

    // Clip the ray (from snapPoint outward, away from inputPoint) to canvas bounds
    let tMin = 0;
    let tMax = Infinity;

    if (dir.x !== 0) {
      const tx1 = (boundsMin.x - from.x) / dir.x;
      const tx2 = (boundsMax.x - from.x) / dir.x;
      tMin = Math.max(tMin, Math.min(tx1, tx2));
      tMax = Math.min(tMax, Math.max(tx1, tx2));
    } else if (from.x < boundsMin.x || from.x > boundsMax.x) {
      return;
    }

    if (dir.y !== 0) {
      const ty1 = (boundsMin.y - from.y) / dir.y;
      const ty2 = (boundsMax.y - from.y) / dir.y;
      tMin = Math.max(tMin, Math.min(ty1, ty2));
      tMax = Math.min(tMax, Math.max(ty1, ty2));
    } else if (from.y < boundsMin.y || from.y > boundsMax.y) {
      return;
    }

    if (tMax < tMin) {
      return;
    }

    const start = from.add(dir.scale(tMin));
    const end = from.add(dir.scale(tMax));

    const lineColour = DesignCore.Settings.accentcolour;
    const dashSize = 4 / scale;

    renderer.save();
    renderer.setColour(lineColour);
    renderer.setLineWidth(lineWidth);
    renderer.setDash([dashSize, dashSize], 0);
    renderer.drawShape(null, [{ x: start.x, y: start.y }, { x: end.x, y: end.y }]);
    renderer.restore();
  }
}
