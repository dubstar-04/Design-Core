import { DesignCore } from '../designCore.js';
import { Colours } from './colours.js';

/** RubberBand Class - rubber-band indicator line drawn between two or more points */
export class RubberBand {
  /**
   * Create a RubberBand
   * @param {Point[]} points - two or more points defining the polyline
   */
  constructor(points) {
    this.points = points;
    this.lineWidth = 1;
    this.dashPattern = [12, 6];
  }

  /**
   * Draw the rubber-band line
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    if (this.points.length < 2) return;

    const colour = DesignCore.Settings.rubberbandcolour;
    const lineWidth = this.lineWidth / scale;
    const scaledDash = this.dashPattern.map((x) => x / scale);

    try { // HTML Canvas
      ctx.strokeStyle = Colours.rgbToString(colour);
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(scaledDash);
      ctx.beginPath();
    } catch { // Cairo
      const rgbColour = Colours.rgbToScaledRGB(colour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      ctx.setLineWidth(lineWidth);
      ctx.setDash(scaledDash, 0);
    }

    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }
}
