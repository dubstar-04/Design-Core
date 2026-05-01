import { Colours } from '../lib/colours.js';
import { EntityColour } from '../lib/colour.js';
import { Intersection } from '../lib/intersect.js';
import { Point } from './point.js';

import { Property } from '../properties/property.js';
import { EntityProperties } from '../properties/entityProperties.js';


import { DesignCore } from '../designCore.js';

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
      value: this.constructor.type ?? this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'points', {
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'colour', {
      get: this.getColour,
      set: this.setColour,
      enumerable: true,
    });

    Object.defineProperty(this, 'entityColour', {
      value: new EntityColour(),
      writable: true,
    });

    this.lineWidth = 1;
    this.lineType = 'ByLayer';
    this.layer = '0';

    // DXF Groupcode 5 - Handle
    Object.defineProperty(this, 'handle', {
      value: Property.loadValue([data?.handle, data?.[5]]),
      writable: true,
    });
    // DXF Groupcode 6 - lineType
    this.lineType = Property.loadValue([data?.lineType, data?.[6]], 'ByLayer');
    // DXF Groupcode 39 - Thickness (lineWidth)
    this.lineWidth = Property.loadValue([data?.lineWidth, data?.[39]], 1);
    // DXF Groupcode 8 - layername
    this.layer = Property.loadValue([data?.layer, data?.[8]], '0');

    if (data?.points) {
      this.points = data.points;
    }

    // DXF Groupcode 62 (normalised to colourACI by Entity.fromDxf) - ACI colour index
    // DXF Groupcode 420 (normalised to trueColour by Entity.fromDxf) - 24-bit true colour
    if (data?.colour && Colours.isRGB(data.colour)) {
      this.colour = data.colour;
    } else if (data?.colourACI !== undefined) {
      this.entityColour.setColourFromACI(data.colourACI);
    }

    if (data?.trueColour !== undefined) {
      const trueColour = Colours.trueColourToRGB(data.trueColour);
      if (trueColour) this.colour = trueColour;
    // Typed property store — non-enumerable so it doesn't appear in serialisation
    Object.defineProperty(this, 'properties', {
      value: new EntityProperties(),
      writable: true,
    });

    // DXF Groupcode 5 - Handle
    this.properties.add(Property.Names.HANDLE, {
      type: Property.Type.STRING,
      value: Property.loadValue([data?.handle, data?.[5]]),
      visible: false,
      dxfCode: 5,
    });
    // DXF Groupcode 8 - Layer name
    this.properties.add(Property.Names.LAYER, {
      type: Property.Type.LIST,
      value: Property.loadValue([data?.layer, data?.[8]], '0'),
      dxfCode: 8,
    });
    // DXF Groupcode 6 - Line type
    this.properties.add(Property.Names.LINETYPE, {
      type: Property.Type.LIST,
      value: Property.loadValue([data?.lineType, data?.[6]], 'ByLayer'),
      dxfCode: 6,
    });
    // DXF Groupcode 39 - Thickness (lineWidth)
    this.properties.add(Property.Names.LINEWIDTH, {
      type: Property.Type.NUMBER,
      value: Property.loadValue([data?.lineWidth, data?.[39]], 1),
      dxfCode: 39,
    });
    // DXF Groupcode 62/420 - colour (computed, backed by entityColour)
    this.properties.add(Property.Names.COLOUR, {
      type: Property.Type.COLOUR,
      _get: (entity) => entity.entityColour.getColour(),
      _set: (entity, value) => entity.entityColour.setColour(value),
      dxfCode: 62,
    });

    // Apply colour from data if RGB was passed directly
    if (data?.colour && Colours.isRGB(data.colour)) {
      this.entityColour.setColour(data.colour);
    }

    // points — computed, backed by the non-enumerable points array
    this.properties.add(Property.Names.POINTS, {
      visible: false,
      _get: (entity) => entity.points,
      _set: (entity, value) => {
        entity.points = value;
      },
    });
  }

  /**
   * Normalise entity-level DXF group codes before construction.
   * Subclasses override this for geometric transformation; they receive data
   * that has already passed through this method via CommandManager.
   * @param {Object} data - raw DXF group code object
   * @return {Object} normalised data
   *
   * Handles:
   * - Group code 62: ACI colour index → colourACI (absolute value)
   * - Group code 420: 24-bit true colour integer → trueColour
   */
  static fromDxf(data) {
    const normalised = { ...data };
    // DXF group code 62 - Color Number (ACI)
    if (data[62] !== undefined) {
      normalised.colourACI = Math.abs(data[62]);
    }
    // DXF group code 420 - True Color (24-bit integer)
    if (data[420] !== undefined) {
      normalised.trueColour = data[420];
    }
    return normalised;
  }

  /**
   * get rgb colour
   * @return {number} rgb colour object
   */
  getColour() {
    return this.entityColour.getColour();
  }

  /**
   * get rgb colour to draw
   * @return {number} rgb colour object
   */
  getDrawColour() {
    let rgb = this.getColour();

    if (this.entityColour.byLayer) {
      const layer = DesignCore.LayerManager.getItemByName(this.getProperty(Property.Names.LAYER));
      rgb = layer?.colour;
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
    let lineTypeName = this.getProperty(Property.Names.LINETYPE) ?? 'ByLayer';

    if (lineTypeName.toUpperCase() === 'BYLAYER') {
      const layer = DesignCore.LayerManager.getItemByName(this.getProperty(Property.Names.LAYER));
      lineTypeName = layer?.lineType;
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
      file.writeGroupCode('420', Colours.rgbToTrueColour(this.getColour()));
    }
  }

  /**
   * Determine if the entity is within the selection
   * @param {Object} selection - {min: Point, max: Point}
   * @return {boolean} true if within
   */
  within(selection) {
    const layer = DesignCore.LayerManager.getItemByName(this.layer);

    if (!layer?.isSelectable) {
      return;
    }

    const boundingBox = this.boundingBox();
    if (boundingBox.xMin > selection.min.x &&
      boundingBox.xMax < selection.max.x &&
      boundingBox.yMin > selection.min.y &&
      boundingBox.yMax < selection.max.y
    ) {
      return true;
    }

    return false;
  }

  /**
   * Determine if the entity is touch the selection window
   * @param {Object} selection - {min: Point, max: Point}
   * @return {boolean} true if touched
   */
  touched(selection) {
    const layer = DesignCore.LayerManager.getItemByName(this.getProperty(Property.Names.LAYER));

    if (!layer?.isSelectable) {
      return;
    }

    const rectPoints = [
      selection.min,
      new Point(selection.max.x, selection.min.y),
      selection.max,
      new Point(selection.min.x, selection.max.y),
      selection.min,
    ];

    const output = Intersection.intersectPolylinePolyline(this.toPolylinePoints(), rectPoints);

    if (output.status === Intersection.Status.INTERSECTION) {
      return true;
    }
    // no intersection found. return false
    return false;
  }

  /**
   * Set a property if it exists
   * @param {string} property
   * @param {any} value
   */
  setProperty(property, value) {
    if (this.hasOwnProperty(property)) {
      this[property] = value;
    }
  }
}
