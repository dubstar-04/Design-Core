import {DXFFile} from './dxfFile.js';
import {DesignCore} from '../../designCore.js';

export class DXFWriter {
  constructor() {
  }

  /**
   * Write DXF header section
   * @param {DXFFile} file
   */
  writeHeaders(file) {
    // write headers
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'HEADER');
    file.writeGroupCode('9', '$ACADVER');
    file.writeGroupCode('1', file.version);
    file.writeGroupCode('9', '$CLAYER');
    file.writeGroupCode('8', DesignCore.LayerManager.getCstyle());
    file.writeGroupCode('9', '$HANDSEED', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.formatHandle(DesignCore.Scene.items.length + 200), DXFFile.Version.R2000); // TODO: This needs to reflect the actual handle values
    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write DXF table section
   * @param {DXFFile} file
   */
  writeTables(file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'TABLES');

    // type table
    DesignCore.LTypeManager.dxf(file);
    // layer table
    DesignCore.LayerManager.dxf(file);
    // style table
    DesignCore.StyleManager.dxf(file);
    // dimstyle table
    DesignCore.DimStyleManager.dxf(file);
    // vport table
    DesignCore.Scene.dxf(file);

    // VIEW Table
    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'VIEW', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);

    // UCS TABLE
    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'UCS', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);

    // APPID Table
    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'APPID', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'APPID', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbRegAppTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'ACAD', DXFFile.Version.R2000);
    file.writeGroupCode('70', '0', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);

    // BLOCK_RECORD Table
    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'BLOCK_RECORD', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', '2', DXFFile.Version.R2000);

    // Model Space
    file.writeGroupCode('0', 'BLOCK_RECORD', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbBlockTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', '*Model_Space', DXFFile.Version.R2000);
    file.writeGroupCode('340', '22', DXFFile.Version.R2000);

    // Paper Space
    file.writeGroupCode('0', 'BLOCK_RECORD', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbBlockTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', '*Paper_Space', DXFFile.Version.R2000);
    file.writeGroupCode('340', '22', DXFFile.Version.R2000);

    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);

    // end tables section
    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write DXF block section
   * @param {DXFFile} file
   */
  writeBlocks(file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'BLOCKS');

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      if (DesignCore.Scene.items[i].type === 'Block') {
        DesignCore.Scene.items[i].dxf(file);
      }
    }


    // Three empty definitions always appear in the BLOCKS section.
    // They are titled *Model_Space, *Paper_Space and *Paper_Space0.
    // Model Space
    file.writeGroupCode('0', 'BLOCK', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', '0', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbBlockBegin', DXFFile.Version.R2000);
    file.writeGroupCode('2', '*Model_Space', DXFFile.Version.R2000);
    file.writeGroupCode('10', '0.0', DXFFile.Version.R2000);
    file.writeGroupCode('20', '0.0', DXFFile.Version.R2000);
    file.writeGroupCode('30', '0.0', DXFFile.Version.R2000);
    file.writeGroupCode('3', '*Model_Space', DXFFile.Version.R2000);
    file.writeGroupCode('1', '', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDBLK', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', '0', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbBlockEnd', DXFFile.Version.R2000);

    // Model Space
    file.writeGroupCode('0', 'BLOCK', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', '0', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbBlockBegin', DXFFile.Version.R2000);
    file.writeGroupCode('2', '*Paper_Space', DXFFile.Version.R2000);
    file.writeGroupCode('10', '0.0', DXFFile.Version.R2000);
    file.writeGroupCode('20', '0.0', DXFFile.Version.R2000);
    file.writeGroupCode('30', '0.0', DXFFile.Version.R2000);
    file.writeGroupCode('3', '*Paper_Space', DXFFile.Version.R2000);
    file.writeGroupCode('1', '', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDBLK', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', '0', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbBlockEnd', DXFFile.Version.R2000);


    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write DXF entities section
   * @param {DXFFile} file
   */
  writeEntities(file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'ENTITIES');

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      if (DesignCore.Scene.items[i].type !== 'Block') {
        DesignCore.Scene.items[i].dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write DXF file
   * @returns dxf formatted string formatted
   */
  write(version) {
    if (version === undefined) {
      version = DesignCore.Core.dxfVersion;
    }
    const file = new DXFFile(version);
    // write start of file
    file.writeGroupCode('999', 'DXF created from Design-Core');

    // write sections
    this.writeHeaders(file);
    this.writeTables(file);
    this.writeBlocks(file);
    this.writeEntities(file);

    // Dictionary
    file.writeGroupCode('0', 'SECTION', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'OBJECTS', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'DICTIONARY', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDictionary', DXFFile.Version.R2000);
    file.writeGroupCode('281', '1', DXFFile.Version.R2000);
    file.writeGroupCode('3', 'ACAD_GROUP', DXFFile.Version.R2000);
    file.writeGroupCode('350', 'D', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'DICTIONARY', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDictionary', DXFFile.Version.R2000);
    file.writeGroupCode('281', '1', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDSEC', DXFFile.Version.R2000);

    // write end of file
    file.writeGroupCode('0', 'EOF');

    return file.contents;
  }
}
