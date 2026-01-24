import { Point } from './point.js';
import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { Flags } from '../properties/flags.js';
import { Property } from '../properties/property.js';

import { DesignCore } from '../designCore.js';

/**
 * Text Entity Class
 * @extends Entity
 */
export class Text extends Entity {
  /**
   * Create a Text Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);
    this.string = '';
    this.height = 2.5;
    this.horizontalAlignment = 0;
    this.verticalAlignment = 0;
    this.styleName = 'STANDARD';


    // hide inherited properties
    // needs to be enumerable=false to not appear in the object props
    Object.defineProperty(this, 'lineType', {
      enumerable: false,
    });

    Object.defineProperty(this, 'lineWidth', {
      enumerable: false,
    });

    // add rotation property with getter and setter
    // needs to be enumerable to appear in the object props
    Object.defineProperty(this, 'rotation', {
      get: this.getRotation,
      set: this.setRotation,
      enumerable: true,
    });

    // needs to be non-enumerable as to not appear in the object props
    Object.defineProperty(this, 'boundingRect', {
      value: { width: 10, height: 10 },
      writable: true,
    });

    // needs to be non-enumerable as to not appear in the object props
    Object.defineProperty(this, 'flags', {
      value: new Flags(),
      writable: true,
    });

    // add backwards property with getter and setter
    // needs to be enumerable to appear in the object props
    Object.defineProperty(this, 'backwards', {
      get: this.getBackwards,
      set: this.setBackwards,
      enumerable: true,
    });


    // add upsidedown property with getter and setter
    // needs to be enumerable to appear in the object props
    Object.defineProperty(this, 'upsideDown', {
      get: this.getUpsideDown,
      set: this.setUpsideDown,
      enumerable: true,
    });

    if (data) {
      if (data.hasOwnProperty('string') || data.hasOwnProperty('1')) {
        // DXF Groupcode 1 - Default Value
        // The string of the text entity

        const string = (Property.loadValue([data.string, data[1]], ''));
        if (string !== undefined) {
          this.string = String(string);
        }
      }

      if (data.hasOwnProperty('styleName') || data.hasOwnProperty('7')) {
        // DXF Groupcode 7 - Text Style Name
        this.styleName = data.styleName || data[7];
      }

      if (data.hasOwnProperty('height') || data.hasOwnProperty('40')) {
        // DXF Groupcode 40 - Text Height
        this.height = Property.loadValue([data.height, data[40]], 2.5);
      }

      if (data.hasOwnProperty('rotation') || data.hasOwnProperty('50')) {
        // DXF Groupcode 50 - Text Rotation, angle in degrees
        // if we get rotation data store this as a point[1] at an angle from point[0]
        // this allows all the entities to be rotated by rotating the points i.e. not all entities have a rotation property
        this.setRotation(Property.loadValue([data.rotation, data[50]], 0));
      } else {
        // create points[1] used to determine the text rotation
        if (this.points.length && this.height !== undefined) {
          this.points[1] = data.points[0].add(new Point(this.height, 0));
        }
      }

      if (data.hasOwnProperty('horizontalAlignment') || data.hasOwnProperty('72')) {
        // DXF Groupcode 72 - Horizontal Alignment
        // 0 = Left; 1= Center; 2 = Right
        // 3 = Aligned (if vertical alignment = 0)
        // 4 = Middle (if vertical alignment = 0)
        // 5 = Fit (if vertical alignment = 0)

        this.horizontalAlignment = Property.loadValue([data.horizontalAlignment, data[72]], 0);
      }

      if (data.hasOwnProperty('verticalAlignment') || data.hasOwnProperty('73')) {
        // DXF Groupcode 73 - Vertical Alignment
        // 0 = Baseline; 1 = Bottom; 2 = Middle; 3 = Top

        this.verticalAlignment = Property.loadValue([data.verticalAlignment, data[73]], 0);
      }

      if (data.hasOwnProperty('flags') || data.hasOwnProperty('71')) {
        // DXF Groupcode 71 - flags (bit-coded values):
        // 2 = Text is backward (mirrored in X).
        // 4 = Text is upside down (mirrored in Y).

        this.flags.setFlagValue(Property.loadValue([data.flags, data[71]], 0));
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
    const command = { command: 'Text', shortcut: 'DT', type: 'Entity' };
    return command;
  }

  /**
   * Get the approximate width of the text
   * @param {string} string - text string
   * @param {number} textHeight - text height
   * @return {number} - approximate width of the text
   * This is a rough estimate based on the string length and height
   * Actual width depends on the font and style used
   */
  static getApproximateWidth(string, textHeight) {
    // Approximate width of the text based on the string length and height
    // This is a rough estimate, as actual width depends on the font and style
    return string.length * textHeight * 0.6; // 0.6 is an approximation factor for average character width
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      this.points.push(pt1);

      // set the text style to the current style
      const currentStyle = DesignCore.StyleManager.getCstyle();
      this.styleName = currentStyle;

      // get properties from style
      const style = DesignCore.StyleManager.getItemByName(this.styleName);
      if (style.textHeight) {
        this.height = style.textHeight;
      }

      this.backwards = style.backwards;
      this.upsideDown = style.upsideDown;

      // Get the font size when standard style is used
      if (this.styleName.toUpperCase() === 'STANDARD') {
        const op2 = new PromptOptions(`${Strings.Input.HEIGHT} <${this.height}>`, [Input.Type.NUMBER]);
        const height = await DesignCore.Scene.inputManager.requestInput(op2);
        this.height = height;
      }

      const op3 = new PromptOptions(`${Strings.Input.ROTATION} <0>`, [Input.Type.NUMBER]);
      const rotation = await DesignCore.Scene.inputManager.requestInput(op3);
      this.setRotation(rotation);

      const op4 = new PromptOptions(Strings.Input.STRING, [Input.Type.STRING, Input.Type.NUMBER]);
      const string = await DesignCore.Scene.inputManager.requestInput(op4);
      this.string = String(string);

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (this.points.length >= 1) {
      if (DesignCore.Scene.inputManager.promptOption.types.includes(Input.Type.STRING)) {
        const data = {
          points: this.points,
          height: this.height,
          rotation: this.rotation,
          string: DesignCore.CommandLine.command,
        };

        DesignCore.Scene.tempEntities.create(this.type, data);
      } else {
        const mousePoint = DesignCore.Mouse.pointOnScene();
        const points = [this.points.at(-1), mousePoint];
        DesignCore.Scene.tempEntities.create('Line', { points: points });
      }
    }
  }

  /**
   * Set the text rotation
   * @param {number} angle - degrees
   */
  setRotation(angle) {
    // This overwrites the rotation rather than add to it.

    if (angle === undefined) {
      return;
    }

    if (this.height > 0) {
      this.points[1] = this.points[0].project(Utils.degrees2radians(angle), this.height);
    }
  }

  /**
   * Get the text rotation
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
   * Get the backwards value
   * @return {boolean} true if the text is flipped horizontally
   */
  getBackwards() {
    // Backwards value is bitmasked in flags as value 2
    return this.flags.hasFlag(2);
  }

  /**
   * Set the backwards value
   * @param {boolean} bool
   */
  setBackwards(bool) {
    if (bool) {
      // Add flag
      this.flags.addValue(2);
    } else {
      // remove flag
      this.flags.removeValue(2);
    }
  }

  /**
   * Get the upside down value
   * @return {boolean} true if the text is flipped vertically
   */
  getUpsideDown() {
    // Upside down value is bitmasked in flags as value 4
    return this.flags.hasFlag(4);
  }

  /**
   * Set the upside down value
   * @param {boolean} bool
   */
  setUpsideDown(bool) {
    if (bool) {
      // Add flag
      this.flags.addValue(4);
    } else {
      // remove flag
      this.flags.removeValue(4);
    }
  }

  /**
   * Get a string describing the horizontal text alignment
   * @return {string}
   */
  getHorizontalAlignment() {
    /* DXF Data
        0 = Left; 1= Center; 2 = Right
        3 = Aligned (if vertical alignment = 0)
        4 = Middle (if vertical alignment = 0)
        5 = Fit (if vertical alignment = 0)
        */

    switch (this.horizontalAlignment) {
      case 0:
        return 'left';
      case 1:
        return 'center';
      case 2:
        return 'right';
      case 3:
        return (this.verticalAlignment === 0 ? 'aligned' : 'left'); // (if vertical alignment = 0)
      case 4:
        return (this.verticalAlignment === 0 ? 'center' : 'left'); // (if vertical alignment = 0)
      case 5:
        return (this.verticalAlignment === 0 ? 'fit' : 'left'); // (if vertical alignment = 0)
      default:
        return 'left';
    }
  }

  /**
   * Get a string describing the vertical text alignment
   * @return {string}
   */
  getVerticalAlignment() {
    /* DXF Data
        Vertical text justification type (optional, default = 0): integer codes (not bit- coded):
        0 = Baseline; 1 = Bottom; 2 = Middle; 3 = Top
        See the Group 72 and 73 integer codes table for clarification.
        */

    switch (this.verticalAlignment) {
      case 0:
        return 'alphabetic';
      case 1:
        return 'bottom';
      case 2:
        return 'middle';
      case 3:
        return 'top';
      default:
        return 'alphabetic';
    }
  }

  /**
   * Get the texts bounding rectangle
   * @return {Object}
   */
  getBoundingRect() {
    const rect = { width: Number(this.boundingRect.width), height: Number(this.boundingRect.height), x: this.points[0].x, y: this.points[0].y };
    return rect;
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    ctx.save(); // save current context before scale and translate
    ctx.scale(1, -1);
    ctx.translate(this.points[0].x, -this.points[0].y);

    const style = DesignCore.StyleManager.getItemByName(this.styleName);
    // style.textHeight

    if (this.upsideDown) {
      ctx.scale(1, -1);
    }

    if (this.backwards) {
      ctx.scale(-1, 1);
    }

    const rotation = Utils.degrees2radians(this.rotation);

    if (this.backwards || this.upsideDown) {
      ctx.rotate(rotation);
    } else {
      ctx.rotate(-rotation);
    }

    try { // HTML
      ctx.textAlign = this.getHorizontalAlignment();
      ctx.textBaseline = this.getVerticalAlignment();
      ctx.font = this.height + 'pt Arial'; // TODO: use style.font
      ctx.fillText(this.string, 0, 0);
      this.boundingRect = ctx.measureText(String(this.string));
      // TODO: find a better way to define the boundingRect
      this.boundingRect.height = this.height;
    } catch { // Cairo
      ctx.setFontSize(this.height);
      ctx.selectFontFace(style.font, null, null); // (FontName, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL);
      this.boundingRect = ctx.textExtents(String(this.string));

      let x = 0;
      let y = 0;
      switch (this.horizontalAlignment) {
        case 0: // 0 = Left;
          x = -this.boundingRect.xBearing;
          break;
        case 1: // 1= Center;
          x = -this.boundingRect.xBearing - this.boundingRect.width / 2;
          break;
        case 2: // 2 = Right
          x = -this.boundingRect.xBearing - this.boundingRect.width;
          break;
      }

      switch (this.verticalAlignment) {
        case 0: // 0 = Baseline;
          y = 0;
          break;
        case 1: // 1 = Bottom;
          y = -this.boundingRect.yBearing - this.boundingRect.height;
          break;
        case 2: // 2 = Middle
          y = -this.boundingRect.yBearing - this.boundingRect.height / 2;
          break;
        case 3: // 3 = Top
          y = -this.boundingRect.yBearing;
          break;
      }


      ctx.moveTo(x, y);
      ctx.showText(String(this.string));
    }
    ctx.stroke();
    ctx.restore(); // restore context before scale and translate


    // debug draw the arcText bounding box
    const bb = this.boundingBox();
    ctx.moveTo(bb.xMin, bb.yMin);
    ctx.lineTo(bb.xMax, bb.yMin);
    ctx.lineTo(bb.xMax, bb.yMax);
    ctx.lineTo(bb.xMin, bb.yMax);
    ctx.lineTo(bb.xMin, bb.yMin);
    ctx.stroke();
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'TEXT');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbText', DXFFile.Version.R2000);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('40', this.height);
    file.writeGroupCode('1', this.string);
    file.writeGroupCode('50', this.rotation);
    // file.writeGroupCode('7', 'STANDARD'); // TEXT STYLE
    file.writeGroupCode('71', this.flags.getFlagValue()); // Text generation flags
    file.writeGroupCode('72', this.horizontalAlignment); // Horizontal alignment
    file.writeGroupCode('100', 'AcDbText', DXFFile.Version.R2000);
    file.writeGroupCode('73', this.verticalAlignment); // Vertical alignment
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const rect = this.getBoundingRect();

    const botLeft = new Point(rect.x, rect.y);
    const botRight = new Point(rect.x + rect.width, rect.y);
    const topLeft = new Point(rect.x, rect.y + rect.height);
    const topRight = new Point(rect.x + rect.width, rect.y + rect.height);
    const mid = new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);

    const snaps = [botLeft, botRight, topLeft, topRight, mid];

    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    // TODO: Support rotation
    const rect = this.getBoundingRect();
    const botLeft = new Point(rect.x, rect.y);
    const topRight = new Point(rect.x + rect.width, rect.y + rect.height);
    const mid = new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);

    let distance = P.distance(mid);

    // if P is inside the bounding box return distance 0
    if (P.x > botLeft.x &&
      P.x < topRight.x &&
      P.y > botLeft.y &&
      P.y < topRight.y
    ) {
      distance = 0;
    }

    return [mid, distance];
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    const rect = this.getBoundingRect();

    const xmin = rect.x;
    const xmax = this.backwards ? rect.x - rect.width : rect.x + rect.width;
    const ymin = rect.y;
    const ymax = this.upsideDown ? rect.y - rect.height : rect.y + rect.height;

    const topLeft = new Point(xmin, ymax);
    const bottomRight = new Point(xmax, ymin);

    return new BoundingBox(topLeft, bottomRight);
  }

  /**
   * Intersect points
   * @return {Object} - object defining data required by intersect methods
   */
  intersectPoints() {
    const rect = this.getBoundingRect();

    const botLeft = new Point(rect.x, rect.y);
    const topRight = new Point(rect.x + rect.width, rect.y + rect.height);

    return {
      start: botLeft,
      end: topRight,
    };
  }
}
