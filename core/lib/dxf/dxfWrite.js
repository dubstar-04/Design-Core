import {DXFFile} from './dxfFile.js';

export class DXFWriter {
  constructor() {
  }

  writeTables(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'TABLES');

    // Create table data for layers
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'LAYER');
    file.writeGroupCode('70', this.core.layerManager.layerCount());

    for (let i = 0; i < this.core.layerManager.layerCount(); i++) {
      this.core.layerManager.getLayerByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');

    // Create table data for text styles
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'STYLE');
    file.writeGroupCode('70', this.core.styleManager.styleCount());

    for (let i = 0; i < this.core.styleManager.styleCount(); i++) {
      this.core.styleManager.getStyleByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');

    // Create table data for dimension styles
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'DIMSTYLE');
    file.writeGroupCode('70', this.core.dimStyleManager.styleCount());

    for (let i = 0; i < this.core.dimStyleManager.styleCount(); i++) {
      this.core.dimStyleManager.getStyleByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');


    let width = 0;
    let height = 0;
    let viewCenterX = 0;
    let viewCenterY = 0;

    const extents = this.core.scene.boundingRect();

    if (extents) {
      width = extents.xmax - extents.xmin;
      height = extents.ymax - extents.ymin;
      viewCenterX = extents.xmin + width / 2;
      viewCenterY = extents.ymin + height / 2;
    }

    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'VPORT'); // Table Name
    file.writeGroupCode('70', '1'); // Number of entries in table
    file.writeGroupCode('0', 'VPORT');
    file.writeGroupCode('2', '*ACTIVE');
    file.writeGroupCode('70', '0'); // vport flags
    file.writeGroupCode('10', '0.0'); // lower left corner x pos
    file.writeGroupCode('20', '0.0'); // lower left corner y pos
    file.writeGroupCode('11', '1.0'); // upper right corner x pos
    file.writeGroupCode('21', '1.0'); // upper right corner y pos
    file.writeGroupCode('12', viewCenterX); // view centre x pos
    file.writeGroupCode('22', viewCenterY); // view centre y pos
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
    file.writeGroupCode('40', height); // VPort Height
    file.writeGroupCode('41', width / height); // Vport height/width ratio
    file.writeGroupCode('42', '50.0'); // Lens Length
    file.writeGroupCode('43', '0.0');// Front Clipping Plane
    file.writeGroupCode('44', '0.0'); // Back Clipping Plane
    file.writeGroupCode('50', '0.0'); // Snap Rotation Angle
    file.writeGroupCode('51', '0.0'); // View Twist Angle
    file.writeGroupCode('71', '0.0'); // Viewmode (System constiable)
    file.writeGroupCode('72', '1000'); // Circle sides
    file.writeGroupCode('73', '1'); // fast zoom setting
    file.writeGroupCode('74', '3');// UCSICON Setting
    file.writeGroupCode('75', '0'); // snap on/off
    file.writeGroupCode('76', '1'); // grid on/off
    file.writeGroupCode('77', '0'); // snap style
    file.writeGroupCode('78', '0'); // snap isopair
    file.writeGroupCode('0', 'ENDTAB');
    file.writeGroupCode('0', 'ENDSEC');
  }

  writeBlocks(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'BLOCKS');

    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (this.core.scene.items[i].type === 'Block') {
        this.core.scene.items[i].dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDSEC');
  }

  writeEntities(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'ENTITIES');

    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (this.core.scene.items[i].type !== 'Block') {
        this.core.scene.items[i].dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDSEC');
  }

  write(core) {
    this.core = core;

    const file = new DXFFile();
    // write start of file
    file.writeGroupCode('999', 'DXF created from Design-Core');

    this.core.scene.dxf(file);
    this.writeTables(core, file);
    this.writeBlocks(core, file);
    this.writeEntities(core, file);

    // write end of file
    file.writeGroupCode('0', 'EOF');

    return file.contents;
  }
}
