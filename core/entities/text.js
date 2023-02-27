import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Intersection} from '../lib/intersect.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';

export class Text extends Entity {
  constructor(data) {
    super(data);
    this.minPoints = 1;
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
      // value: {width: 0, height: 0},
      writable: true,
    });

    if (data) {
      // console.log("Data: ", data)
      // console.log("text.js - string:", data.string, "rotation: ", data.rotation, " hAlign: ", data.horizontalAlignment, " vAlign: ", data.verticalAlignment)
      this.points[0] = data.points[0];
      // create points[1] used to determin the text rotation
      this.points[1] = data.points[0].add(new Point(this.height, 0));

      if (data.input) {
        // TODO: Find a better way of providing this data
        // This comes from core
        this.height = data.input[1];
        this.string = String(data.input[2]);
      }

      if (data.string) {
        this.string = String(data.string);
      }

      if (data.height) {
        this.height = data.height;
      }

      if (data.colour) {
        this.colour = data.colour;
      }

      if (data.layer) {
        this.layer = data.layer;
      }

      if (data.rotation) {
        // if we get rotation data store this as a point[1] at an angle from point[0]
        // this allows all the entities to be rotated by rotating the points i.e. not all entities have a rotation property
        this.points[1] = data.points[0].project(Utils.degrees2radians(data.rotation), this.height);
      }
      if (data.horizontalAlignment) {
        this.horizontalAlignment = data.horizontalAlignment;
      }

      if (data.verticalAlignment) {
        this.verticalAlignment = data.verticalAlignment;
      }

      if (data.styleName) {
        this.styleName = data.styleName;
      }

      if (data.flags) {
        switch (data.flags) {
          // DXF Data
          // 2 = Text is backward (mirrored in X).
          // 4 = Text is upside down (mirrored in Y).
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

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    // console.log('inputArray: ', core.scene.inputArray);
    // console.log('type: ', typeof core.scene.inputArray[num - 1]);

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.START;

    expectedType[1] = ['object'];
    prompt[1] = Strings.Input.HEIGHT;

    expectedType[2] = ['number'];
    prompt[2] = Strings.Input.STRING;

    expectedType[3] = ['string', 'number'];
    prompt[3] = Strings.Input.NONE;

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      // console.log('invalid');
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === 3) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  width() {
    // TODO: How to access the canvas element from here? Better way to do text width?
    const oldFont = canvas.context.font;
    canvas.context.font = this.height + 'pt ' + SM.getStyleByName(this.styleName).font.toString();
    const width = (canvas.context.measureText(this.string.toString()).width);
    canvas.context.font = oldFont;
    return width;
  }

  setRotation(angle) {
    // angle in radians
    // This overwrites the rotation rather than add to it.
    // i.e. angle = 3.14159 rad will be a rotation of 180 degs.
    this.points[1] = this.points[0].project(angle, this.height);
  }

  getRotation() {
    // return the rotation angle in radians
    return this.points[0].angle(this.points[1]);
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
    // console.log("text.js - Rect height: ", rect.height, " width: ", rect.width, " x: ", rect.x, " y: ", rect.y)
    return rect;
  }

  draw(ctx, scale, core) {
    // var rect = this.getBoundingRect()

    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const colour = this.getColour(core);

    ctx.save();
    ctx.scale(1, -1);
    ctx.translate(this.points[0].x, -this.points[0].y);

    if (this.upsideDown) {
      ctx.scale(1, -1);
    }

    if (this.backwards) {
      ctx.scale(-1, 1);
    }

    if (this.backwards || this.upsideDown) {
      ctx.rotate(this.rotation);
    } else {
      ctx.rotate(-this.rotation);
    }

    try { // HTML
      ctx.fillStyle = colour;
      ctx.textAlign = this.getHorizontalAlignment();
      ctx.textBaseline = this.getVerticalAlignment();
      ctx.font = this.height + 'pt ' + core.styleManager.getStyleByName(this.styleName).font.toString();
      ctx.fillText(this.string, 0, 0);
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

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'TEXT',
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '10', // X
        '\n', this.points[0].x,
        '\n', '20', // Y
        '\n', this.points[0].y,
        '\n', '30', // Z
        '\n', '0.0',
        // "\n", "11", //X
        // "\n", this.points[1].x,
        // "\n", "21", //Y
        // "\n", this.points[1].y, //Y
        // "\n", "31", //Z
        // "\n", "0.0",
        '\n', '1', // STRING
        '\n', this.string,
        '\n', '40', // STRING
        '\n', this.height,
        '\n', '50', // ROTATION
        '\n', Utils.radians2degrees(this.rotation),
        // "\n", "7", // TEXT STYLE
        // "\n", "STANDARD",
        // "\n", "72", //HORIZONTAL ALIGNMENT
        // "\n", this.getHorizontalAlignment(),
        // "\n", "73", //VERTICAL ALIGNMENT
        // "\n", this.getVerticalAlignment()
    );
    // console.log(" line.js - DXF Data:" + data)
    return data;
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
    const rect = this.getBoundingRect();
    const botLeft = new Point(rect.x, rect.y);
    const topRight = new Point(rect.x + rect.width, rect.y + rect.height);
    const mid = new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);

    let distance = Utils.distBetweenPoints(P.x, P.y, mid.x, mid.y);

    // if P is inside the bounding box return distance 0
    if (P.x > botLeft.x &&
            P.x < topRight.x &&
            P.y > botLeft.y &&
            P.y < topRight.y
    ) {
      distance = 0;
    }

    // console.log(distance);

    return [mid, distance];
  }

  extremes() {
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

  touched(selectionExtremes, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const rP1 = new Point(selectionExtremes[0], selectionExtremes[2]);
    const rP2 = new Point(selectionExtremes[1], selectionExtremes[3]);

    const rectPoints = {
      start: rP1,
      end: rP2,
    };

    const output = Intersection.intersectRectangleRectangle(this.intersectPoints(), rectPoints);

    if (output.status === 'Intersection') {
      return true;
    }
    // no intersection found. return false
    return false;
  }
}
