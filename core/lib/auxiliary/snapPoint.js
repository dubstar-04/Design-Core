import { Colours } from '../colours.js';

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
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    const snapColour = DesignCore.Settings.accentcolour;
    const size = 6 / scale;
    const x = this.snapPoint.x;
    const y = this.snapPoint.y;
    const lineWidth = 2.5 / scale;

    try { // HTML Canvas
      ctx.strokeStyle = Colours.rgbToString(snapColour);
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([]);
      ctx.beginPath();
    } catch { // Cairo
      const rgbColour = Colours.rgbToScaledRGB(snapColour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      ctx.setLineWidth(lineWidth);
    }

    switch (this.type) {
      case SnapPoint.Type.END: // square
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.closePath();
        break;
      case SnapPoint.Type.MID: // triangle
        ctx.moveTo(x, y + size);
        ctx.lineTo(x - size, y - size);
        ctx.lineTo(x + size, y - size);
        ctx.closePath();
        break;
      case SnapPoint.Type.QUADRANT: // diamond
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        break;
      case SnapPoint.Type.NEAREST: // hourglass (X with horizontal lines at top and bottom)
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        break;
      case SnapPoint.Type.TANGENT: // circle with a horizontal line over the top
        ctx.arc(x, y, size, 0, 6.283);
        ctx.moveTo(x - size, y + size * 1.5);
        ctx.lineTo(x + size, y + size * 1.5);
        break;
      case SnapPoint.Type.NODE: // circle with an X inside
        ctx.arc(x, y, size, 0, 6.283);
        ctx.moveTo(x - size * 0.7, y - size * 0.7);
        ctx.lineTo(x + size * 0.7, y + size * 0.7);
        ctx.moveTo(x + size * 0.7, y - size * 0.7);
        ctx.lineTo(x - size * 0.7, y + size * 0.7);
        break;
      case SnapPoint.Type.PERPENDICULAR: // right-angle corner (L-shape)
        ctx.moveTo(x - size, y + size);
        ctx.lineTo(x - size, y - size);
        ctx.lineTo(x + size, y - size);
        break;
      default: // CENTRE - circle
        ctx.arc(x, y, size, 0, 6.283);
        break;
    }

    ctx.stroke();
  }
}
