import {DXFReader} from './dxfRead.js';
import {DXFWriter} from './dxfWrite.js';
import {Point} from '../../entities/point.js';

export class DXF {
  constructor() {
    this.reader;
    this.writer;
  }

  read(data) {
    this.reader = new DXFReader();
    this.reader.read(data);
  }

  write(core) {
    const writer = new DXFWriter();
    const data = writer.write(core);
    return data;
  }

  loadDxf(core, data) {
    this.read(data);

    this.loadTables(core);
    this.loadBlocks(core);
    this.loadEntities(core);

    // load headers last to ensure the elements and layers exist
    this.loadHeader(core);
  }

  loadHeader(core) {
    const header = this.reader.header;

    if (header.hasOwnProperty('$CLAYER')) {
      const clayer = header['$CLAYER'];
      if (clayer.hasOwnProperty('8')) {
        const layerName = clayer['8'];
        core.layerManager.setCLayer(layerName);
      }
    }
  }


  loadTables(core) {
    const tables = this.reader.tables;

    tables.forEach((table) => {
      if (table[2] === 'LAYER') {
        table.children.forEach((layer) => {
          core.layerManager.addLayer(layer);
        });
      }
    });
  }

  loadBlocks(core) {
    const blocks = this.reader.blocks;

    blocks.forEach((block) => {
      // log(block);
      if (block.hasOwnProperty('points')) {
        block.points = this.parsePoints(block.points);
      }

      if (block.hasOwnProperty('children')) {
        block.children.forEach((child) => {
          // check the child has a command type
          if (child.hasOwnProperty('0') === false) {
            return;
          }
          // Convert child points to design points
          if (child.hasOwnProperty('points')) {
            child.points = this.parsePoints(child.points);
          }

          const command = child[0];
          // check if the child is a valid entity
          if (core.commandManager.isCommand(command)) {
            // create an instance of the child entity
            const item = core.commandManager.createNew(command, child);

            if (block.hasOwnProperty('items') === false) {
              block.items = [];
            }

            // add the child to the block items
            // TODO: create a block instance and add the items.
            // check block is valid before adding to scene
            block.items.push(item);
          }
        });
      }

      this.addToScene(core, block);
    });
  }

  loadEntities(core) {
    const entities = this.reader.entities;

    entities.forEach((entity) => {
      if (entity.hasOwnProperty('points')) {
        entity.points = this.parsePoints(entity.points);
      }

      this.addToScene(core, entity);
    });
  }

  addToScene(core, item) {
    if (item.hasOwnProperty('0') === false) {
      return;
    }

    const command = item[0];
    if (core.commandManager.isCommand(command)) {
      core.scene.addToScene(command, item);
    } else {
      console.log(`WARNING: Unknown command - ${command}`);
    }
  }

  parsePoints(dxfPoints) {
    const points = [];
    dxfPoints.forEach((point) => {
      const pt = new Point(point.x, point.y);
      if (point.hasOwnProperty('bulge')) {
        // console.log('WARNING: Bulge not handled');
        pt.bulge = point.bulge;
      }
      points.push(pt);
    });
    return points;
  }
}
