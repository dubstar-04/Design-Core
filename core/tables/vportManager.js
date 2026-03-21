import { DXFFile } from '../lib/dxf/dxfFile.js';
import { TableManagerBase } from './tableManagerBase.js';
import { VPort } from './vport.js';

import { DesignCore } from '../designCore.js';

/**
 * VPortManager Class
 * @extends TableManagerBase
 */
export class VPortManager extends TableManagerBase {
  /** Create a VPortManager */
  constructor() {
    super();

    this.itemProperty = 'vport';
  }

  /** Get the item class */
  get itemClass() {
    return VPort;
  }

  /** Add standard items */
  addStandardItems() {
    this.addItem({ name: '*ACTIVE' });
  }

  /**
   * Update the active vport from the scene
   */
  updateFromScene() {
    const extents = DesignCore.Scene.boundingBox();
    const vport = this.getItemByName('*ACTIVE');

    if (extents && vport) {
      const width = extents.xLength;
      const height = extents.yLength;
      vport.viewCenterX = extents.xMin + width / 2;
      vport.viewCenterY = extents.yMin + height / 2;
      vport.height = height;
      vport.ratio = width / height;
    }
  }

  /**
   * Write the table to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    this.updateFromScene();

    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'VPORT');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.itemCount());

    for (let i = 0; i < this.itemCount(); i++) {
      this.getItemByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
