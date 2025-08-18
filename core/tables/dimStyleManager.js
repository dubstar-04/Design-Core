import { DXFFile } from '../lib/dxf/dxfFile.js';
import { DimStyle } from './dimStyle.js';
import { StyleManagerBase } from './styleManagerBase.js';

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
      // Add standard imperial dimension
      'name': 'STANDARD',
      /*
      Standard Defaults
      'DIMALTD': 2,
      'DIMAPOST': '',
      'DIMALTRND': 0,
      'DIMALTF': 25.4,
      'DIMALTTD': 2,
      'DIMALTTZ': 0,
      'DIMALTU': 2,
      'DIMALTMZF': 100,
      'DIMALTMZS': '',
      'DIMALTZ': 0,
      'DIMALT': 0,
      'DIMAUNIT': 0,
      'DIMADEC': 0,
      'DIMAZIN': 0,
      'DIMARCSYM': 0,
      'DIMBLK': 'ClosedFilled',
      'DIMBLK1': 'ClosedFilled',
      'DIMBLK2': 'ClosedFilled',
      'DIMASZ': 0.18,
      'DIMCEN': 0.09,
      'DIMDSEP': '.',
      'DIMCLRD': 'BYBLOCK',
      'DIMDLE': 0,
      'DIMTOFL': 0,
      'DIMLTYPE': 'BYBLOCK',
      'DIMLWD': -2,
      'DIMDLI': 0.38,
      'DIMTXTDIRECTION': 0,
      'DIMLTEX1': 'BYBLOCK',
      'DIMLTEX2': 'BYBLOCK',
      'DIMCLRE': 'BYBLOCK',
      'DIMEXE': 0.18,
      'DIMLWE': -2,
      'DIMEXO': 0.0625,
      'DIMATFIT': 3,
      'DIMTMOVE': 0,
      'DIMFXLON': 0,
      'DIMFXL': 1,
      'DIMFRAC': 0,
      'DIMJOGANG': 45,
      'DIMLDRBLK': 'ClosedFilled',
      'DIMLFAC': 1,
      'DIMLUNIT': 2,
      'DIMSD1': 0,
      'DIMSD2': 0,
      'DIMSOXD': 0,
      'DIMSE1': 0,
      'DIMSE2': 0,
      'DIMSCALE': 1,
      'DIMDEC': 4,
      'DIMRND': 0,
      'DIMSAH': 0,
      'DIMTFILLCLR': 'BYBLOCK',
      'DIMTFILL': 0,
      'DIMCLRT': 'BYBLOCK',
      'DIMTXT': 0.18,
      'DIMTIX': 0,
      'DIMTIH': 1,
      'DIMGAP': 0.09,
      'DIMTOH': 1,
      'DIMJUST': 0,
      'DIMTAD': 0,
      'DIMPOST': '',
      'DIMTXSTY': 'Standard',
      'DIMTM': 0,
      'DIMTP': 0,
      'DIMTOL': 0,
      'DIMLIM': 0,
      'DIMTOLJ': 1,
      'DIMTDEC': 4,
      'DIMTFAC': 1,
      'DIMTZIN': 0,
      'DIMMZF': 100,
      'DIMMZS': '',
      'DIMZIN': 0,
      */

    });

    this.addItem({
      // Add annotative dimension
      // set the properties where they are different to STANDARD dimstyle
      'name': 'ANNOTATIVE',
      'DIMALTD': 3,
      'DIMALTF': 0.0394,
      'DIMALTTD': 3,
      'DIMASZ': 2.5,
      'DIMCEN': 2.5,
      'DIMDSEP': ',',
      'DIMTOFL': 1,
      'DIMDLI': 3.75,
      'DIMEXE': 1.25,
      'DIMEXO': 0.625,
      'DIMSCALE': 0,
      'DIMDEC': 2,
      'DIMTXT': 2.5,
      'DIMTIH': 0,
      'DIMGAP': 0.625,
      'DIMTOH': 0,
      'DIMTAD': 1,
      'DIMTOLJ': 0,
      'DIMTDEC': 2,
      'DIMTZIN': 8,
      'DIMZIN': 8,

    });

    this.addItem({
      // Create standard metric dimension
      // set the properties where they are different to STANDARD dimstyle
      'name': 'ISO-25',
      'DIMALTD': 3,
      'DIMALTF': 0.0394,
      'DIMALTTD': 3,
      'DIMASZ': 2.5,
      'DIMCEN': 2.5,
      'DIMDSEP': ',',
      'DIMTOFL': 1,
      'DIMDLI': 3.75,
      'DIMEXE': 1.25,
      'DIMEXO': 0.625,
      'DIMDEC': 2,
      'DIMTXT': 2.5,
      'DIMTIH': 0,
      'DIMGAP': 0.625,
      'DIMTOH': 0,
      'DIMTAD': 1,
      'DIMTOLJ': 0,
      'DIMTDEC': 2,
      'DIMTZIN': 8,
      'DIMZIN': 8,
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
