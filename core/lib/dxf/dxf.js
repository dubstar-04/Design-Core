import { DXFReader } from './dxfRead.js';
import { DXFWriter } from './dxfWrite.js';
import { DXFFile } from './dxfFile.js';
import { Point } from '../../entities/point.js';
import { Strings } from '../strings.js';
import { Logging } from '../logging.js';

import { DesignCore } from '../../designCore.js';

/** DXF Class */
export class DXF {
  /** Create DXF */
  constructor() {
    this.reader;
    this.writer;

    // flag indicates if dxf contains unsupported elements
    this.unsupportedElements = false;
  }

  /**
   * Read
   * @param {Object} data
   */
  read(data) {
    this.reader = new DXFReader();
    this.reader.read(data);
  }

  /**
   * Write
   * @param {string} version
   * @return {Object}
   */
  write(version) {
    const writer = new DXFWriter();
    const data = writer.write(version);
    return data;
  }

  /**
   * Load DXF
   * @param {string} data
   */
  loadDxf(data) {
    Logging.instance.debug('Loading File');
    this.read(data);

    // load handseed first to ensure the handle counter is correctly set
    // before any new handles are assigned during table/block/entity loading
    this.loadHandseed();

    this.loadTables();
    this.loadBlocks();
    this.loadEntities();

    // load headers for styles and version
    this.loadHeader();

    if (this.unsupportedElements) {
      DesignCore.Core.notify(Strings.Warning.UNSUPPORTEDENTITIES);
    }
  }

  /**
   * Load Handseed from header
   * Must be called before loading tables/blocks/entities
   * to ensure the handle counter is set beyond all handles in the file
   */
  loadHandseed() {
    const header = this.reader.header;

    if (header.hasOwnProperty('$HANDSEED')) {
      const handseed = header['$HANDSEED'];
      if (handseed.hasOwnProperty('5')) {
        const maxHandseed = handseed['5'];
        Logging.instance.debug(`Opening DXF Handseed: ${maxHandseed}`);
        DesignCore.HandleManager.handseed = maxHandseed;
      }
    }
  }

  /**
   * Load Header
   */
  loadHeader() {
    const header = this.reader.header;

    if (header.hasOwnProperty('$TEXTSTYLE')) {
      const cstyle = header['$TEXTSTYLE'];
      if (cstyle.hasOwnProperty('7')) {
        const styleName = cstyle['7'];
        DesignCore.StyleManager.setCstyle(styleName);
      }
    }

    if (header.hasOwnProperty('$CLAYER')) {
      const clayer = header['$CLAYER'];
      if (clayer.hasOwnProperty('8')) {
        const layerName = clayer['8'];
        DesignCore.LayerManager.setCstyle(layerName);
      }
    }

    if (header.hasOwnProperty('$DIMSTYLE')) {
      const dimstyle = header['$DIMSTYLE'];
      if (dimstyle.hasOwnProperty('2')) {
        const styleName = dimstyle['2'];
        DesignCore.DimStyleManager.setCstyle(styleName);
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


  /**
   * Load Tables
   */
  loadTables() {
    const tables = this.reader.tables;

    tables.forEach((table) => {
      if (table[2] === 'LAYER') {
        if (table[5]) DesignCore.LayerManager.handle = table[5];
        table.children.forEach((layer) => {
          DesignCore.LayerManager.addItem(layer, true);
        });
      }

      if (table[2] === 'LTYPE') {
        if (table[5]) DesignCore.LTypeManager.handle = table[5];
        table.children.forEach((ltype) => {
          DesignCore.LTypeManager.addItem(ltype, true);
        });
      }

      if (table[2] === 'STYLE') {
        if (table[5]) DesignCore.StyleManager.handle = table[5];
        table.children.forEach((style) => {
          DesignCore.StyleManager.addItem(style, true);
        });
      }

      if (table[2] === 'DIMSTYLE') {
        if (table[5]) DesignCore.DimStyleManager.handle = table[5];
        table.children.forEach((style) => {
          DesignCore.DimStyleManager.addItem(style, true);
        });
      }

      if (table[2] === 'VPORT') {
        if (table[5]) DesignCore.VPortManager.handle = table[5];
      }

      if (table[2] === 'VIEW') {
        if (table[5]) DesignCore.ViewManager.handle = table[5];
      }

      if (table[2] === 'UCS') {
        if (table[5]) DesignCore.UCSManager.handle = table[5];
      }

      if (table[2] === 'APPID') {
        if (table[5]) DesignCore.AppIDManager.handle = table[5];
      }

      if (table[2] === 'BLOCK_RECORD') {
        if (table[5]) DesignCore.BlockRecordManager.handle = table[5];
        // Build a map of block name to block record handle
        // This is used when loading blocks to assign the correct blockRecordHandle
        this.blockRecordHandles = {};
        if (table.children) {
          table.children.forEach((record) => {
            if (record[2] && record[5]) {
              this.blockRecordHandles[record[2]] = record[5];
            }
          });
        }
      }
    });
  }

  /**
   * Load Blocks
   */
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

          // Extract the ENDBLK handle from the block children
          if (child[0] === 'ENDBLK' && child[5]) {
            block.endblkHandle = child[5];
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

      // Assign the block record handle from the BLOCK_RECORD table
      if (this.blockRecordHandles && block[2] && this.blockRecordHandles[block[2]]) {
        block.blockRecordHandle = this.blockRecordHandles[block[2]];
      }

      DesignCore.Scene.blockManager.addItem(block, true);
    });
  }

  /**
   * Load Entities
   */
  loadEntities() {
    const entities = this.reader.entities;

    entities.forEach((entity) => {
      if (entity.hasOwnProperty('points')) {
        entity.points = this.parsePoints(entity.points);
      }

      this.addItem(entity);
    });

    // ensure all layers, ltypes, styles, dimstyles exist
    DesignCore.LayerManager.checkItems();
    DesignCore.LTypeManager.checkItems();
    DesignCore.StyleManager.checkItems();
    DesignCore.DimStyleManager.checkItems();
  }

  /**
   * Add Item
   * @param {Object} item
   */
  addItem(item) {
    if (item.hasOwnProperty('0') === false) {
      return;
    }

    const command = item[0];
    if (DesignCore.CommandManager.isCommand(command)) {
      const entity = DesignCore.CommandManager.createNew(command, item);
      DesignCore.Scene.entities.add(entity);
    } else {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND} ${command}`);
      this.unsupportedElements = true;
    }
  }

  /**
   * Parse Points
   * @param {Object} dxfPoints
   * @return {Array}
   */
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
