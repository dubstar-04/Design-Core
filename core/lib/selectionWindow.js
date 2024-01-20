import {DesignCore} from '../designCore.js';
import {Point} from '../entities/point.js';
import {Colours} from './colours.js';


export class SelectionWindow {
  constructor(data) {
    this.colour = DesignCore.Settings.selectionWindow;
    this.lineWidth = 1;
    this.dashPattern = [];

    if (data) {
      if (data.hasOwnProperty('points')) {
        if (data.points[1].y > data.points[0].y) {
          this.colour = DesignCore.Settings.selectionWindow;
          this.dashPattern = [5];
        } else {
          this.colour = DesignCore.Settings.crossingWindow;
        }

        this.points = [];
        const point1 = new Point(data.points[0].x, data.points[0].y);
        const point2 = new Point(data.points[1].x, data.points[1].y);

        this.points.push(point1);
        this.points.push(point2);
      }
    }
  }


  draw(ctx, scale) {
    const colour = this.colour;
    ctx.fillStyle = colour;

    const scaledPattern = this.dashPattern.map((x) => x / scale);

    try { // HTML Canvas
      ctx.strokeStyle = Colours.rgbToString(colour);
      ctx.fillStyle = Colours.rgbToString(colour);
      ctx.lineWidth = this.lineWidth / scale;
      ctx.beginPath();
      ctx.globalAlpha = 0.2;
      const width = this.points[1].x - this.points[0].x;
      const height = this.points[1].y - this.points[0].y;
      ctx.fillRect(this.points[0].x, this.points[0].y, width, height);
      ctx.globalAlpha = 1.0;
      this.drawRect(ctx);
      ctx.setLineDash(scaledPattern);
      ctx.stroke();
    } catch { // Cairo
      ctx.setLineWidth(this.lineWidth / scale);
      const rgbColour = Colours.rgbToScaledRGB(colour);
      ctx.setSourceRGBA(rgbColour.r, rgbColour.g, rgbColour.b, 0.2);
      this.drawRect(ctx);
      ctx.fillPreserve();
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);

      ctx.setDash(scaledPattern, 1);
      ctx.stroke();
    }
  }

  drawRect(ctx) {
    ctx.moveTo(this.points[0].x, this.points[0].y);
    ctx.lineTo(this.points[1].x, this.points[0].y);
    ctx.lineTo(this.points[1].x, this.points[1].y);
    ctx.lineTo(this.points[0].x, this.points[1].y);
    ctx.lineTo(this.points[0].x, this.points[0].y);
  }
}
