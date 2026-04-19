import { DesignCore } from '../../designCore.js';

/** RubberBand Class - rubber-band indicator line drawn between two or more points */
export class RubberBand {
  /**
   * Create a RubberBand
   * @param {Point[]} points - two or more points defining the polyline
   */
  constructor(points) {
    this.points = points;
    this.lineWidth = 1.5;
    this.dashPattern = [12, 6];
  }

  /**
   * Draw the rubber-band line
   * @param {Object} renderer
   * @param {number} scale
   */
  draw(renderer, scale) {
    if (this.points.length < 2) return;

    const colour = DesignCore.Settings.rubberbandcolour;
    const lineWidth = this.lineWidth / scale;
    const scaledDash = this.dashPattern.map((x) => x / scale);

    renderer.setColour(colour);
    renderer.setLineWidth(lineWidth);
    renderer.setDash(scaledDash, 0);
    renderer.drawShape(this.points);
  }
}
