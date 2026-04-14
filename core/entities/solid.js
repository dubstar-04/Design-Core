import { Entity } from './entity.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';

/**
 * Solid Entity Class
 * @extends Entity
 */
export class Solid extends Entity {
  static type = 'Solid';

  /**
   * Create a Solid Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);
  }

  /**
   * Draw the entity
   * @param {Object} renderer
   */
  draw(renderer) {
    renderer.drawShape(this, this.points, { closed: true, fill: true, stroke: false });
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'SOLID');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbTrace', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');

    file.writeGroupCode('11', this.points[1].x);
    file.writeGroupCode('21', this.points[1].y);
    file.writeGroupCode('31', '0.0');

    file.writeGroupCode('12', this.points[2].x);
    file.writeGroupCode('22', this.points[2].y);
    file.writeGroupCode('32', '0.0');

    // If only three points are use to define the SOLID then the fourth points is the same as the third.
    file.writeGroupCode('13', this.points.length > 3 ? this.points[3].x : this.points[2].x);
    file.writeGroupCode('23', this.points.length > 3 ? this.points[3].y : this.points[2].x);
    file.writeGroupCode('33', '0.0');
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    return [P, Infinity];
  }

  /**
   * Convert the entity to polyline points
   * @return {Array} array of points representing the solid as a polyline
   */
  toPolylinePoints() {
    const points = this.points.map((point) => point.clone());
    // Close the shape
    points.push(this.points[0].clone());
    return points;
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    return BoundingBox.fromPoints(this.points);
  }
}
