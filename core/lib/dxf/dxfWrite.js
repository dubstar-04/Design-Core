import {DXFFile} from './dxfFile.js';

export class DXFWriter {
  constructor() {
  }

  /**
   * Write DXF header section
   * @param {object} core
   * @param {DXFFile} file
   */
  writeHeaders(core, file) {
    // write headers
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'HEADER');
    file.writeGroupCode('9', '$ACADVER');
    file.writeGroupCode('1', file.version);
    file.writeGroupCode('9', '$CLAYER');
    file.writeGroupCode('8', core.layerManager.getCLayer());
    file.writeGroupCode('9', '$HANDSEED', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.formatHandle(core.scene.items.length + 200), DXFFile.Version.R2000); // TODO: This needs to reflect the actual handle values
    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write DXF table section
   * @param {object} core
   * @param {DXFFile} file
   */
  writeTables(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'TABLES');

    // type table
    core.ltypeManager.dxf(file);
    // layer table
    core.layerManager.dxf(file);
    // style table
    core.styleManager.dxf(file);
    // dimstyle table
    core.dimStyleManager.dxf(file);
    // vport table
    core.scene.dxf(file);

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
   * @param {object} core
   * @param {DXFFile} file
   */
  writeBlocks(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'BLOCKS');

    for (let i = 0; i < core.scene.items.length; i++) {
      if (core.scene.items[i].type === 'Block') {
        core.scene.items[i].dxf(file);
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
   * @param {object} core
   * @param {DXFFile} file
   */
  writeEntities(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'ENTITIES');

    for (let i = 0; i < core.scene.items.length; i++) {
      if (core.scene.items[i].type !== 'Block') {
        core.scene.items[i].dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write DXF file
   * @param {object} core
   * @returns dxf formatted string formatted
   */
  write(core, version) {
    if (version === undefined) {
      version = core.dxfVersion;
    }
    const file = new DXFFile(version);
    // write start of file
    file.writeGroupCode('999', 'DXF created from Design-Core');

    // write sections
    this.writeHeaders(core, file);
    this.writeTables(core, file);
    this.writeBlocks(core, file);
    this.writeEntities(core, file);

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
