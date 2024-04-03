import {Entity} from './entity.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {Block} from '../blocks/block.js';
import {BoundingBox} from '../lib/boundingBox.js';
import {Point} from './point.js';
import {Utils} from '../lib/utils.js';

import {DesignCore} from '../designCore.js';

export class Insert extends Entity {
  constructor(data) {
    super(data);

    // add block property
    Object.defineProperty(this, 'block', {
      value: new Block(),
      writable: true,
    });

    // add rotation property with getter and setter
    // needs to be enumerable to appear in the object props
    Object.defineProperty(this, 'rotation', {
      get: this.getRotation,
      set: this.setRotation,
      enumerable: true,
    });

    if (data) {
      if (data.hasOwnProperty('blockName') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - Block name

        const blockName = data.blockName || data[2];
        const block = DesignCore.Scene.blockManager.getBlockByName(blockName);
        this.block = block;
      }

      if (data.hasOwnProperty('41')) {
        // DXF Groupcode 41 - X Scale Factor (optional, default = 1)
        const err = 'Groupcode 41 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('42')) {
        // DXF Groupcode 42 - Y Scale Factor (optional, default = 1)
        const err = 'Groupcode 42 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('43')) {
        // DXF Groupcode 43 - Z Scale Factor (optional, default = 1)
        const err = 'Groupcode 43 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('44')) {
        // DXF Groupcode 44 - Column Spacing (optional, default = 0)
        const err = 'Groupcode 44 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('45')) {
        // DXF Groupcode 45 - Row Spacing (optional, default = 0)
        const err = 'Groupcode 45 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('rotation') || data.hasOwnProperty('50')) {
        // DXF Groupcode 50 - Text Rotation, angle in degrees
        // if we get rotation data store this as a point[1] at an angle from point[0]
        // this allows all the entities to be rotated by rotating the points i.e. not all entities have a rotation property

        const rotation = data.rotation || data[50];
        this.setRotation(rotation);
      } else {
        // create points[1] used to determine the text rotation
        this.points[1] = data.points[0].add(new Point(10, 0));
      }

      if (data.hasOwnProperty('70')) {
        // DXF Groupcode 70 - Column Count (optional, default = 1)
        const err = 'Groupcode 70 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data.hasOwnProperty('71')) {
        // DXF Groupcode 71 - Row Count(optional, default = 1)
        const err = 'Groupcode 71 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }
    }
  }

  static register() {
    const command = {command: 'Insert'};
    return command;
  }

  async execute() {
    DesignCore.Core.notify(`${this.type} - Not Implemented`);
    DesignCore.Scene.inputManager.reset();
  }

  preview() {
    // not implemented
  }

  dxf(file) {
    file.writeGroupCode('0', 'INSERT');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    this.writeDxfColour(file);
    file.writeGroupCode('100', 'AcDbBlockReference', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.block.name);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    if (this.rotation) {
      file.writeGroupCode('50', this.rotation);
    }
  }

  draw(ctx, scale) {
    // blocks are associated with an insert point.
    // translate ctx by the insert location
    // this allows the block items to be draw without knowing the insert location

    ctx.save();
    ctx.translate(this.points[0].x, this.points[0].y);
    const rotation = Utils.degrees2radians(this.rotation);
    ctx.rotate(rotation);
    // pass *this* to the block to allow colour ByBlock
    this.block.draw(ctx, scale, this);
    ctx.restore();
  }

  /**
   * Set the insert rotation
   * @param {number} angle - degrees
   */
  setRotation(angle) {
    // This overwrites the rotation rather than add to it.

    if (angle === undefined) {
      return;
    }

    if (angle !== 0) {
      this.points[1] = this.points[0].project(Utils.degrees2radians(angle), 10);
    }
  }

  /**
     * Get the insert rotation
     * @return {number} angle - degrees
     */
  getRotation() {
    if (this.points[1] !== undefined) {
      const angle = Utils.radians2degrees(this.points[0].angle(this.points[1]));
      return Utils.round(angle);
    }

    return 0;
  }

  snaps(mousePoint, delta) {
    const snaps = [];
    const blockSnaps = this.block.snaps(mousePoint, delta);

    for (let snap = 0; snap < blockSnaps.length; snap++) {
      // offset the item snap point by the block insert location
      let snapPoint = blockSnaps[snap];
      snapPoint = snapPoint.add(this.points[0]);
      snaps.push(snapPoint);
    }

    return snaps;
  }

  within(selectionExtremes) {
    // adjust selectionExtremes by the insert position
    const [xmin, xmax, ymin, ymax] = selectionExtremes;
    const pt = this.points[0];
    const sE = [xmin - pt.x, xmax - pt.x, ymin - pt.y, ymax - pt.y];
    return this.block.within(sE);
  }

  intersectPoints() {
    return {
      start: this.points[0],
      end: this.points[0],
    };
  }

  closestPoint(P) {
    // get the closest point from the blocks entities
    // adjust P by the insert position
    P = P.subtract(this.points[0]);
    return this.block.closestPoint(P); // [minPnt, distance];
  }

  boundingBox() {
    const blockBB = this.block.boundingBox();
    const topLeft = blockBB.pt1.add(this.points[0]);
    const bottomRight = blockBB.pt2.add(this.points[0]);
    return new BoundingBox(topLeft, bottomRight);
  }

  touched(selectionExtremes) {
    const layer = DesignCore.LayerManager.getStyleByName(this.layer);

    if (!layer.isSelectable) {
      return;
    }

    // adjust selectionExtremes by the insert position
    const [xmin, xmax, ymin, ymax] = selectionExtremes;
    const pt = this.points[0];
    const sE = [xmin - pt.x, xmax - pt.x, ymin - pt.y, ymax - pt.y];
    return this.block.touched(sE);
  }
}
