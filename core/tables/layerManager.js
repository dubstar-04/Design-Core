import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Layer } from './layer.js';
import { StyleManagerBase } from './styleManagerBase.js';
import { DesignCore } from '../designCore.js';

/**
 * LayerManager Class
 * @extends StyleManagerBase
 */
export class LayerManager extends StyleManagerBase {
  /** Create a LayerManager */
  constructor() {
    super();

    this.indelibleItems.push('0', 'DEFPOINTS');
    this.itemProperty = 'layer';
  }

  /** Get the item class */
  get itemClass() {
    return Layer;
  }

  /** Add standard layers */
  addStandardItems() {
    this.addItem({ 'name': '0' });
    this.addItem({ 'name': 'DEFPOINTS', 'plotting': false });
  }

  /**
   * Add a layer to the list of items and assign a plot style handle
   * @param {Object} item
   * @param {boolean} overwrite
   * @return {Object}
   */
  addItem(item, overwrite = false) {
    const newItem = super.addItem(item, overwrite);
    // Assign a plot style handle if not already assigned
    // TODO: understand how plot styles are managed
    if (newItem.plotStyleHandle === undefined) {
      newItem.plotStyleHandle = DesignCore.HandleManager.next();
    } else {
      DesignCore.HandleManager.checkHandle(newItem.plotStyleHandle);
    }
    return newItem;
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    // Create table data for layers
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'LAYER');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.itemCount());

    for (let i = 0; i < this.itemCount(); i++) {
      this.getItemByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
