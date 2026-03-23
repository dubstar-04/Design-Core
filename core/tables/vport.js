import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Property } from '../properties/property.js';

/** VPort Class */
export class VPort {
  /**
   * Create a VPort
   * @param {Object} data
   */
  constructor(data) {
    // DXF Groupcode 5 - Handle
    this.handle = Property.loadValue([data?.handle, data?.[5]]);
    // DXF Groupcode 2 - Name
    this.name = Property.loadValue([data?.name, data?.[2]], '*ACTIVE');
    // DXF Groupcode 12 - View center X
    this.viewCenterX = Property.loadValue([data?.viewCenterX, data?.[12]], 0);
    // DXF Groupcode 22 - View center Y
    this.viewCenterY = Property.loadValue([data?.viewCenterY, data?.[22]], 0);
    // DXF Groupcode 40 - VPort height
    this.height = Property.loadValue([data?.height, data?.[40]], 0);
    // DXF Groupcode 41 - VPort width/height ratio
    this.ratio = Property.loadValue([data?.ratio, data?.[41]], 0);
  }

  /**
   * Write the item to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'VPORT');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbViewportTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name);
    file.writeGroupCode('70', '0'); // vport flags
    file.writeGroupCode('10', '0.0'); // lower left corner x pos
    file.writeGroupCode('20', '0.0'); // lower left corner y pos
    file.writeGroupCode('11', '1.0'); // upper right corner x pos
    file.writeGroupCode('21', '1.0'); // upper right corner y pos
    file.writeGroupCode('12', this.viewCenterX); // view centre x pos
    file.writeGroupCode('22', this.viewCenterY); // view centre y pos
    file.writeGroupCode('13', '0.0'); // snap base point x
    file.writeGroupCode('23', '0.0'); // snap base point y
    file.writeGroupCode('14', '10.0'); // snap spacing x
    file.writeGroupCode('24', '10.0'); // snap spacing y
    file.writeGroupCode('15', '10.0'); // grid spacing x
    file.writeGroupCode('25', '10.0'); // grid spacing y
    file.writeGroupCode('16', '0.0'); // view direction (x) from target point
    file.writeGroupCode('26', '0.0'); // view direction (y) from target point
    file.writeGroupCode('36', '1.0'); // view direction (z) from target point
    file.writeGroupCode('17', '0.0'); // view target point x
    file.writeGroupCode('27', '0.0'); // view target point y
    file.writeGroupCode('37', '0.0'); // view target point z
    file.writeGroupCode('40', this.height); // VPort Height
    file.writeGroupCode('41', this.ratio); // Vport height/width ratio
    file.writeGroupCode('42', '50.0'); // Lens Length
    file.writeGroupCode('43', '0.0'); // Front Clipping Plane
    file.writeGroupCode('44', '0.0'); // Back Clipping Plane
    file.writeGroupCode('50', '0.0'); // Snap Rotation Angle
    file.writeGroupCode('51', '0.0'); // View Twist Angle
    file.writeGroupCode('71', '0.0'); // Viewmode (System variable)
    file.writeGroupCode('72', '1000'); // Circle sides
    file.writeGroupCode('73', '1'); // fast zoom setting
    file.writeGroupCode('74', '3'); // UCSICON Setting
    file.writeGroupCode('75', '0'); // snap on/off
    file.writeGroupCode('76', '1'); // grid on/off
    file.writeGroupCode('77', '0'); // snap style
    file.writeGroupCode('78', '0'); // snap isopair
  }
}
