import {Point} from '../entities/point.js';
import {Colours} from './colours.js';


export class SelectionWindow {
  constructor(data) {
    this.colour = '#FF0000';
    this.lineWidth = 1;

    if (data) {
      if (data.colour || data[62]) {
        this.colour = data.colour;
      }

      if (data.points) {
        this.points = [];
        const point1 = new Point(data.points[0].x, data.points[0].y);
        const point2 = new Point(data.points[1].x, data.points[0].y);
        const point3 = new Point(data.points[1].x, data.points[1].y);
        const point4 = new Point(data.points[0].x, data.points[1].y);
        const point5 = new Point(data.points[0].x, data.points[0].y);

        this.points.push(point1);
        this.points.push(point2);
        this.points.push(point3);
        this.points.push(point4);
        this.points.push(point5);

        this.width = data.points[1].x - data.points[0].x;
        this.height = data.points[1].y - data.points[0].y;
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
      ctx.fillRect(this.points[0].x, this.points[0].y, this.width, this.height);
      ctx.globalAlpha = 1.0;
      drawRect(this.points);
      ctx.stroke();
    } catch { // Cairo
      ctx.setLineWidth(this.lineWidth / scale);
      const rgbColour = Colours.hexToScaledRGB(colour);
      ctx.setSourceRGBA(rgbColour.r, rgbColour.g, rgbColour.b, 0.2);
      drawRect(this.points);
      ctx.fillPreserve();
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      ctx.stroke();
    }

    function drawRect(points) {
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.lineTo(points[3].x, points[3].y);
      ctx.lineTo(points[4].x, points[4].y);
    }
  }
}
