import {DXFFile} from '../lib/dxf/dxfFile.js';
import {DimStyle} from './dimStyle.js';
import {StyleManagerBase} from './styleManagerBase.js';

export class DimStyleManager extends StyleManagerBase {
  constructor(core) {
    super(core);
  }

  createStyle(style) {
    return new DimStyle(style);
  }

  addStandardStyles() {
    this.addStyle({
      'name': 'STANDARD',
    });
    /*
    this.addStyle({
      'name': 'ANNOTATIVE',
    });
    */
    // this.core.scene.saveRequired();
  }

  dxf(file) {
    // Create table data for dimension styles
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'DIMSTYLE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDimStyleTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.styleCount());

    for (let i = 0; i < this.styleCount(); i++) {
      this.getStyleByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
