import {DXFFile} from '../lib/dxf/dxfFile.js';
import {DimStyle} from './dimStyle.js';
import {StyleManagerBase} from './styleManagerBase.js';

export class DimStyleManager extends StyleManagerBase {
  constructor() {
    super();

    this.indelibleStyles.push('STANDARD');
    this.styleProperty = 'styleName';
  }

  createStyle(style) {
    return new DimStyle(style);
  }

  addStandardStyles() {
    this.addStyle({
      'name': 'STANDARD',
      // DIMCLRD - 176 - Dimension line color
      // DIMCLRE - 177 - Dimension extension line color
      // DIMCLRT -  178 - Dimension text color
    });

    this.addStyle({
      'name': 'ANNOTATIVE',
    });

    // DesignCore.scene.saveRequired();
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
