import { Entity } from './entity.js';
import { Strings } from '../lib/strings.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Block } from '../tables/block.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { Point } from './point.js';
import { Utils } from '../lib/utils.js';
import { Logging } from '../lib/logging.js';
import { Property } from '../properties/property.js';

import { DesignCore } from '../designCore.js';
import { SnapPoint } from '../lib/auxiliary/snapPoint.js';


/**
 * Insert Entity Class
 * @extends Entity
 */
export class Insert extends Entity {
  static type = 'Insert';

  /**
   * Create an Insert
   * Inserts are used to define the location of blocks
   * @param {Array} data
   */
  constructor(data) {
    super(data);


    // add block property
    Object.defineProperty(this, 'block', {
      value: new Block(),
      writable: true,
    });

    this.properties.add(Property.Names.ROTATION, {
      type: Property.Type.NUMBER,
      dxfCode: 50,
      get: (entity) => entity.getRotation(),
      set: (entity, value) => entity.setRotation(value),
    });

    this.properties.add(Property.Names.BLOCKNAME, {
      type: Property.Type.LABEL,
      readOnly: true,
      get: (entity) => entity.block?.name ?? '',
    });

    if (data) {
      // DXF Groupcode 2 - Block name
      if (data.blockName !== undefined) {
        const block = DesignCore.Scene.blockManager.getItemByName(data.blockName);
        this.block = block;
      }

      // Named scalar rotation (internal API); DXF code 50 is handled by fromDxf
      if (data.rotation !== undefined) {
        this.setRotation(data.rotation);
      } else {
        // create points[1] used to determine the rotation
        if (this.points[0] === undefined) {
          this.points.push(new Point());
        }

        this.points[1] = this.points[0].add(new Point(10, 0));
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
    const command = { command: 'Insert' };
    return command;
  }

  /**
   * Normalise raw DXF data before construction
   * @param {Object} data - raw DXF group code object
   * @return {Object} normalised data with blockName and rotation encoded as points[1]
   *
   * Handles:
   * - Group code 2: block name
   * - Group code 50: rotation angle (degrees) encoded into points[1]
   * - Group codes 41–45, 70, 71: unimplemented — logged as warnings
   */
  static fromDxf(data) {
    const normalised = { ...data };

    // DXF group code 2 - Block name
    if (data[2] !== undefined) {
      normalised.blockName = data[2];
    }

    // DXF group code 50 - rotation angle in degrees; encode into points
    if (data[50] !== undefined) {
      normalised.rotation = data[50];
    }

    // Unimplemented group codes
    const unimplemented = { 41: 'X Scale Factor', 42: 'Y Scale Factor', 43: 'Z Scale Factor', 44: 'Column Spacing', 45: 'Row Spacing', 70: 'Column Count', 71: 'Row Count' };
    for (const [code, label] of Object.entries(unimplemented)) {
      if (data[code] !== undefined) {
        Logging.instance.warn(`Insert - Groupcode ${code} (${label}) not implemented`);
      }
    }

    return normalised;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    DesignCore.Core.notify(`${this.type} - ${Strings.Message.NOTIMPLEMENTED}`);
    DesignCore.Scene.inputManager.reset();
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    // not implemented
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'INSERT');
    file.writeGroupCode('5', this.getProperty(Property.Names.HANDLE), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.getProperty(Property.Names.LAYER));
    this.writeDxfColour(file);
    file.writeGroupCode('100', 'AcDbBlockReference', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.block.name);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    if (this.getProperty(Property.Names.ROTATION)) {
      file.writeGroupCode('50', this.getProperty(Property.Names.ROTATION));
    }
  }

  /**
   * Draw the entity
   * @param {Object} renderer
   * @return {Array} block items for the canvas to render recursively
   */
  draw(renderer) {
    // blocks are associated with an insert point.
    // Apply the insert location and rotation so block items draw correctly.
    renderer.applyTransform({ x: this.points[0].x, y: this.points[0].y, rotation: Utils.degrees2radians(this.getRotation()) });
    return this.block.items;
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

    this.points[1] = this.points[0].project(Utils.degrees2radians(angle), 10);
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

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];

    snaps.push(new SnapPoint(this.points[0], SnapPoint.Type.NODE));

    const blockSnaps = this.block.snaps(mousePoint, delta);

    for (let snap = 0; snap < blockSnaps.length; snap++) {
      const sp = blockSnaps[snap];
      // offset the item snap point by the block insert location
      const rotatedPoint = sp.snapPoint.add(this.points[0]);
      // rotate the snap point to match the item positions
      const adjustedPoint = rotatedPoint.rotate(this.points[0], Utils.degrees2radians(this.getRotation()));
      snaps.push(new SnapPoint(adjustedPoint, sp.type));
    }

    return snaps;
  }

  /**
   * Determine if the entity is within the selection
   * @param {Object} selection - {min: Point, max: Point}
   * @return {boolean} true if within
   */
  within(selection) {
    const pt = this.points[0];
    return this.block.within({
      min: selection.min.subtract(pt),
      max: selection.max.subtract(pt),
    });
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    // get the closest point from the blocks entities
    // rotate P to match the block rotation
    const rotatedPoint = P.rotate(this.points[0], Utils.degrees2radians(-this.getRotation()));
    // adjust P by the insert position
    const adjustedPoint = rotatedPoint.subtract(this.points[0]);
    return this.block.closestPoint(adjustedPoint);
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    const blockBB = this.block.boundingBox();
    const topLeft = blockBB.pt1.add(this.points[0]);
    const bottomRight = blockBB.pt2.add(this.points[0]);
    return new BoundingBox(topLeft, bottomRight);
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

    const pt = this.points[0];
    return this.block.touched({
      min: selection.min.subtract(pt),
      max: selection.max.subtract(pt),
    });
  }
}
