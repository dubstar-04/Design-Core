import {Colours} from '../lib/colours.js';

export class Entity {
  constructor(data) {
    Object.defineProperty(this, 'type', {
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'family', {
      enumerable: false,
      value: 'Geometry',
      writable: true,
    });

    Object.defineProperty(this, 'showPreview', {
      enumerable: false,
      value: true,
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
    if (!core.layerManager.layerVisible(this.layer)) {
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

  extend(points, core) {
    // extend function to be overidden by implementation
  }

  trim(points, core) {
    // trim function to be overidden by implementation
  }
}