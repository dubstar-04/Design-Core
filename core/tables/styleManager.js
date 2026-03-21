import { DXFFile } from '../lib/dxf/dxfFile.js';
import { StyleManagerBase } from './styleManagerBase.js';
import { Style } from './style.js';

/**
 * StyleManager Class
 * Manages text styles
 * @extends StyleManagerBase
 */
export class StyleManager extends StyleManagerBase {
  /** Create Style Manager */
  constructor() {
    super();

    this.indelibleItems.push('STANDARD');
    this.itemProperty = 'style';
  }

  /** Get the item class */
  get itemClass() {
    return Style;
  }

  /** Add standard text styles */
  addStandardItems() {
    this.addItem({
      'name': 'STANDARD',
    });

    this.addItem({
      'name': 'ANNOTATIVE',
    });

    // DesignCore.scene.saveRequired();
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    // Create table data for text styles
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'STYLE');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.itemCount());

    for (let i = 0; i < this.itemCount(); i++) {
      this.getItemByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
