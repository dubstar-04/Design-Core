import {Colours} from '../lib/colours.js';
import {Intersection} from '../lib/intersect.js';
import {Point} from './point.js';
import {Strings} from '../lib/strings.js';

export class Entity {
  constructor(data) {
    Object.defineProperty(this, 'type', {
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'helper_geometry', {
      enumerable: false,
      value: false,
      writable: true,
    });

    Object.defineProperty(this, 'points', {
      enumerable: false,
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'minPoints', {
      enumerable: false,
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'trueColour', {
      enumerable: false,
      writable: true,
    });

    this.lineWidth = 2;
    this.colour = 'BYLAYER';
    this.layer = '0';


    if (data) {
      if (data.points) {
        this.points = data.points;
      }

      if (data.colour || data[62]) {
        // DXF Groupcode 62 - Color Number
        // (present if not BYLAYER); zero indicates the BYBLOCK
        // (floating) color; 256 indicates BYLAYER; a negative value indicates that
        // the layer is turned off (optional)
        this.colour = data.colour || Colours.getHexColour(data[62]);
      }

      /*
      if (data.trueColour || data[420]) {
      // DXF Groupcode 420 - true color
      // A 24-bit color value that should be dealt with in terms of bytes with values
      // of 0 to 255. The lowest byte is the blue value, the middle byte is the
      // green value, and the third byte is the red value. The top byte is always
      // 0. The group code cannot be used by custom entities for their own data
      // because the group code is reserved for AcDbEntity, class-level color data
      // and AcDbEntity, class-level transparency data
        this.trueColour = data.trueColour;
      }
      */

      if (data.layer || data[8]) {
        // DXF Groupcode 8 - layername
        this.layer = data.layer || data[8];
      }
    }
  }

  getColour() {
    if (this.trueColour !== undefined) {
      return this.trueColour;
    }

    return this.colour;
  }


  within(selectionExtremes, core) {
    const layer = core.layerManager.getLayerByName(this.layer);
    if (!layer.isSelectable) {
      return;
    }

    // determin if this entities is within a the window specified by selectionExtremes
    const extremePoints = this.extremes();
    if ( extremePoints[0] > selectionExtremes[0] &&
         extremePoints[1] < selectionExtremes[1] &&
         extremePoints[2] > selectionExtremes[2] &&
         extremePoints[3] < selectionExtremes[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  touched(selectionExtremes, core) {
    const layer = core.layerManager.getLayerByName(this.layer);

    if (!layer.isSelectable) {
      return;
    }

    const rP1 = new Point(selectionExtremes[0], selectionExtremes[2]);
    const rP2 = new Point(selectionExtremes[1], selectionExtremes[3]);

    const rectPoints = {
      start: rP1,
      end: rP2,
    };

    const intersectFunction = `intersect${this.type}Rectangle`;

    if (Intersection.hasOwnProperty(intersectFunction) === false) {
      const msg = `${Strings.Error.INVALIDINTERSECTTYPE}: ${this.type}`;
      core.notify(msg);
      throw Error(msg);
    }

    const output = Intersection[intersectFunction](this.intersectPoints(), rectPoints);

    if (output.status === 'Intersection') {
      return true;
    }
    // no intersection found. return false
    return false;
  }

  extend(points, core) {
    // extend function to be overidden by implementation
  }

  trim(points, core) {
    // trim function to be overidden by implementation
  }
}
