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
import { SnapPoint } from '../lib/auxiliary/snapPoint.js';
import { RubberBand } from '../lib/auxiliary/rubberBand.js';

/**
 * Text Entity Class
 * @extends Entity
 */
export class Text extends Entity {
  static type = 'Text';

  static #charWidths = {
    ' ': 0.28, '!': 0.28, '"': 0.35, '#': 0.56, '$': 0.56, '%': 0.89, '&': 0.67, '\'': 0.19,
    '(': 0.33, ')': 0.33, '*': 0.39, '+': 0.58, ',': 0.28, '-': 0.33, '.': 0.28, '/': 0.31,
    '0': 0.56, '1': 0.56, '2': 0.56, '3': 0.56, '4': 0.56, '5': 0.56, '6': 0.56, '7': 0.56,
    '8': 0.56, '9': 0.56, ':': 0.28, ';': 0.28, '<': 0.58, '=': 0.58, '>': 0.58, '?': 0.56,
    '@': 1.02, 'A': 0.67, 'B': 0.67, 'C': 0.72, 'D': 0.72, 'E': 0.61, 'F': 0.56, 'G': 0.78,
    'H': 0.72, 'I': 0.28, 'J': 0.39, 'K': 0.67, 'L': 0.56, 'M': 0.83, 'N': 0.72, 'O': 0.78,
    'P': 0.61, 'Q': 0.78, 'R': 0.67, 'S': 0.56, 'T': 0.61, 'U': 0.72, 'V': 0.67, 'W': 0.94,
    'X': 0.67, 'Y': 0.67, 'Z': 0.61, '[': 0.28, '\\': 0.31, ']': 0.28, '^': 0.47, '_': 0.56,
    '`': 0.33, 'a': 0.56, 'b': 0.56, 'c': 0.50, 'd': 0.56, 'e': 0.56, 'f': 0.28, 'g': 0.56,
    'h': 0.56, 'i': 0.22, 'j': 0.22, 'k': 0.50, 'l': 0.22, 'm': 0.83, 'n': 0.56, 'o': 0.56,
    'p': 0.56, 'q': 0.56, 'r': 0.33, 's': 0.50, 't': 0.33, 'u': 0.56, 'v': 0.50, 'w': 0.72,
    'x': 0.50, 'y': 0.50, 'z': 0.44, '{': 0.33, '|': 0.26, '}': 0.33, '~': 0.58,
  };

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
      // DXF Groupcode 11,21,31 - Second alignment point (optional, used for aligned, middle, or fit text)
      if (data?.points?.length > 1) {
        if (data.points[1].sequence == 11) {
          this.points = [];
          this.points.push(new Point(data.points[1].x, data.points[1].y));
        }
      }
    }

    // DXF Groupcode 1 - Text String
    this.string = Property.loadValue([data?.string, data?.[1]], '');
    // DXF Groupcode 7 - Text Style Name
    this.styleName = Property.loadValue([data?.styleName, data?.[7]], 'STANDARD');
    // DXF Groupcode 40 - Text Height
    this.height = Property.loadValue([data?.height, data?.[40]], 2.5);

    if (data) {
      if (data.hasOwnProperty('rotation') || data.hasOwnProperty('50')) {
        // DXF Groupcode 50 - Text Rotation, angle in degrees
        // if we get rotation data store this as a point[1] at an angle from point[0]
        // this allows all the entities to be rotated by rotating the points i.e. not all entities have a rotation property
        this.setRotation(Property.loadValue([data.rotation, data[50]], 0));
      } else {
        // create points[1] used to determine the text rotation
        if (this.points.length && this.height !== undefined) {
          this.points[1] = this.points[0].add(new Point(this.height, 0));
        }
      }
    }

    // DXF Groupcode 72 - Horizontal Alignment
    // 0 = Left
    // 1 = Center
    // 2 = Right
    // 3 = Aligned (if vertical alignment = 0) not supported, treated as center aligned
    // 4 = Middle (if vertical alignment = 0) not supported, treated as center aligned
    // 5 = Fit (if vertical alignment = 0) not supported, treated as center aligned
    this.horizontalAlignment = Property.loadValue([data?.horizontalAlignment, data?.[72]], 0);

    if (this.horizontalAlignment > 2) {
      this.horizontalAlignment = 1; // unsupported alignment types treated as center aligned
    }

    // DXF Groupcode 73 - Vertical Alignment
    // 0 = Baseline; 1 = Bottom; 2 = Middle; 3 = Top
    this.verticalAlignment = Property.loadValue([data?.verticalAlignment, data?.[73]], 0);

    // DXF Groupcode 71 - flags (bit-coded values):
    // 2 = Text is backward (mirrored in X).
    // 4 = Text is upside down (mirrored in Y).
    this.flags.setFlagValue(Property.loadValue([data?.flags, data?.[71]], 0));
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
    let width = 0;
    for (const ch of string) {
      width += (Text.#charWidths[ch] ?? 0.56) * textHeight;
    }
    return width;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      // set the text style to the current style
      const currentStyle = DesignCore.StyleManager.getCstyle();
      this.styleName = currentStyle;

      // get properties from style
      const style = DesignCore.StyleManager.getItemByName(this.styleName);
      if (style?.textHeight) {
        this.height = style.textHeight;
      }

      this.backwards = style.backwards;
      this.upsideDown = style.upsideDown;

      // Get the font size when the style has a variable height (textHeight === 0)
      if (!style?.textHeight) {
        const op2 = new PromptOptions(Strings.Input.HEIGHT, [Input.Type.NUMBER], [], this.height);
        while (true) {
          const height = await DesignCore.Scene.inputManager.requestInput(op2);
          if (height === undefined) return;
          if (height <= 0) {
            DesignCore.Core.notify(`${this.type} - ${Strings.Error.NONZERO}`);
            continue;
          }
          this.height = height;
          break;
        }
      }

      const op3 = new PromptOptions(Strings.Input.ROTATION, [Input.Type.NUMBER], [], 0);
      const rotation = await DesignCore.Scene.inputManager.requestInput(op3);
      if (rotation === undefined) return;
      this.setRotation(rotation);

      const op4 = new PromptOptions(Strings.Input.STRING, [Input.Type.STRING, Input.Type.NUMBER]);
      const string = await DesignCore.Scene.inputManager.requestInput(op4);
      if (string === undefined) return;
      if (String(string).trim().length === 0) {
        DesignCore.Scene.inputManager.reset();
        return;
      }
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
          styleName: this.styleName,
          string: DesignCore.CommandLine.command,
        };

        DesignCore.Scene.previewEntities.create(this.type, data);
      } else {
        const mousePoint = DesignCore.Mouse.pointOnScene();
        const points = [this.points.at(-1), mousePoint];
        DesignCore.Scene.auxiliaryEntities.add(new RubberBand(points));
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
   * Return a character descriptor array for use with renderer.drawText().
   * Coordinates are in scene space (Y-up). The renderer handles the Y-flip.
   * upsideDownOffset and backwardsOffset are optional DXF-flag offsets in
   * the local (post-rotation) text frame.
   * @return {Array}
   */
  toCharacters() {
    if (this.string.length === 0) return [];
    const [bottomLeft, bottomRight, /* topRight */, topLeft] = this.getTextFrameCorners();
    return [{
      x: bottomLeft.x,
      y: bottomLeft.y,
      rotation: Utils.degrees2radians(this.rotation),
      char: this.string,
      upsideDownOffset: this.upsideDown ? bottomLeft.distance(topLeft) : 0,
      backwardsOffset: this.backwards ? bottomLeft.distance(bottomRight) : 0,
    }];
  }

  /**
   * Draw the text entity
   * @param {Object} renderer
   */
  draw(renderer) {
    if (this.string.length === 0) return;
    const style = DesignCore.StyleManager.getItemByName(this.styleName);
    // Measure with the correct font before toCharacters() so that boundingRect
    // (used for alignment offsets) is accurate on every paint pass.
    const measured = renderer.measureText(this.string, style?.font, this.height);
    if (measured?.width) {
      this.boundingRect = { width: measured.width, height: this.height };
    }
    renderer.drawText(this.toCharacters(), style?.font, this.height);

    /*
    // debug draw the bounding box
    const bb = this.boundingBox();
    renderer.drawShape([
      new Point(bb.xMin, bb.yMin),
      new Point(bb.xMax, bb.yMin),
      new Point(bb.xMax, bb.yMax),
      new Point(bb.xMin, bb.yMax),
      new Point(bb.xMin, bb.yMin),
    ]);

    // debug draw the text frame
    const [fc0, fc1, fc2, fc3] = this.getTextFrameCorners();
    renderer.drawShape([fc0, fc1, fc2, fc3, fc0]);
    */
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'TEXT');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbText', DXFFile.Version.R2000);

    const frameCorners = this.getTextFrameCorners();
    const bottomLeft = frameCorners[0];

    file.writeGroupCode('10', bottomLeft.x);
    file.writeGroupCode('20', bottomLeft.y);
    file.writeGroupCode('30', '0.0');

    file.writeGroupCode('40', this.height);
    file.writeGroupCode('1', this.string);
    file.writeGroupCode('50', this.rotation);
    // file.writeGroupCode('7', 'STANDARD'); // TEXT STYLE
    file.writeGroupCode('71', this.flags.getFlagValue()); // Text generation flags
    file.writeGroupCode('72', this.horizontalAlignment); // Horizontal alignment

    if (this.horizontalAlignment > 0 || this.verticalAlignment > 0) {
      file.writeGroupCode('11', this.points[0].x);
      file.writeGroupCode('21', this.points[0].y);
      file.writeGroupCode('31', '0.0');
    }

    file.writeGroupCode('100', 'AcDbText', DXFFile.Version.R2000);
    if (this.verticalAlignment !== 0) {
      file.writeGroupCode('73', this.verticalAlignment); // Vertical alignment
    }
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

    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    const frameCorners = this.getTextFrameCorners();
    const A = frameCorners[0];
    const B = frameCorners[1];
    const C = frameCorners[2];
    const D = frameCorners[3];

    const mid = A.midPoint(C);
    let distance = P.distance(mid);

    if (P.isInRectangle(A, B, C, D)) {
      distance = 0;
    }

    return [mid, distance];
  }

  /**
   * Get the corner points of a frame around the text (Tight bounding box)
   * @return {Array} - array of 4 Points defining the text frame corners. Ordered: [bottomLeft, bottomRight, topRight, topLeft]
   */
  getTextFrameCorners() {
    const rect = this.getBoundingRect();

    let offsetX = 0;
    switch (this.horizontalAlignment) {
      case 0: // left
        offsetX = 0;
        break;
      case 1: // center
        offsetX = -rect.width / 2;
        break;
      case 2: // right
        offsetX = -rect.width;
        break;
      case 3: // aligned - not supported
      case 4: // middle - not supported
      case 5: // fit - not supported
      default:
        offsetX = 0;
    }

    let offsetY = 0;
    switch (this.verticalAlignment) {
      case 0: // baseline
        offsetY = 0; // see comments in draw method
        break;
      case 1: // bottom
        offsetY = 0;
        break;
      case 2: // middle
        offsetY = -rect.height / 2;
        break;
      case 3: // top
        offsetY = -rect.height;
        break;
      default:
        offsetY = 0;
    }

    // apply offsets to insertion point
    const x0 = rect.x + offsetX;
    const y0 = rect.y + offsetY;

    // compute min/max depending on backwards/upsideDown (text direction)
    const xmin = Math.min(x0, this.backwards ? x0 - rect.width : x0 + rect.width);
    const xmax = Math.max(x0, this.backwards ? x0 - rect.width : x0 + rect.width);
    const ymin = Math.min(y0, this.upsideDown ? y0 - rect.height : y0 + rect.height);
    const ymax = Math.max(y0, this.upsideDown ? y0 - rect.height : y0 + rect.height);

    let bottomLeft = new Point(xmin, ymin);
    let bottomRight = new Point(xmax, ymin);
    let topLeft = new Point(xmin, ymax);
    let topRight = new Point(xmax, ymax);

    if (this.rotation !== 0) {
      const angle = Utils.degrees2radians(this.rotation);
      bottomLeft = bottomLeft.rotate(this.points[0], angle);
      bottomRight = bottomRight.rotate(this.points[0], angle);
      topLeft = topLeft.rotate(this.points[0], angle);
      topRight = topRight.rotate(this.points[0], angle);
    }

    return [bottomLeft, bottomRight, topRight, topLeft];
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    const bb = BoundingBox.fromPoints(this.getTextFrameCorners());
    return bb;
  }

  /**
   * Return a list of points representing a polyline version of this entity
   * @return {Array}
   */
  toPolylinePoints() {
    const corners = this.getTextFrameCorners();
    // Close the rectangle
    corners.push(corners[0].clone());
    return corners;
  }
}
