import {DXFFile} from '../lib/dxf/dxfFile.js';
import {StyleManagerBase} from './styleManagerBase.js';
import {Style} from './style.js';

export class StyleManager extends StyleManagerBase {
  constructor() {
    super();

    this.indelibleStyles.push('STANDARD');
    this.styleProperty = 'style';
  }

  createStyle(style) {
    return new Style(style);
  }

  addStandardStyles() {
    this.addStyle({
      'name': 'STANDARD',
    });

    this.addStyle({
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
    file.writeGroupCode('70', this.styleCount());

    for (let i = 0; i < this.styleCount(); i++) {
      this.getStyleByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
