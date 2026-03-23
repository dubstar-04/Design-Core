import { DXFFile } from './dxfFile.js';
import { DesignCore } from '../../designCore.js';

/** DXF Writer Class */
export class DXFWriter {
  /** Create DXF Writer */
  constructor() { }

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
    file.writeGroupCode('9', '$TEXTSTYLE');
    file.writeGroupCode('7', DesignCore.StyleManager.getCstyle());
    file.writeGroupCode('9', '$CLAYER');
    file.writeGroupCode('8', DesignCore.LayerManager.getCstyle());
    file.writeGroupCode('9', '$DIMSTYLE');
    file.writeGroupCode('2', DesignCore.DimStyleManager.getCstyle());
    file.writeGroupCode('9', '$HANDSEED', DXFFile.Version.R2000);
    file.writeGroupCode('5', DesignCore.HandleManager.handseed, DXFFile.Version.R2000);
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
    DesignCore.VPortManager.dxf(file);
    // view table
    DesignCore.ViewManager.dxf(file);
    // ucs table
    DesignCore.UCSManager.dxf(file);
    // appid table
    DesignCore.AppIDManager.dxf(file);
    // block record table
    DesignCore.BlockRecordManager.dxf(file);

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

    for (let i = 0; i < DesignCore.Scene.blockManager.items.length; i++) {
      DesignCore.Scene.blockManager.items[i].dxf(file);
    }

    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write DXF entities section
   * @param {DXFFile} file
   */
  writeEntities(file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'ENTITIES');

    for (let i = 0; i < DesignCore.Scene.entities.count(); i++) {
      DesignCore.Scene.entities.get(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDSEC');
  }

  /**
   * Write Dictionary section
   * @param {DXFFile} file
   */
  writeObjects(file) {
    // Dictionary
    file.writeGroupCode('0', 'SECTION', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'OBJECTS', DXFFile.Version.R2000);

    DesignCore.DictionaryManager.dxf(file);

    file.writeGroupCode('0', 'ENDSEC', DXFFile.Version.R2000);
  }


  /**
   * Write DXF file
   * @param {string} version
   * @return {string} dxf formatted string formatted
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
    this.writeObjects(file);

    // write end of file
    file.writeGroupCode('0', 'EOF');

    return file.contents;
  }
}
