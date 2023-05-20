import {Point} from '../entities/point.js';
import {Colours} from './colours.js';


export class SelectionWindow {
  constructor(data) {
    this.colour = '#FF0000';
    this.lineWidth = 1;
    this.dashPattern = [];

    if (data) {
      if (data.points) {
        if (data.points[1].y > data.points[0].y) {
          this.colour = '#FF0000';
          this.dashPattern = [5];
        } else {
          this.colour = '#0000FF';
        }

        this.points = [];
        const point1 = new Point(data.points[0].x, data.points[0].y);
        const point2 = new Point(data.points[1].x, data.points[1].y);

        this.points.push(point1);
        this.points.push(point2);
      }
    }
  }


  draw(ctx, scale, core) {
    const colour = this.colour;
    ctx.fillStyle = colour;

    try { // HTML Canvas
      ctx.strokeStyle = colour;
      ctx.lineWidth = this.lineWidth / scale;
      ctx.beginPath();
      ctx.globalAlpha = 0.2;
      const width = this.points[1].x - this.points[0].x;
      const height = this.points[1].y - this.points[0].y;
      ctx.fillRect(this.points[0].x, this.points[0].y, width, height);
      ctx.globalAlpha = 1.0;
      this.drawRect(ctx);
      ctx.stroke();
    } catch { // Cairo
      ctx.setLineWidth(this.lineWidth / scale);
      const rgbColour = Colours.hexToScaledRGB(colour);
      ctx.setSourceRGBA(rgbColour.r, rgbColour.g, rgbColour.b, 0.2);
      this.drawRect(ctx);
      ctx.fillPreserve();
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      const scaledPattern = this.dashPattern.map((x) => x / scale);
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
