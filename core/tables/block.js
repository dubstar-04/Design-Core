import {Point} from '../entities/point.js';
import {Entity} from '../entities/entity.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';
import {Strings} from '../lib/strings.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Flags} from '../properties/flags.js';
import {Property} from '../properties/property.js';

import {DesignCore} from '../designCore.js';

/**
 * Block Entity Class
 * @extends Entity
 */
export class Block extends Entity {
  /**
   * Create a Block Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);
    this.name = '';
    this.points = [new Point()];

    Object.defineProperty(this, 'flags', {
      value: new Flags(),
      writable: true,
    });

    Object.defineProperty(this, 'items', {
      value: [],
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('name') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - Block Name
        this.name = data.name || data[2];
      }

      if (data.hasOwnProperty('items')) {
        this.items = data.items;
      }

      if (data.hasOwnProperty('flags') || data.hasOwnProperty('70')) {
        // DXF Groupcode 70 - Block-type flags (bit-coded):
        // 0 = Indicates none of the following flags apply
        // 1 = This is an anonymous block generated by hatching, associative dimensioning, other internal operations, or an application
        // 2 = This block has non-constant attribute definitions (this bit is not set if the block has any attribute definitions that are constant, or has no attribute definitions at all)
        // 4 = This block is an external reference (xref)
        // 8 = This block is an xref overlay
        // 16 = This block is externally dependent
        // 32 = This is a resolved external reference, or dependent of an external reference (ignored on input)
        // 64 = This definition is a referenced external reference (ignored on input)

        this.flags.setFlagValue(Property.loadValue([data.flags, data[70]], 0));
      }
    }
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = {command: 'Block', shortcut: 'B'};
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      // set a name
      const name = `Block-${DesignCore.Scene.blockManager.itemCount()}`;
      const nameOp = new PromptOptions(`${Strings.Input.NAME} <${name}>`, [
        Input.Type.STRING,
      ]);
      const selectedName =
        await DesignCore.Scene.inputManager.requestInput(nameOp);

      // get the insertion point
      const op2 = new PromptOptions(Strings.Input.BASEPOINT, [
        Input.Type.POINT,
      ]);
      const insertPoint = await DesignCore.Scene.inputManager.requestInput(op2);

      // get the block entities
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [
        Input.Type.SELECTIONSET,
      ]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      // create block
      const block = DesignCore.Scene.blockManager.addItem({
        name: selectedName,
      });

      // get a copy of the selection set
      const selections =
        DesignCore.Scene.selectionManager.selectionSet.selectionSet.slice();
      // sort the selection in descending order
      selections.sort((a, b) => b - a);

      // move selected items from scene to block
      selections.forEach((index) => {
        const item = DesignCore.Scene.items.splice(index, 1)[0];
        // adjust the items points to reflect the insert point
        if (item.hasOwnProperty('points')) {
          item.move(-insertPoint.x, -insertPoint.y);
        }
        block.items.push(item);
      });

      // define insert data
      const insertData = {
        type: 'Insert',
        points: [new Point(insertPoint.x, insertPoint.y)],
        blockName: selectedName,
      };

      // create the insert
      DesignCore.Scene.inputManager.executeCommand(insertData);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {}

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'BLOCK');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbBlockBegin', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name);
    file.writeGroupCode('70', this.flags.getFlagValue());
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', 0.0);
    file.writeGroupCode('3', this.name); // Name again
    file.writeGroupCode('1', '');

    for (let i = 0; i <this.items.length; i++) {
      this.items[i].dxf(file);
    }

    file.writeGroupCode('0', 'ENDBLK');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbBlockEnd', DXFFile.Version.R2000);
  }

  /**
   * Clear items from the block
   */
  clearItems() {
    this.items = [];
  }

  /**
   * Add an item to the block
   * @param {Object} item
   */
  addItem(item) {
    this.items.push(item);
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {number} scale
   * @param {Object} insert - insert entity
   */
  draw(ctx, scale, insert = undefined) {
    if (!this.items.length) {
      // nothing to draw
      return;
    }

    this.items.forEach((item) => {
      ctx.save();
      // Use the current item and block insert to set the context
      // insert required for colour ByBlock
      DesignCore.Canvas.setContext(item, ctx, insert);

      item.draw(ctx, scale);
      ctx.restore();
    });

    /*
        //////////////////////////////////////////
        // draw test point for location
        ctx.strokeStyle = Colours.rgbToString(colour);
        ctx.lineWidth = 1 / scale;
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.arc(this.points[0].x, this.points[0].y, 5 / scale, radians2degrees(0), radians2degrees(360), false);
        ctx.stroke();
        //////////////////////////////////////////
        */
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];

    if (!this.items.length) {
      // nothing to draw
      return snaps;
    }

    for (let item = 0; item < this.items.length; item++) {
      // collect the child item snaps
      const itemSnaps = this.items[item].snaps(mousePoint, delta);
      snaps.push(...itemSnaps);
    }

    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    let distance = Infinity;
    let minPnt = P;

    if (!this.items.length) {
      // nothing to draw
      return [minPnt, distance];
    }

    for (let idx = 0; idx < this.items.length; idx++) {
      const itemClosestPoint = this.items[idx].closestPoint(P);
      const itemPnt = itemClosestPoint[0];
      const itemDist = itemClosestPoint[1];

      if (itemDist < distance) {
        distance = itemDist;
        minPnt = itemPnt;
      }
    }

    return [minPnt, distance];
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (let idx = 0; idx < this.items.length; idx++) {
      const itemBoundingBox = this.items[idx].boundingBox();

      xmin = Math.min(xmin, itemBoundingBox.xMin);
      xmax = Math.max(xmax, itemBoundingBox.xMax);
      ymin = Math.min(ymin, itemBoundingBox.yMin);
      ymax = Math.max(ymax, itemBoundingBox.yMax);
    }

    const topLeft = new Point(xmin, ymax);
    const bottomRight = new Point(xmax, ymin);

    return new BoundingBox(topLeft, bottomRight);
  }

  /**
   * Determine if the entity is touch the selection window
   * @param {Array} selectionExtremes
   * @return {boolean} true if touched
   */
  touched(selectionExtremes) {
    for (let idx = 0; idx < this.items.length; idx++) {
      const touched = this.items[idx].touched(selectionExtremes);
      if (touched) {
        return true;
      }
    }

    return false;
  }
}
