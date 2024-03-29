import {Entity} from './entity.js';
import {Block} from '../blocks/block.js';

import {DesignCore} from '../designCore.js';

export class Insert extends Entity {
  constructor(data) {
    super(data);

    // add block property
    Object.defineProperty(this, 'block', {
      value: new Block(),
      writable: true,
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

      if (data.hasOwnProperty('50')) {
        // DXF Groupcode 50 - Rotation Angle (optional, default = 0)
        const err = 'Groupcode 50 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
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
    // file.writeGroupCode('5', ''); // Handle
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('2', this.block.name);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
  }

  draw(ctx, scale) {
    // blocks are associated with an insert point.
    // translate ctx by the insert location
    // this allows the block items to be draw without knowing the insert location

    ctx.save();
    ctx.translate(this.points[0].x, this.points[0].y);
    // pass *this* to the block to allow colour ByBlock
    this.block.draw(ctx, scale, this);
    ctx.restore();
  }

  snaps(mousePoint, delta) {
    const snaps = this.block.snaps(mousePoint, delta);
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
    let distance = P.distance(this.points[0]);
    let minPnt = this.points[0];

    // adjust P by the insert position
    P = P.subtract(this.points[0]);
    [minPnt, distance] = this.block.closestPoint(P);

    return [minPnt, distance];
  }

  boundingBox() {
    return this.block.boundingBox();
  }

  touched(selectionExtremes) {
    // adjust selectionExtremes by the insert position
    const [xmin, xmax, ymin, ymax] = selectionExtremes;
    const pt = this.points[0];
    const sE = [xmin - pt.x, xmax - pt.x, ymin - pt.y, ymax - pt.y];
    return this.block.touched(sE);
  }
}
