import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BlockRecord } from './blockRecord.js';

import { DesignCore } from '../designCore.js';

/**
 * BlockRecordManager Class
 * Writes BLOCK_RECORD table entries based on the scene's block manager
 */
export class BlockRecordManager {
  /** Create a BlockRecordManager */
  constructor() {
    this.handle = DesignCore.HandleManager.next();
  }

  /**
   * Write the table to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    const blocks = DesignCore.Scene.blockManager.items;

    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'BLOCK_RECORD', DXFFile.Version.R2000);
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', blocks.length.toString(), DXFFile.Version.R2000);

    for (let i = 0; i < blocks.length; i++) {
      const record = new BlockRecord({ name: blocks[i].name });
      record.dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);
  }
}
