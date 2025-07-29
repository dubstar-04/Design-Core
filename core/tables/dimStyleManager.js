import {DXFFile} from '../lib/dxf/dxfFile.js';
import {DimStyle} from './dimStyle.js';
import {StyleManagerBase} from './styleManagerBase.js';

/**
 * DimStyleManager Class
 * @extends StyleManagerBase
 */
export class DimStyleManager extends StyleManagerBase {
  /** Create a DimStyleManager */
  constructor() {
    super();

    this.indelibleItems.push('STANDARD');
    this.itemProperty = 'dimensionStyle';
  }

  /**
 * Create a new DimStyle
 * @param {Object} style
 * @return {Object}
 */
  createItem(style) {
    return new DimStyle(style);
  }

  /**
   * Add standard dimension styles
   */
  addStandardItems() {
    this.addItem({
      'name': 'STANDARD',
      // DIMCLRD - 176 - Dimension line color
      // DIMCLRE - 177 - Dimension extension line color
      // DIMCLRT -  178 - Dimension text color
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
    // Create table data for dimension styles
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'DIMSTYLE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimStyleTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.itemCount());

    for (let i = 0; i < this.itemCount(); i++) {
      this.getItemByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
