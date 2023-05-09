import {DXFFile} from './dxfFile.js';

export class DXFWriter {
  constructor() {
  }

  writeHeaders(core, file) {
    // write headers
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'HEADER');
    file.writeGroupCode('9', '$ACADVER');
    file.writeGroupCode('1', file.version);
    file.writeGroupCode('9', '$CLAYER');
    file.writeGroupCode('8', core.layerManager.getCLayer());
    file.writeGroupCode('0', 'ENDSEC');
  }

  writeTables(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'TABLES');

    // layer table
    core.layerManager.dxf(file);
    // style table
    core.styleManager.dxf(file);
    // dimstyle table
    core.dimStyleManager.dxf(file);
    // vport table
    core.scene.dxf(file);
  }

  writeBlocks(core, file) {
    file.writeGroupCode('0', 'SECTION');
    file.writeGroupCode('2', 'BLOCKS');

    for (let i = 0; i < core.scene.items.length; i++) {
      if (core.scene.items[i].type === 'Block') {
        core.scene.items[i].dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDSEC');
  }

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

  write(core) {
    const file = new DXFFile();
    // write start of file
    file.writeGroupCode('999', 'DXF created from Design-Core');

    // write sections
    this.writeHeaders(core, file);
    this.writeTables(core, file);
    this.writeBlocks(core, file);
    this.writeEntities(core, file);

    // write end of file
    file.writeGroupCode('0', 'EOF');

    return file.contents;
  }
}
