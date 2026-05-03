import { DXFFile } from '../lib/dxf/dxfFile.js';
import { CircularDimensionBase } from './circularDimensionBase.js';
import { Property } from '../properties/property.js';

/**
 * Diametric Dimension Entity Class
 * @extends CircularDimensionBase
 */
export class DiametricDimension extends CircularDimensionBase {
  /**
   * Create a Diametric Dimension
   * @param {Array} data
   */
  constructor(data) {
    super(data);
    this.dimType.setDimType(3); // Diametric dimension
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'DiametricDimension', shortcut: 'DIMDIA' };
    return command;
  }

  /**
   * Get sequenced points from user selection
   * @param {any} entities
   * @param {Point} textPos
   * @return {Array} array of points
   */
  static getPointsFromSelection(entities, textPos) {
    const entity = entities[0];
    const centre = entity.points[0];

    const Pt11 = textPos;
    Pt11.sequence = 11;

    const angle = Pt11.angle(centre);
    const Pt10 = centre.project(angle, entity.getRadius());
    Pt10.sequence = 10;
    // Pt15 should be closest point to the text position
    const Pt15 = centre.project(angle - Math.PI, entity.getRadius());
    Pt15.sequence = 15;

    const points = [Pt10, Pt15, Pt11];
    return points;
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    const Pt10 = this.getPointBySequence(this.points, 10);
    const Pt11 = this.getPointBySequence(this.points, 11);
    const Pt15 = this.getPointBySequence(this.points, 15);

    file.writeGroupCode('0', 'DIMENSION');
    file.writeGroupCode('5', this.getProperty(Property.Names.HANDLE), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimension', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.getProperty(Property.Names.LAYER));
    // file.writeGroupCode('2', this.blockName); // Block not required
    file.writeGroupCode('10', Pt10.x); // X - Start of Dimension Line
    file.writeGroupCode('20', Pt10.y); // Y
    file.writeGroupCode('30', '0.0'); // Z
    file.writeGroupCode('11', Pt11.x); // X - Text Midpoint
    file.writeGroupCode('21', Pt11.y); // Y
    file.writeGroupCode('31', '0.0'); // Z
    file.writeGroupCode('70', this.dimType.getDimType()); // DIMENSION TYPE
    file.writeGroupCode('3', this.getProperty(Property.Names.DIMENSIONSTYLE)); // DIMENSION STYLE
    file.writeGroupCode('100', 'AcDbDiametricDimension', DXFFile.Version.R2000);
    file.writeGroupCode('15', Pt15.x); // X - End of Dimension Line
    file.writeGroupCode('25', Pt15.y); // Y
    file.writeGroupCode('35', '0.0'); // Z
  }
}
