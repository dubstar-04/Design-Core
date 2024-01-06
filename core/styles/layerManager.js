import {DXFFile} from '../lib/dxf/dxfFile.js';
import {Layer} from './layer.js';
import {StyleManagerBase} from './styleManagerBase.js';

export class LayerManager extends StyleManagerBase {
  constructor() {
    super();

    this.indelibleStyles.push('0', 'DEFPOINTS');
    this.styleProperty = 'layer';
  }

  createStyle(style) {
    return new Layer(style);
  }

  addStandardStyles() {
    this.addStyle({'name': '0', 'colour': '#00BFFF'});
    this.addStyle({'name': 'DEFPOINTS', 'plotting': false});
    this.addStyle({'name': 'CENTERLINE', 'colour': '#FFFF00', 'lineType': 'CENTER'});
    this.addStyle({'name': 'HIDDEN', 'colour': '#D6D6D6', 'lineType': 'HIDDEN'});
  }

  dxf(file) {
    // Create table data for layers
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'LAYER');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.styleCount());

    for (let i = 0; i < this.styleCount(); i++) {
      if (this.getStyleByIndex(i).name !== 'DEFPOINTS') {
        this.getStyleByIndex(i).dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
