export class DXFWriter {
  constructor() {

  }

  write(core) {
    this.core = core;
    let data = '';
    data = data.concat(
        // Create Header Data
        '999',
        '\nDXF created from Design-Core',
        '\n0',
        '\nSECTION',
        '\n2',
        '\nHEADER',
        '\n9',
        '\n$ACADVER',
        '\n1',
        '\nAC1009',
        '\n9',
        '\n$CLAYER',
        '\n8',
        '\n' + this.core.layerManager.getCLayer(),
        '\n0',
        '\nENDSEC',
    );
    // Create table data for layers
    data = data.concat(
        '\n0',
        '\nSECTION',
        '\n2',
        '\nTABLES',
        '\n0',
        '\nTABLE',
        '\n2',
        '\nLAYER',
        '\n70',
        '\n' + this.core.layerManager.layerCount());

    for (let i = 0; i < this.core.layerManager.layerCount(); i++) {
      data = data.concat('\n', this.core.layerManager.getLayerByIndex(i).dxf());
    }

    data = data.concat(
        '\n0',
        '\nENDTAB',
    );

    // Create table data for text styles

    data = data.concat(
        '\n0',
        '\nTABLE',
        '\n2',
        '\nSTYLE',
        '\n70',
        '\n' + this.core.styleManager.styleCount());

    for (let i = 0; i < this.core.styleManager.styleCount(); i++) {
      data = data.concat('\n', this.core.styleManager.getStyleByIndex(i).dxf());
    }

    data = data.concat(
        '\n0',
        '\nENDTAB',
    );

    // Create table data for dimension styles

    data = data.concat(
        '\n0',
        '\nTABLE',
        '\n2',
        '\nDIMSTYLE',
        '\n70',
        '\n' + this.core.dimStyleManager.styleCount());

    for (let i = 0; i < this.core.dimStyleManager.styleCount(); i++) {
      data = data.concat('\n', this.core.dimStyleManager.getStyleByIndex(i).dxf());
    }

    data = data.concat(
        '\n0',
        '\nENDTAB',
    );

    let width = 0;
    let height = 0;
    let viewCenterX = 0;
    let viewCenterY = 0;

    const extents = this.core.scene.getExtents();
    if (extents) {
      width = extents.xmax - extents.xmin;
      height = extents.ymax - extents.ymin;
      viewCenterX = extents.xmin + width / 2;
      viewCenterY = extents.ymin + height / 2;
    }

    data = data.concat(
        '\n0',
        '\nTABLE',
        '\n2', // Table Name
        '\nVPORT',
        '\n70', // Number of entries in table
        '\n1',
        '\n0',
        '\nVPORT',
        '\n2',
        '\n*ACTIVE',
        '\n70', // vport flags
        '\n0',
        '\n10', // lower left corner x pos
        '\n0.0',
        '\n20', // lower left corner y pos
        '\n0.0',
        '\n11', // upper right corner x pos
        '\n1.0',
        '\n21', // upper right corner y pos
        '\n1.0',
        '\n12', // view centre x pos
        '\n' + viewCenterX,
        '\n22', // view centre y pos
        '\n' + viewCenterY,
        '\n13', // snap base point x
        '\n0.0',
        '\n23', // snap base point y
        '\n0.0',
        '\n14', // snap spacing x
        '\n10.0',
        '\n24', // snap spacing y
        '\n10.0',
        '\n15', // grid spacing x
        '\n10.0',
        '\n25', // grid spacing y
        '\n10.0',
        '\n16', // view direction (x) from target point
        '\n0.0',
        '\n26', // view direction (y) from target point
        '\n0.0',
        '\n 36', // view direction (z) from target point
        '\n1.0',
        '\n 17', // view target point x
        '\n0.0',
        '\n 27', // view target point y
        '\n0.0',
        '\n 37', // view target point z
        '\n0.0',
        '\n40', // VPort Height
        '\n' + height,
        '\n41', // Vport height/width ratio
        '\n' + width / height,
        '\n42', // Lens Length
        '\n50.0',
        '\n 43', // Front Clipping Plane
        '\n0.0',
        '\n 44', // Back Clipping Plane
        '\n0.0',
        '\n 50', // Snap Rotation Angle
        '\n0.0',
        '\n 51', // View Twist Angle
        '\n0.0',
        '\n71', // Viewmode (System constiable)
        '\n0',
        '\n72', // Cicle sides
        '\n1000',
        '\n73', // fast zoom setting
        '\n1',
        '\n74', // UCSICON Setting
        '\n3',
        '\n75', // snap on/off
        '\n 0',
        '\n76', // grid on/off
        '\n 1',
        '\n77', // snap style
        '\n 0',
        '\n78', // snap isopair
        '\n0',
        '\n0',
        '\nENDTAB',
        '\n0',
        '\nENDSEC');

    data = data.concat(
        '\n0',
        '\nSECTION',
        // Create Block Data
        '\n2',
        '\nBLOCKS');

    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (this.core.scene.items[i].type === 'Block') {
        data = data.concat('\n', this.core.scene.items[i].dxf());
      }
    }

    data = data.concat(
        '\n0',
        '\nENDSEC',
    );


    data = data.concat(
        '\n0',
        '\nSECTION',
        // Create Entity Data
        '\n2',
        '\nENTITIES');

    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (this.core.scene.items[i].type !== 'Block') {
        data = data.concat('\n', this.core.scene.items[i].dxf());
      }
    }

    data = data.concat(
        // End Entity and Close File
        '\n0',
        '\nENDSEC',
        '\n0',
        '\nEOF');

    return data;
  }
}
