import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';

export class Text extends Entity {
  constructor(data) {
    super(data);
    this.string = '';
    this.height = 2.5;
    this.horizontalAlignment = 0;
    this.verticalAlignment = 0;
    this.backwards = false;
    this.upsideDown = false;
    this.styleName = 'STANDARD';

    // add rotation property with getter and setter
    // needs to be enumberable to appear in the object props
    Object.defineProperty(this, 'rotation', {
      get: this.getRotation,
      set: this.setRotation,
      enumerable: true,
    });

    // needs to be non-enumberable as to not appear in the object props
    Object.defineProperty(this, 'boundingRect', {
      enumerable: false,
      value: {width: 10, height: 10},
      writable: true,
    });

    if (data) {
      if (data.string || data[1]) {
        // DXF Groupcode 1 - Default Value
        // The string of the text entity
        this.string = String(data.string || data[1]);
      }

      if (data.styleName || data[7]) {
        // DXF Groupcode 7 - Text Style Name
        this.styleName = data.styleName || data[7];
      }

      if (data.height || data[40]) {
        // DXF Groupcode 40 - Text Height
        this.height = data.height || data[40];
      }

      if (data.rotation || data[50]) {
        // DXF Groupcode 50 - Text Rotation, angle in degrees
        // if we get rotation data store this as a point[1] at an angle from point[0]
        // this allows all the entities to be rotated by rotating the points i.e. not all entities have a rotation property

        const rotation = data.rotation || data[50];
        this.setRotation(rotation);
      } else {
        // create points[1] used to determine the text rotation
        this.points[1] = data.points[0].add(new Point(this.height, 0));
      }

      if (data.horizontalAlignment || data[72]) {
        // DXF Groupcode 72 - Horizontal Alignment
        // 0 = Left; 1= Center; 2 = Right
        // 3 = Aligned (if vertical alignment = 0)
        // 4 = Middle (if vertical alignment = 0)
        // 5 = Fit (if vertical alignment = 0)
        this.horizontalAlignment = data.horizontalAlignment || data[72];
      }

      if (data.verticalAlignment || data[73]) {
        // DXF Groupcode 73 - Vertical Alignment
        // 0 = Baseline; 1 = Bottom; 2 = Middle; 3 = Top
        this.verticalAlignment = data.verticalAlignment || data[73];
      }

      if (data.flags || data[71]) {
        // DXF Groupcode 71 - Text Flags
        // 2 = Text is backward (mirrored in X).
        // 4 = Text is upside down (mirrored in Y).
        const flags = data.flags || data[71];
        switch (flags) {
          case 2:
            this.backwards = true;
            break;
          case 4:
            this.upsideDown = true;
            break;
          case 6:
            this.upsideDown = true;
            this.backwards = true;
            break;
        }
      }
    }
  }

  static register() {
    const command = {command: 'Text', shortcut: 'DT', type: 'Entity'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op);
      this.points.push(pt1);

      const op2 = new PromptOptions(`${Strings.Input.HEIGHT} <${this.height}>`, [Input.Type.NUMBER]);
      const height = await core.scene.inputManager.requestInput(op2);
      this.height = height;

      const op3 = new PromptOptions(`${Strings.Input.ROTATION} <0>`, [Input.Type.NUMBER]);
      const rotation = await core.scene.inputManager.requestInput(op3);
      this.setRotation(rotation);

      const op4 = new PromptOptions(Strings.Input.STRING, [Input.Type.STRING, Input.Type.NUMBER]);
      const string = await core.scene.inputManager.requestInput(op4);
      this.string = String(string);

      core.scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview(core) {
    if (this.points.length >= 1) {
      if (core.scene.inputManager.promptOption.types.includes(Input.Type.STRING)) {
        const data = {
          points: this.points,
          height: this.height,
          rotation: this.rotation,
          string: core.commandLine.command,
        };

        core.scene.createTempItem(this.type, data);
      } else {
        const mousePoint = core.mouse.pointOnScene();
        const points = [this.points.at(-1), mousePoint];
        core.scene.createTempItem('Line', {points: points});
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

    if (this.height > 0 && angle !== 0) {
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

  getBoundingRect() {
    const rect = {width: Number(this.boundingRect.width), height: Number(this.boundingRect.height), x: this.points[0].x, y: this.points[0].y};
    return rect;
  }

  draw(ctx, scale, core, colour) {
    ctx.save();
    ctx.scale(1, -1);
    ctx.translate(this.points[0].x, -this.points[0].y);

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
      ctx.fillStyle = colour;
      ctx.textAlign = this.getHorizontalAlignment();
      ctx.textBaseline = this.getVerticalAlignment();
      ctx.font = this.height + 'pt ' + core.styleManager.getStyleByName(this.styleName).font.toString();
      ctx.fillText(this.string, 0, 0);
      this.boundingRect = ctx.measureText(String(this.string));
      // TODO: find a better way to define the boundingRect
      this.boundingRect.height = this.height;
    } catch { // Cairo
      const rgbColour = Colours.hexToScaledRGB(colour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      ctx.moveTo(0, 0);
      ctx.setFontSize(this.height);
      ctx.showText(String(this.string));
      this.boundingRect = ctx.textExtents(String(this.string));
    }
    ctx.stroke();
    ctx.restore();

    // Draw Bounding Box to test the getBoundingRect()
    /*
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1 / scale;
        ctx.beginPath()
        ctx.moveTo(rect.x, rect.y);
        ctx.lineTo(rect.x + rect.width, rect.y);
        ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
        ctx.lineTo(rect.x, rect.y + rect.height);
        ctx.lineTo(rect.x, rect.y);
        ctx.stroke()
        */
  }

  dxf(file) {
    file.writeGroupCode('0', 'TEXT');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbText', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('1', this.string);
    file.writeGroupCode('40', this.height);
    file.writeGroupCode('50', this.rotation);
    file.writeGroupCode('100', 'AcDbText', DXFFile.Version.R2000);
    // file.writeGroupCode('7', 'STANDARD'); // TEXT STYLE
    // file.writeGroupCode('72', this.getHorizontalAlignment()); //HORIZONTAL ALIGNMENT
    // file.writeGroupCode('73', this.getVerticalAlignment()); //VERTICAL ALIGNMENT
  }

  snaps(mousePoint, delta, core) {
    const rect = this.getBoundingRect();

    const botLeft = new Point(rect.x, rect.y);
    const botRight = new Point(rect.x + rect.width, rect.y);
    const topLeft = new Point(rect.x, rect.y + rect.height);
    const topRight = new Point(rect.x + rect.width, rect.y + rect.height);
    const mid = new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);

    const snaps = [botLeft, botRight, topLeft, topRight, mid];

    return snaps;
  }

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

  boundingBox() {
    const rect = this.getBoundingRect();
    const xmin = rect.x;
    const xmax = rect.x + rect.width;
    const ymin = rect.y;
    const ymax = rect.y + rect.height;
    return [xmin, xmax, ymin, ymax];
  }

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
