import {Colours} from '../lib/colours.js';
import {EntityColour} from '../lib/colour.js';
import {Intersection} from '../lib/intersect.js';
import {Point} from './point.js';
import {Strings} from '../lib/strings.js';
import {Property} from '../properties/property.js';


import {DesignCore} from '../designCore.js';

/**
 * Entity Class
 * @extend Entity
 */
export class Entity {
  /**
   * Create a Entity
   * @param {Array} data
   */
  constructor(data) {
    Object.defineProperty(this, 'type', {
      value: this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'points', {
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'colour', {
      get: this.getColour,
      set: this.setColour,
    });

    Object.defineProperty(this, 'entityColour', {
      value: new EntityColour(),
      writable: true,
    });

    this.lineWidth = 2;
    this.lineType = 'BYLAYER';
    this.layer = '0';


    if (data) {
      if (data.hasOwnProperty('points')) {
        this.points = data.points;
      }

      if (data.hasOwnProperty('colour') || data.hasOwnProperty('62')) {
        // DXF Groupcode 62 - Color Number (present if not BYLAYER)(optional);
        // zero indicates BYBLOCK
        // 256 indicates BYLAYER;
        // a negative value indicates that the layer is turned off
        if (data.colour) {
          if (Colours.isRGB(data.colour)) {
            this.colour = data.colour;
          }
        } else if (data.hasOwnProperty('62')) {
          this.entityColour.setColourFromACI(Math.abs(data[62]));
        }
      }

      if (data.hasOwnProperty('trueColour') || data.hasOwnProperty('420')) {
        // DXF Groupcode 420 - true color
        // A 24-bit color value that should be dealt with in terms of bytes with values
        // of 0 to 255. The lowest byte is the blue value, the middle byte is the
        // green value, and the third byte is the red value. The top byte is always
        // 0. The group code cannot be used by custom entities for their own data
        // because the group code is reserved for AcDbEntity, class-level color data
        // and AcDbEntity, class-level transparency data

        const trueColour = Colours.trueColourToRGB(data.trueColour || data[420]);
        if (trueColour) {
          this.colour = trueColour;
        }
      }


      if (data.hasOwnProperty('lineType') || data.hasOwnProperty('6')) {
        // DXF Groupcode 6 - lineType
        this.lineType = data.lineType || data[6];
      }

      if (data.hasOwnProperty('layer') || data.hasOwnProperty('8')) {
        // DXF Groupcode 8 - layername
        this.layer = Property.loadValue([data.layer, data[8]], 0);
      }
    }
  }


  /**
   * get rgb colour
   * @return {number} rgb colour object
   */
  getColour() {
    return this.entityColour.getColour(); ;
  }

  /**
   * get rgb colour to draw
   * @return {number} rgb colour object
   */
  getDrawColour() {
    let rgb = this.getColour();

    if (this.entityColour.byLayer) {
      const layer = DesignCore.LayerManager.getItemByName(this.layer);
      rgb = layer.colour;
    }

    return rgb;
  }

  /**
   * Set the entity colour
   * @param {Object} rgb
   */
  setColour(rgb) {
    this.entityColour.setColour(rgb);
  }

  /**
   * Get the line type
   * @return {LType}
   */
  getLineType() {
    let lineTypeName = this.lineType;

    if (lineTypeName === 'BYLAYER') {
      const layer = DesignCore.LayerManager.getItemByName(this.layer);
      lineTypeName = layer.lineType;
    }

    const lineType = DesignCore.LTypeManager.getItemByName(lineTypeName);

    return lineType;
  }

  /**
   * Write the colour to file in the dxf format
   * @param {DXFFile} file
   */
  writeDxfColour(file) {
    if (this.entityColour.aci != 256) {
      file.writeGroupCode('62', this.entityColour.aci);
    }
    if (this.entityColour.isTrueColour) {
      file.writeGroupCode('420', Colours.rgbToTrueColour(this.colour));
    }
  }

  /**
   * Determine if the entity is within the selection
   * @param {Array} selectionExtremes
   * @return {boolean} true if within
   */
  within(selectionExtremes) {
    const layer = DesignCore.LayerManager.getItemByName(this.layer);

    if (!layer.isSelectable) {
      return;
    }

    // Determine if this entities is within a the window specified by selectionExtremes
    const boundingBox = this.boundingBox();
    if ( boundingBox.xMin > selectionExtremes[0] &&
          boundingBox.xMax < selectionExtremes[1] &&
          boundingBox.yMin > selectionExtremes[2] &&
          boundingBox.yMax < selectionExtremes[3]
    ) {
      return true;
    }

    return false;
  }

  /**
   * Determine if the entity is touch the selection window
   * @param {Array} selectionExtremes
   * @return {boolean} true if touched
   */
  touched(selectionExtremes) {
    const layer = DesignCore.LayerManager.getItemByName(this.layer);

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
      DesignCore.Core.notify(msg);
      throw Error(msg);
    }

    const output = Intersection[intersectFunction](this.intersectPoints(), rectPoints);

    if (output.status === 'Intersection') {
      return true;
    }
    // no intersection found. return false
    return false;
  }

  /**
   * Extend the entity
   * @param {Array} points
   */
  extend(points) {
    // extend function to be overidden by implementation
  }

  /**
   * Trim the entity
   * @param {Array} points
   */
  trim(points) {
    // trim function to be overidden by implementation
  }
}
