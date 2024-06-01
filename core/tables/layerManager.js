import {DXFFile} from '../lib/dxf/dxfFile.js';
import {Layer} from './layer.js';
import {StyleManagerBase} from './styleManagerBase.js';


export class LayerManager extends StyleManagerBase {
  constructor() {
    super();

    this.indelibleItems.push('0', 'DEFPOINTS');
    this.itemProperty = 'layer';
  }

  createItem(style) {
    return new Layer(style);
  }

  addStandardItems() {
    this.addItem({'name': '0'});
    this.addItem({'name': 'DEFPOINTS', 'plotting': false});
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    // Create table data for layers
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'LAYER');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.itemCount());

    for (let i = 0; i < this.itemCount(); i++) {
      if (this.getItemByIndex(i).name !== 'DEFPOINTS') {
        this.getItemByIndex(i).dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
