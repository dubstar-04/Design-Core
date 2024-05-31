import {DXFFile} from '../lib/dxf/dxfFile.js';
import {StyleManagerBase} from './styleManagerBase.js';
import {Style} from './style.js';

export class StyleManager extends StyleManagerBase {
  constructor() {
    super();

    this.indelibleItems.push('STANDARD');
    this.itemProperty = 'style';
  }

  createItem(style) {
    return new Style(style);
  }

  addStandardItems() {
    this.addItem({
      'name': 'STANDARD',
    });

    this.addItem({
      'name': 'ANNOTATIVE',
    });

    // DesignCore.scene.saveRequired();
  }

  dxf(file) {
    // Create table data for text styles
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'STYLE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.itemCount());

    for (let i = 0; i < this.itemCount(); i++) {
      this.getItemByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
