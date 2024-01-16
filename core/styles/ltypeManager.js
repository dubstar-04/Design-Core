import {DXFFile} from '../lib/dxf/dxfFile.js';
import {StyleManagerBase} from './styleManagerBase.js';
import {LType} from './ltype.js';

export class LTypeManager extends StyleManagerBase {
  constructor() {
    super();

    this.indelibleStyles.push('CONTINUOUS', 'ByLayer', 'ByBlock');
    this.styleProperty = 'linetype';
  }

  createStyle(style) {
    return new LType(style);
  }

  addStandardStyles() {
    this.addStyle({'name': 'CONTINUOUS', 'description': 'Solid Line ________________________________________'});
    this.addStyle({'name': 'ByLayer'});
    this.addStyle({'name': 'ByBlock'});
  }

  getOptionalStyles() {
    const styles = [];
    styles.push({'name': 'CONTINUOUS', 'description': 'Solid Line ________________________________________'});
    styles.push({'name': 'CENTER', 'pattern': [31.75, -6.35, 6.35, -6.35], 'description': 'Center ____ _ ____ _ ____ _ ____ _ ____ _ ____'});
    styles.push({'name': 'DASHDOT', 'pattern': [12.7, -6.345, 0, -6.345], 'description': 'Dash dot __ . __ . __ . __ . __ . __ . __ . __'});
    styles.push({'name': 'DOT', 'pattern': [0, -6.35], 'description': 'Dot . . . . . . . . . . . . . . . . . . . . . .'});
    styles.push({'name': 'DASHED', 'pattern': [12.7, -6.35], 'description': 'Dashed __ __ __ __ __ __ __ __ __ __ __ __ __ _'});
    styles.push({'name': 'HIDDEN', 'pattern': [6.35, -3.175], 'description': 'Hidden __ __ __ __ __ __ __ __ __ __ __ __ __ _'});
    return styles;
  }

  dxf(file) {
    // Create table data for ltype styles
    // The LTYPE Table must preceed the LAYER table
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'LTYPE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.styleCount());


    for (let i = 0; i < this.styleCount(); i++) {
      this.getStyleByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
