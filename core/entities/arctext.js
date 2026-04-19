import { Arc } from './arc.js';
import { Point } from './point.js';
import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { Property } from '../properties/property.js';
import { Text } from './text.js';

import { DesignCore } from '../designCore.js';
import { SnapPoint } from '../lib/auxiliary/snapPoint.js';

/**
 * Arc Aligned Character Class
 */
export class ArcAlignedCharacter {
  #character;
  #position;
  #angle;
  #height;
  #width;

  /**
   * @param {string} character - text character
   * @param {Point} position - center mid point of character
   * @param {number} angle - in radians
   * @param {number} height - character height
   * @param {number} width - character width
   */
  constructor(character, position, angle, height = 1, width = 1) {
    this.#character = character;
    this.#position = position;
    this.#angle = angle;
    this.#height = height;
    this.#width = width;
  }

  /**
   * Get character
   * @return {string}
   */
  get character() {
    return this.#character;
  }

  /**
   * Get position
   * @return {Point}
   */
  get position() {
    return this.#position;
  }

  /**
   * Get angle
   * @return {number}
   */
  get angle() {
    return this.#angle;
  }

  /**
   * Get height
   * @return {number}
   */
  get height() {
    return this.#height;
  }

  /**
   * Get width
   * @return {number}
   */
  get width() {
    return this.#width;
  }

  /**
   * Get baseline point
   * @return {Point}
   */
  get baseline() {
    const bb = this.boundingBox;
    const baselinePoint = new Point(this.#position.x - bb.xLength*0.5, this.#position.y - bb.yLength*0.5).rotate(this.#position, this.#angle);
    return baselinePoint;
  }

  /**
   * Get bounding box
   * @return {BoundingBox}
   */
  get boundingBox() {
    const halfHeight = this.#height / 2;
    const halfWidth = this.#width / 2;
    const pt1 = new Point(this.position.x - halfWidth, this.position.y - halfHeight);
    const pt2 = new Point(this.position.x + halfWidth, this.position.y + halfHeight);
    return new BoundingBox(pt1, pt2);
  }
}


/**
 * Text Entity Class
 * @extends Entity
 */
export class ArcAlignedText extends Entity {
  static type = 'ArcAlignedText';

  /**
   * Create a Text Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // hide inherited properties
    // needs to be enumerable=false to not appear in the object props
    Object.defineProperty(this, 'lineType', {
      enumerable: false,
    });

    Object.defineProperty(this, 'lineWidth', {
      enumerable: false,
    });

    // DXF Groupcode 1 - Text String
    this.string = (Property.loadValue([data?.string, data?.[1]], ''));

    // DXF Groupcode 2 - Font name
    // not implemented - enumerable=false to not appear in the object props
    // get font from selected style: this.styleName.font
    Object.defineProperty(this, 'fontName', {
      value: Property.loadValue([data?.fontName, data?.[2]], 'Arial'),
      writable: true,
    });

    // DXF Groupcode 3
    // not implemented - always empty in acad output

    // DXF Groupcode 7 - Text style name
    this.styleName = (Property.loadValue([data?.styleName, data?.[7]], 'STANDARD'));

    // DXF Groupcode 40 - Radius
    this.radius = Property.loadValue([data?.radius, data?.[40]], 10);

    // DXF Groupcode 41 - Width Factor
    // not implemented - enumerable=false to not appear in the object props
    Object.defineProperty(this, 'widthFactor', {
      value: Property.loadValue([data?.widthFactor, data?.[41]], 1),
      writable: true,
    });

    // DXF Groupcode 42 - Text Height
    this.height = Property.loadValue([data?.height, data?.[42]], 2.5);
    // DXF Groupcode 43 - Character Spacing
    this.characterSpacing = Property.loadValue([data?.characterSpacing, data?.[43]], 0.095);
    // DXF Groupcode 44 - Offset from Arc
    this.offsetFromArc = Property.loadValue([data?.offsetFromArc, data?.[44]], 0);
    // DXF Groupcode 45 - Offset from right
    this.offsetFromRight = Property.loadValue([data?.offsetFromRight, data?.[45]], 0);
    // DXF Groupcode 46 - Offset from left
    this.offsetFromLeft = Property.loadValue([data?.offsetFromLeft, data?.[46]], 0);

    // ensure points array has at least one point - the arc center
    if (!this.points.length) {
      this.points = [];
      this.points.push(new Point(0, 0)); // center point
    }

    // DXF Groupcode 50 - Start Angle in degrees
    const startAngle = Utils.round(Property.loadValue([data?.startAngle, data?.[50]], 0));
    if (this.points[1] === undefined) {
      this.points[1] = this.points[0].project(Utils.degrees2radians(startAngle), this.radius);
    }

    // DXF Groupcode 51 - End Angle in degrees
    const endAngle = Utils.round(Property.loadValue([data?.endAngle, data?.[51]], 180));
    if (this.points[2] === undefined) {
      this.points[2] = this.points[0].project(Utils.degrees2radians(endAngle), this.radius);
    }

    // DXF Groupcode 70 - Text Direction 0 = forward, 1 = reversed
    // not implemented - enumerable=false to not appear in the object props
    Object.defineProperty(this, 'textReversed', {
      value: Property.loadValue([data?.textReversed, Boolean(parseInt(data?.[70]))], false),
      writable: true,
    });

    // DXF Groupcode 71 - 1 = outward, 2 = inward
    this.textOrientation = Property.loadValue([data?.textOrientation, data?.[71]], 1);
    // DXF Groupcode 72 - 1 = fit to arc, 2 = left align, 3 = right align, 4 = center
    this.textAlignment = Property.loadValue([data?.textAlignment, data?.[72]], 4);
    // DXF Groupcode 73 - Arc Side: convex = 1, concave = 2
    this.arcSide = Property.loadValue([data?.arcSide, data?.[73]], 1);

    // DXF Groupcode 74 - Bold 0 = off, 1 = on
    // not implemented - enumerable=false to not appear in the object props
    Object.defineProperty(this, 'bold', {
      value: Property.loadValue([data?.bold, Boolean(parseInt(data?.[74]))], false),
      writable: true,
    });

    // DXF Groupcode 75 - Italic 0 = off, 1 = on
    // not implemented - enumerable=false to not appear in the object props
    Object.defineProperty(this, 'italic', {
      value: Property.loadValue([data?.italic, Boolean(parseInt(data?.[75]))], false),
      writable: true,
    });

    // DXF Groupcode 76 - Underline 0 = off, 1 = on
    // not implemented - enumerable=false to not appear in the object props
    Object.defineProperty(this, 'underline', {
      value: Property.loadValue([data?.underline, Boolean(parseInt(data?.[76]))], false),
      writable: true,
    });

    // Not Implemented:
    // DXF Groupcode 77 -
    // DXF Groupcode 78 -
    // DXF Groupcode 79 -
    // DXF Groupcode 90 -
    // DXF Groupcode 210 -
    // DXF Groupcode 220 -
    // DXF Groupcode 230 -
    // DXF Groupcode 280 -
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'ArcAlignedText', shortcut: 'ArcText' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);

      let selectedArc = null;
      while (selectedArc instanceof Arc !== true) {
        // reset selection
        DesignCore.Scene.selectionManager.reset();

        const selection = await DesignCore.Scene.inputManager.requestInput(op);
        if (selection === undefined) return;
        selectedArc = DesignCore.Scene.entities.get(selection.selectedItemIndex);

        if (selectedArc instanceof Arc === false) {
          const msg = `${this.type} - ${Strings.Error.INVALIDTYPE}: ${selectedArc.type}`;
          DesignCore.Core.notify(msg);
        }
      }

      // Get the arc properties
      // direction: - ccw > 0, cw <= 0
      this.radius = selectedArc.radius;
      const startPoint = selectedArc.direction > 0 ? selectedArc.points[1] : selectedArc.points[2];
      const endPoint = selectedArc.direction > 0 ? selectedArc.points[2] : selectedArc.points[1];

      //  set the points
      this.points[0] = new Point(selectedArc.points[0].x, selectedArc.points[0].y);
      this.points[1] = new Point(startPoint.x, startPoint.y);
      this.points[2] = new Point(endPoint.x, endPoint.y);

      // set the text style to the current style
      const currentStyle = DesignCore.StyleManager.getCstyle();
      this.styleName = currentStyle;

      // get properties from style
      const style = DesignCore.StyleManager.getItemByName(this.styleName);
      if (style?.textHeight) {
        this.height = style.textHeight;
      }

      // Get the font size when standard style is used
      if (this.styleName.toUpperCase() === 'STANDARD') {
        const op2 = new PromptOptions(Strings.Input.HEIGHT, [Input.Type.NUMBER], [], this.height);
        const height = await DesignCore.Scene.inputManager.requestInput(op2);
        if (height === undefined) return;
        this.height = height;
      }

      const op4 = new PromptOptions(Strings.Input.STRING, [Input.Type.STRING, Input.Type.NUMBER]);
      const string = await DesignCore.Scene.inputManager.requestInput(op4);
      if (string === undefined) return;
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
          startAngle: Utils.radians2degrees(this.startAngle()),
          endAngle: Utils.radians2degrees(this.endAngle()),
          radius: this.radius,
          string: DesignCore.CommandLine.command,
        };

        DesignCore.Scene.previewEntities.create(this.type, data);
      }
    }
  }

  /**
   * Get start angle in radians
   * @return {number}
   */
  startAngle() {
    return this.points[0].angle(this.points[1]);
  }

  /**
   * Get end angle in radians
   * @return {number}
   */
  endAngle() {
    return this.points[0].angle(this.points[2]);
  }

  /**
   * Convert linear length to angular length on arc
   * @param {number} length - linear length
   * @param {number} radius - radius of arc
   * @return {number} angle in radians
   */
  linearToAngular(length, radius) {
    if (radius === 0) {
      return 0;
    }

    return 2 * Math.atan((length)/Math.abs(radius));
  }

  /**
   * Get mid angle of arc
   * @param {number} startAngle - in radians
   * @param {number} endAngle - in radians
   * @return {number} mid angle in radians
   */
  arcMidAngle(startAngle, endAngle) {
    let startAng = startAngle % (Math.PI*2);
    let endAng = endAngle % (Math.PI*2);

    if (startAng < 0) startAng += Math.PI*2;
    if (endAng < 0) endAng += Math.PI*2;

    let midAngle;
    if (endAng < startAng) {
      midAngle = ((endAng + Math.PI*2) + startAng) / 2;
      if (midAngle >= Math.PI*2) midAngle -= Math.PI*2;
    } else {
      midAngle = (startAng + endAng) / 2;
    }

    return midAngle;
  }

  /**
   * Get characters aligned on arc
   * @return {Array} - array of ArcAlignedCharacter
   */
  getArcAlignedCharacters() {
    // character positions on arc
    const arcAlignedCharacters = [];

    if (this.string.length === 0) {
      return arcAlignedCharacters;
    }

    // calculate the radial distance - Arc Side: convex = 1, concave = 2
    const radialDistance = this.arcSide === 2 ? this.radius - this.offsetFromArc - this.height * 0.5 : this.radius + this.offsetFromArc + this.height * 0.5;

    // calculate start and end offsets using the first and last character widths of the original string
    const firstCharWidth = Text.getApproximateWidth(this.string[0], this.height);
    const lastCharWidth = Text.getApproximateWidth(this.string.at(-1), this.height);
    const startOffsetAngle = this.linearToAngular(this.offsetFromRight, radialDistance) + this.linearToAngular(firstCharWidth * 0.5, radialDistance);
    const endOffsetAngle = this.linearToAngular(this.offsetFromLeft, radialDistance) + this.linearToAngular(lastCharWidth * 0.5, radialDistance);

    // default to the arc end position as the string start
    let stringStartPoint = this.points[0].project(this.endAngle() - endOffsetAngle, radialDistance);
    // direction: - ccw > 0, cw <= 0
    let direction = 1; // default to ccw

    let string = this.string.slice(); // make a copy of the string

    // 1 = fit to arc, 2 = left align, 3 = right align, 4 = center
    if (this.textAlignment === 3) { // right align
      // start at the arc start position and create the text cw around the arc
      stringStartPoint = this.points[0].project(this.startAngle() + startOffsetAngle, radialDistance);
      direction = -1;
      string = [...string].reverse().join('');
    }

    // calculate the text rotation angle: 1 = outward, 2 = inward
    const textRotationAngle = this.textOrientation === 2 ? -Math.PI*0.5 : Math.PI*0.5;

    if (this.textOrientation === 2) {
      // direction = -direction;
      string = [...string].reverse().join('');
    }

    /*
    if (this.textReversed === 1) {
      // reverse the string
      string = [...string].reverse().join('');
      // reverse the direction
      direction = -direction;
    }
      */

    // build per-character widths for the final (possibly reversed) string
    const charWidths = [...string].map((ch) => Text.getApproximateWidth(ch, this.height));

    // build cumulative arc angle offsets from the string start position to each character center
    // step between adjacent centers is the average of their two half-widths plus spacing
    const charOffsetAngles = [0];
    if (this.textAlignment === 1) { // fit to arc
      if (string.length === 1) {
        // single character: place at arc midpoint — division by zero otherwise
        stringStartPoint = this.points[0].project(this.arcMidAngle(this.startAngle(), this.endAngle()), radialDistance);
      } else {
        const totalArcAngle = Math.abs(this.endAngle() - this.startAngle()) - startOffsetAngle - endOffsetAngle;
        const fitStep = totalArcAngle / (string.length - 1);
        for (let i = 1; i < string.length; i++) {
          charOffsetAngles.push(fitStep * i);
        }
      }
    } else {
      for (let i = 0; i < string.length - 1; i++) {
        const step = (charWidths[i] + charWidths[i + 1]) / 2 + this.characterSpacing;
        charOffsetAngles.push(charOffsetAngles[i] + this.linearToAngular(step * 0.5, radialDistance));
      }

      if (this.textAlignment === 4) { // center
        const arcMidPoint = this.points[0].project(this.arcMidAngle(this.startAngle(), this.endAngle()), radialDistance);
        stringStartPoint = arcMidPoint.rotate(this.points[0], charOffsetAngles.at(-1) * 0.5);
      }
    }

    // loop through string and calculate position and angle of each character
    for (let index = 0; index < string.length; index++) {
      const charPosition = stringStartPoint.rotate(this.points[0], -charOffsetAngles[index] * direction);
      const charAngle = this.points[0].angle(charPosition) - textRotationAngle;
      const arcChar = new ArcAlignedCharacter(string[index], charPosition, charAngle, this.height, charWidths[index]);
      arcAlignedCharacters.push(arcChar);
    }

    return arcAlignedCharacters;
  }

  /**
   * Return a character descriptor array for use with renderer.drawText().
   * Coordinates are in scene space (Y-up). The renderer handles the Y-flip.
   * @return {Array}
   */
  toCharacters() {
    return this.getArcAlignedCharacters().map((ch) => ({
      x: ch.baseline.x,
      y: ch.baseline.y,
      rotation: ch.angle,
      char: ch.character,
    }));
  }

  /**
   * Draw the entity
   * @param {Object} renderer
   */
  draw(renderer) {
    const style = DesignCore.StyleManager.getItemByName(this.styleName);
    renderer.drawText(this.toCharacters(), style?.font, this.height);
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    const style = DesignCore.StyleManager.getItemByName(this.styleName);

    file.writeGroupCode('0', 'ARCALIGNEDTEXT');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbArcAlignedText', DXFFile.Version.R2000);
    file.writeGroupCode('1', this.string);
    file.writeGroupCode('2', style?.font);
    file.writeGroupCode('3', '');
    file.writeGroupCode('7', this.styleName); // Test style name
    file.writeGroupCode('10', this.points[0].x); // x of arc center
    file.writeGroupCode('20', this.points[0].y); // y of arc center
    file.writeGroupCode('30', '0.0'); // z of arc center
    file.writeGroupCode('40', this.radius);
    file.writeGroupCode('41', this.widthFactor);
    file.writeGroupCode('42', this.height);
    file.writeGroupCode('43', this.characterSpacing);
    file.writeGroupCode('44', this.offsetFromArc);
    file.writeGroupCode('45', this.offsetFromRight);
    file.writeGroupCode('46', this.offsetFromLeft);
    file.writeGroupCode('50', Utils.radians2degrees(this.startAngle()));
    file.writeGroupCode('51', Utils.radians2degrees(this.endAngle()));
    file.writeGroupCode('70', this.textReversed ? 1 : 0); // Text direction
    file.writeGroupCode('71', this.textOrientation); // Text orientation
    file.writeGroupCode('72', this.textAlignment); // Text alignment
    file.writeGroupCode('73', this.arcSide); // Arc side
    file.writeGroupCode('74', this.bold ? 1 : 0);
    file.writeGroupCode('75', this.italic ? 1 : 0);
    file.writeGroupCode('76', this.underline ? 1 : 0);
    file.writeGroupCode('77', 0);
    file.writeGroupCode('78', 34);
    file.writeGroupCode('79', 0);
    file.writeGroupCode('90', 256);
    file.writeGroupCode('210', 0); // X extrusion
    file.writeGroupCode('220', 0); // Y extrusion
    file.writeGroupCode('230', 1); // Z extrusion
    file.writeGroupCode('280', 1);
    file.writeGroupCode('330', ''); // Handle of arc object?
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];

    snaps.push(new SnapPoint(this.points[0], SnapPoint.Type.CENTRE)); // arc center

    const ArcAlignedCharacters = this.getArcAlignedCharacters();
    for (const arcAlignedChar of ArcAlignedCharacters) {
      // Don't snap to space characters
      if (arcAlignedChar.character.trim() === '') continue;
      snaps.push(new SnapPoint(arcAlignedChar.position, SnapPoint.Type.NODE));
    }

    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    let distance = Infinity;
    let minPnt = P;

    const ArcAlignedCharacters = this.getArcAlignedCharacters();

    for (const arcAlignedChar of ArcAlignedCharacters) {
      let pntDist = P.distance(arcAlignedChar.position);

      if (pntDist < arcAlignedChar.height * 0.35) {
        pntDist = 0.1; // this is a hack to make selecting easier
      }

      if (pntDist < distance) {
        distance = pntDist;
        minPnt = arcAlignedChar.position;
      }
    }

    return [minPnt, distance];
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    const ArcAlignedCharacters = this.getArcAlignedCharacters();
    const points = [];

    // get all corner points from each character bounding box
    ArcAlignedCharacters.forEach((char) => {
      const bb = char.boundingBox;
      points.push(new Point(bb.xMin, bb.yMin));
      points.push(new Point(bb.xMax, bb.yMin));
      points.push(new Point(bb.xMin, bb.yMax));
      points.push(new Point(bb.xMax, bb.yMax));
    });

    // create bounding box from points
    if (points.length > 0) {
      return BoundingBox.fromPoints(points);
    }

    return new BoundingBox();
  }

  /**
   * Return a list of points representing a polyline version of this entity
   * @return {Array}
   */
  toPolylinePoints() {
    const characters = this.getArcAlignedCharacters();
    return characters.map((char) => char.position);
  }
}
