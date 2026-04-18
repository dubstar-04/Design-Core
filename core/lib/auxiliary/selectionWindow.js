import { DesignCore } from '../../designCore.js';
import { Point } from '../../entities/point.js';

/** SelectionWindow Class */
export class SelectionWindow {
  /**
   * Create a SelectionWindow
   * @param {Object} data
   */
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

  /**
   * Draw the entity
   * @param {Object} renderer
   * @param {number} scale
   */
  draw(renderer, scale) {
    const colour = this.colour;
    const scaledPattern = this.dashPattern.map((x) => x / scale);

    const p0 = this.points[0];
    const p1 = this.points[1];
    const rectPoints = [
      new Point(p0.x, p0.y),
      new Point(p1.x, p0.y),
      new Point(p1.x, p1.y),
      new Point(p0.x, p1.y),
    ];

    renderer.setColour(colour);
    renderer.setLineWidth(this.lineWidth / scale);

    // Semi-transparent fill
    renderer.setDash([], 0);
    renderer.drawShape(rectPoints, { closed: true, fill: true, stroke: false, alpha: 0.2 });

    // Dashed outline
    renderer.setDash(scaledPattern, 0);
    renderer.drawShape(rectPoints, { closed: true, fill: false, stroke: true });
  }
}
