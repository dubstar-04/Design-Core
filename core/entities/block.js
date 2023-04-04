import {Point} from './point.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';

export class Block extends Entity {
  constructor(data) {
    super(data);
    this.name = '';

    Object.defineProperty(this, 'location', {
      enumerable: false,
      value: new Point(),
      writable: true,
    });

    Object.defineProperty(this, 'flags', {
      enumerable: false,
      value: 1,
      writable: true,
    });

    Object.defineProperty(this, 'items', {
      enumerable: false,
      value: [],
      writable: true,
    });

    if (data) {
      if (data.name || data[2]) {
        // DXF Groupcode 2 - Block Name
        this.name = data.name || data[2];
      }

      if (data.points) {
        this.location = data.points[0];
      }

      if (data.items) {
        this.items = data.items;
      }

      if (data.flags || data[70]) {
        // DXF Groupcode 70 - Block-type flags (bit-coded):
        // 0 = Indicates none of the following flags apply
        // 1 = This is an anonymous block generated by hatching, associative dimensioning, other internal operations, or an application
        // 2 = This block has non-constant attribute definitions (this bit is not set if the block has any attribute definitions that are constant, or has no attribute definitions at all)
        // 4 = This block is an external reference (xref)
        // 8 = This block is an xref overlay
        // 16 = This block is externally dependent
        // 32 = This is a resolved external reference, or dependent of an external reference (ignored on input)
        // 64 = This definition is a referenced external reference (ignored on input)

        this.flags = data.flags || data[70];
      }
    }
  }

  static register() {
    const command = {command: 'Block'};
    return command;
  }

  setStandardFlags() {
    // Set standard flags (bit-coded values)
    this.flags = 1;
  }

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'BLOCK',
        '\n', '8',
        '\n', 0,
        '\n', '2', // name
        '\n', this.name,
        '\n', '70', // Flags
        '\n', this.flags,
        '\n', '10', // X
        '\n', this.points[0].x,
        '\n', '20', // Y
        '\n', this.points[0].y,
        '\n', '30', // Z
        '\n', '0.0',
        '\n', '3', // name again
        '\n', this.name,
    );
    return data;
  }

  clearItems() {
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);
  }

  addInsert(data) {
    const point = new Point(data.points[0].x, data.points[0].y);
    this.points[0] = point;
  }

  draw(ctx, scale, core, colour) {
    if (!this.items.length) {
      // nothing to draw
      return;
    }

    ctx.save();

    try { // HTML Canvas
      ctx.strokeStyle = colour;
      ctx.lineWidth = this.lineWidth / scale;
      ctx.beginPath();
    } catch { // Cairo
      ctx.setLineWidth(this.lineWidth / scale);
      const rgbColour = Colours.hexToScaledRGB(colour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
    }

    // blocks are associated with an insert point.
    // translate ctx by the insert location
    // this allows the items to be draw without knowing the insert location of the parent block
    ctx.translate(this.points[0].x, this.points[0].y);

    for (let item = 0; item < this.items.length; item++) {
      // console.log("block draw - Item:", this.items[item])
      if (typeof this.items[item].draw == 'function') {
        // handle item colour
        const itemColour = this.items[item].colour;
        if (itemColour === 'BYBLOCK') {
          this.items[item].colour = colour;
        }
        this.items[item].draw(ctx, scale, core, colour);
        // reset item colour
        this.items[item].colour = itemColour;
      } else {
        // console.log('block.js - [draw] [INFO]:Item has no draw function - Item:', this.items[item]);
      }
    }

    ctx.restore();

    /*
        //////////////////////////////////////////
        // draw test point for location
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1 / scale;
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.arc(this.points[0].x, this.points[0].y, 5 / scale, radians2degrees(0), radians2degrees(360), false);
        ctx.stroke();
        //////////////////////////////////////////
        */
  }

  snaps(mousePoint, delta, core) {
    let snaps = [];

    if (!this.items.length) {
      // nothing to draw
      return snaps;
    }

    snaps = [this.points[0]];

    for (let item = 0; item < this.items.length; item++) {
      // collect the child item snaps
      const itemSnaps = this.items[item].snaps(mousePoint, delta, core);

      for (let snap = 0; snap < itemSnaps.length; snap++) {
        // offset the item snap point by the block insert location
        let snapPoint = itemSnaps[snap];
        snapPoint = snapPoint.add(this.points[0]);
        snaps.push(snapPoint);
      }
    }

    return snaps;
  }

  intersectPoints() {
    return {
      start: this.points[0],
      end: this.points[0],
    };
  }

  closestPoint(P) {
    let distance = Infinity;
    let minPnt = P;

    if (!this.items.length) {
      // nothing to draw
      return [minPnt, distance];
    }

    // adjust the selection point to offset by the block insert position
    const adjustedPoint = P.subtract(this.points[0]);

    for (let idx = 0; idx < this.items.length; idx++) {
      const itemClosestPoint = this.items[idx].closestPoint(adjustedPoint);
      const itemPnt = itemClosestPoint[0].add(this.points[0]); // adjust by the block insert position
      const itemDist = itemClosestPoint[1];

      if (itemDist < distance) {
        distance = itemDist;
        minPnt = itemPnt;
      }
    }

    return [minPnt, distance];
  }

  extremes() {
    let xmin = 0;
    let xmax = 0;
    let ymin = 0;
    let ymax = 0;

    for (let idx = 0; idx < this.items.length; idx++) {
      const itemExtremes = this.items[idx].extremes();

      xmin = Math.min(xmin, itemExtremes[0]);
      xmax = Math.max(xmax, itemExtremes[1]);
      ymin = Math.min(ymin, itemExtremes[2]);
      ymax = Math.max(ymax, itemExtremes[3]);
    }

    return [xmin, xmax, ymin, ymax];
  }

  touched(selectionExtremes, core) {
    if (!this.items.length) {
      // nothing to draw
      return false;
    }

    const layer = core.layerManager.getLayerByName(this.layer);

    if (!layer.isSelectable) {
      return;
    }

    // Offset selectionExtremes by the block insert position
    const adjustedSelectionExtremes = [
      selectionExtremes[0] - this.points[0].x,
      selectionExtremes[1] - this.points[0].x,
      selectionExtremes[2] - this.points[0].y,
      selectionExtremes[3] - this.points[0].y,
    ];

    for (let idx = 0; idx < this.items.length; idx++) {
      const touched = this.items[idx].touched(adjustedSelectionExtremes, core);
      if (touched) {
        return true;
      }
    }
  }
}
