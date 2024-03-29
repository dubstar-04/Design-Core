import {DXFReader} from './dxfRead.js';
import {DXFWriter} from './dxfWrite.js';
import {DXFFile} from './dxfFile.js';
import {Point} from '../../entities/point.js';
import {Strings} from '../strings.js';
import {Logging} from '../logging.js';

import {DesignCore} from '../../designCore.js';

export class DXF {
  constructor() {
    this.reader;
    this.writer;

    // flag indicates if dxf contains unsupported elements
    this.unsupportedElements = false;
  }

  read(data) {
    this.reader = new DXFReader();
    this.reader.read(data);
  }

  write(version) {
    const writer = new DXFWriter();
    const data = writer.write(version);
    return data;
  }

  loadDxf(data) {
    Logging.instance.debug('Loading File');
    this.read(data);

    this.loadTables();
    this.loadBlocks();
    this.loadEntities();

    // load headers last to ensure the elements and layers exist
    this.loadHeader();

    if (this.unsupportedElements) {
      DesignCore.Core.notify(Strings.Warning.UNSUPPORTEDENTITIES);
    }
  }

  loadHeader() {
    const header = this.reader.header;

    if (header.hasOwnProperty('$CLAYER')) {
      const clayer = header['$CLAYER'];
      if (clayer.hasOwnProperty('8')) {
        const layerName = clayer['8'];
        DesignCore.LayerManager.setCstyle(layerName);
      }
    }

    if (header.hasOwnProperty('$ACADVER')) {
      const version = header['$ACADVER'];
      if (version.hasOwnProperty('1')) {
        const versionNumber = version['1'];
        // pass the version to core
        const versionKey = DXFFile.getVersionKey(versionNumber);
        Logging.instance.debug(`Opening DXF Version: ${versionKey}`);
        DesignCore.Core.dxfVersion = versionNumber;
      }
    }
  }


  loadTables() {
    const tables = this.reader.tables;

    tables.forEach((table) => {
      if (table[2] === 'LAYER') {
        table.children.forEach((layer) => {
          DesignCore.LayerManager.addStyle(layer, true);
        });
      }

      if (table[2] === 'LTYPE') {
        table.children.forEach((ltype) => {
          DesignCore.LTypeManager.addStyle(ltype, true);
        });
      }

      if (table[2] === 'STYLE') {
        table.children.forEach((style) => {
          DesignCore.StyleManager.addStyle(style, true);
        });
      }

      if (table[2] === 'DIMSTYLE') {
        table.children.forEach((style) => {
          DesignCore.DimStyleManager.addStyle(style, true);
        });
      }
    });
  }

  loadBlocks() {
    const blocks = this.reader.blocks;

    blocks.forEach((block) => {
      if (block.hasOwnProperty('2')) {
        /*
        Three empty definitions always appear in the BLOCKS section.
        They are titled *Model_Space, *Paper_Space and *Paper_Space0.
        These definitions manifest the representations of model space and paper space as block definitions internally.
        The internal name of the first paper space layout is *Paper_Space,
        the second is *Paper_Space0,
        the third is *Paper_Space1,
        and so on.
        */
        if (block[2].toUpperCase().includes('MODEL_SPACE')) {
          // skip model_space blocks
          return;
        }

        if (block[2].toUpperCase().includes('PAPER_SPACE')) {
          // skip paper_space blocks
          return;
        }
      }
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
          if (DesignCore.CommandManager.isCommand(command)) {
            // create an instance of the child entity
            const item = DesignCore.CommandManager.createNew(command, child);

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

      // this.addItem(block);
      DesignCore.Scene.blockManager.newBlock(block);
    });
  }

  loadEntities() {
    const entities = this.reader.entities;

    entities.forEach((entity) => {
      if (entity.hasOwnProperty('points')) {
        entity.points = this.parsePoints(entity.points);
      }

      this.addItem(entity);
    });
  }


  addItem(item) {
    if (item.hasOwnProperty('0') === false) {
      return;
    }

    const command = item[0];
    if (DesignCore.CommandManager.isCommand(command)) {
      DesignCore.Scene.addItem(command, item);
    } else {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND} ${command}`);
      this.unsupportedElements = true;
    }
  }

  parsePoints(dxfPoints) {
    const points = [];
    dxfPoints.forEach((point) => {
      const pt = new Point(point.x, point.y);
      if (point.hasOwnProperty('bulge')) {
        pt.bulge = point.bulge;
      }
      if (point.hasOwnProperty('sequence')) {
        pt.sequence = point.sequence;
      }
      points.push(pt);
    });
    return points;
  }
}
