import { Point } from './point.js';
import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { Property } from '../properties/property.js';

import { DesignCore } from '../designCore.js';
import { Text } from './text.js';

/**
 * Arc Aligned Charater Class
 */
export class ArcAlignedCharacter {
  #character;
  #position;
  #angle;
  #height;

  /**
   * @param {string} character - text character
   * @param {Point} position - center mid point of character
   * @param {number} angle - in radians
   * @param {number} height - character height
   */
  constructor(character, position, angle, height = 1) {
    this.#character = character;
    this.#position = position;
    this.#angle = angle;
    this.#height = height;
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
   * Get baseline point
   * @return {Point}
   */
  get baseline() {
    const baselinePoint = new Point(this.#position.x - this.boundingBox.xLength*0.5, this.#position.y - this.boundingBox.yLength*0.5).rotate(this.#position, this.#angle);
    return baselinePoint;
  }

  /**
   * Get bounding box
   * @return {BoundingBox}
   */
  get boundingBox() {
    const halfHeight = this.#height / 2;
    const halfWidth = halfHeight * 0.6; // approximate width as half height
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
    // Object.defineProperty(this, 'fontName', {
    //  value: Property.loadValue([data?.fontName, data?.[2]], 'Arial'),
    // enumerable: false,
    // });

    // DXF Groupcode 3 -

    // DXF Groupcode 7 - Text style name
    this.styleName = (Property.loadValue([data?.styleName, data?.[7]], 'STANDARD'));

    // points loaded by super class
    // DXF Groupcode 10 - X Arc center point
    // DXF Groupcode 20 - Y Arc center point
    // DXF Groupcode 30 - Z Arc center point

    // DXF Groupcode 40 -
    this.radius = Property.loadValue([data?.radius, data?.[40]], 10);
    // DXF Groupcode 41 - Width Factor
    this.widthFactor = Property.loadValue([data?.widthFactor, data?.[41]], 1);
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
    // DXF Groupcode 50 - Start Angle in degrees
    this.startAngle = Property.loadValue([data?.startAngle, data?.[50]], 0);
    // DXF Groupcode 51 - End Angle in degrees
    this.endAngle = Property.loadValue([data?.endAngle, data?.[51]], 180);
    // DXF Groupcode 70 - Text Direction 0 = forward, 1 = reversed
    this.textReversed = Property.loadValue([data?.textReversed, Boolean(parseInt(data?.[70]))], false);
    // DXF Groupcode 71 - 1 = outward, 2 = inward
    this.textOrientation = Property.loadValue([data?.textOrientation, data?.[71]], 1);
    // DXF Groupcode 72 - 1 = fit to arc, 2 = left align, 3 = right align, 4 = center
    this.textAlignment = Property.loadValue([data?.textAlignment, data?.[72]], 4);
    // DXF Groupcode 73 - Arc Side: convex = 1, concave = 2
    this.arcSide = Property.loadValue([data?.arcSide, data?.[73]], 1);
    // DXF Groupcode 74 - Bold 0 = off, 1 = on
    this.bold = Property.loadValue([data?.bold, Boolean(parseInt(data?.[74]))], false);
    // DXF Groupcode 75 - Italic 0 = off, 1 = on
    this.italic = Property.loadValue([data?.italic, Boolean(parseInt(data?.[75]))], false);
    // DXF Groupcode 76 - Underline 0 = off, 1 = on
    this.underline = Property.loadValue([data?.underline, Boolean(parseInt(data?.[76]))], false);
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
      const selection = await DesignCore.Scene.inputManager.requestInput(op);

      const selectedArc = DesignCore.Scene.entities.get(selection.selectedItemIndex);

      // set the arc properties
      // direction: - ccw > 0, cw <= 0
      this.startAngle = Utils.radians2degrees(selectedArc.direction > 0 ? selectedArc.startAngle() : selectedArc.endAngle());
      this.endAngle = Utils.radians2degrees(selectedArc.direction > 0 ? selectedArc.endAngle(): selectedArc.startAngle());
      this.radius = selectedArc.radius;

      //  set the center point
      this.points.push(new Point(selectedArc.points[0].x, selectedArc.points[0].y));

      // set the text style to the current style
      const currentStyle = DesignCore.StyleManager.getCstyle();
      this.styleName = currentStyle;

      // get properties from style
      const style = DesignCore.StyleManager.getItemByName(this.styleName);
      if (style.textHeight) {
        this.height = style.textHeight;
      }

      // Get the font size when standard style is used
      if (this.styleName.toUpperCase() === 'STANDARD') {
        const op2 = new PromptOptions(`${Strings.Input.HEIGHT} <${this.height}>`, [Input.Type.NUMBER]);
        const height = await DesignCore.Scene.inputManager.requestInput(op2);
        this.height = height;
      }

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
          startAngle: this.startAngle,
          endAngle: this.endAngle,
          radius: this.radius,
          string: DesignCore.CommandLine.command,
        };

        DesignCore.Scene.tempEntities.create(this.type, data);
      }
    }
  }

  /**
   * Convert linear length to angular length on arc
   * @param {number} length - linear length
   * @param {number} radius - radius of arc
   * @return {number} angle in radians
   */
  linearToAnglular(length, radius) {
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
      if (midAngle >= Math.PI*2) midAngle -= Math.PI*2; ;
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
    const radialDistance = this.arcSide === 2 ? this.radius - this.offsetFromArc - this.height * 0.5: this.radius + this.offsetFromArc + this.height * 0.5;
    // calculate character width
    const charWidth = Text.getApproximateWidth(this.string[0], this.height);
    // calculate total char width including additional spacing
    const totalCharWidth = charWidth + this.characterSpacing;
    // convert the linear with of a character as an angle on the arc
    const charWidthAsAngle = this.linearToAnglular(charWidth*0.5, radialDistance);
    // get total charwidth as angle
    let totalCharWidthAsAngle = this.linearToAnglular(totalCharWidth*0.5, radialDistance);

    // calculate start and end offsets
    const startOffsetAngle = this.linearToAnglular(this.offsetFromRight, radialDistance) + charWidthAsAngle * 0.5;
    const endOffsetAngle = this.linearToAnglular(this.offsetFromLeft, radialDistance) + charWidthAsAngle * 0.5;

    // total arc angle
    const totalArcAngle = Utils.degrees2radians(Math.abs(this.endAngle - this.startAngle)) - startOffsetAngle - endOffsetAngle;

    // defined positions - Start and end angles +/- half char width
    const startPosition = this.points[0].project(Utils.degrees2radians(this.startAngle) + startOffsetAngle, radialDistance);
    const endPosition = this.points[0].project(Utils.degrees2radians(this.endAngle) - endOffsetAngle, radialDistance);

    // default to the arc end position as the string start
    let stringStartPoint = endPosition;
    // direction: - ccw > 0, cw <= 0
    let direction = 1; // default to ccw

    let string = this.string.slice(); // make a copy of the string

    // 1 = fit to arc, 2 = left align, 3 = right align, 4 = center
    if (this.textAlignment === 1) { // fit to arc
      totalCharWidthAsAngle = totalArcAngle / (this.string.length - 1);
    }
    if (this.textAlignment === 2) { // left align
    }
    if (this.textAlignment === 3) { // right align
      // start at the arc start position and create the text cw around the arc
      stringStartPoint = startPosition;
      direction = -1;
      string = string.split('').reverse().join('');
    }
    if (this.textAlignment === 4) { // center
      const arcMidPoint = this.points[0].project(this.arcMidAngle(Utils.degrees2radians(this.startAngle), Utils.degrees2radians(this.endAngle)), radialDistance);
      stringStartPoint = arcMidPoint.rotate(this.points[0], 0.5 * totalCharWidthAsAngle * (string.length - 1));
    }

    // calculate the text rotation angle: 1 = outward, 2 = inward
    const textRotationAngle = this.textOrientation === 2 ? -Math.PI*0.5 : Math.PI*0.5;

    if (this.textOrientation === 2) {
      // direction = -direction;
      string = string.split('').reverse().join('');
    }

    /*
    if (this.textReversed === 1) {
      // reverse the string
      string = string.split('').reverse().join('');
      // reverse the direction
      direction = -direction;
    }
      */

    // loop through string and calculate position and angle of each character
    for (let index = 0; index < string.length; index++) {
      const charPosition = stringStartPoint.rotate(this.points[0], -totalCharWidthAsAngle*((index) * direction));
      const charAngle = this.points[0].angle(charPosition) - textRotationAngle;
      const arcChar = new ArcAlignedCharacter(string[index], charPosition, charAngle, this.height);
      arcAlignedCharacters.push(arcChar);
    }

    return arcAlignedCharacters;
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    ctx.save(); // save current context before scale and translate
    ctx.scale(1, -1);

    const style = DesignCore.StyleManager.getItemByName(this.styleName);

    // Cairo
    ctx.setFontSize(this.height);
    ctx.selectFontFace(style.font, null, null); // (FontName, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL);

    const ArcAlignedCharacters = this.getArcAlignedCharacters();

    for (const arcAlignedChar of ArcAlignedCharacters) {
      ctx.save(); // save current context
      ctx.translate(arcAlignedChar.baseline.x, -arcAlignedChar.baseline.y);
      ctx.rotate(-arcAlignedChar.angle);
      ctx.showText(String(arcAlignedChar.character));

      ctx.stroke();
      ctx.restore(); // restore context

      /*
      // debug draw character bounding box
      const bb = arcAlignedChar.boundingBox;
      const center = arcAlignedChar.position;

      const posOne = new Point(center.x - bb.xLength*0.5, center.y - bb.yLength*0.5).rotate(arcAlignedChar.position, arcAlignedChar.angle);
      const posTwo = new Point(center.x + bb.xLength*0.5, center.y - bb.yLength*0.5).rotate(arcAlignedChar.position, arcAlignedChar.angle);
      const posThree = new Point(center.x + bb.xLength*0.5, center.y + bb.yLength*0.5).rotate(arcAlignedChar.position, arcAlignedChar.angle);
      const posFour = new Point(center.x - bb.xLength*0.5, center.y + bb.yLength*0.5).rotate(arcAlignedChar.position, arcAlignedChar.angle);

      ctx.moveTo(posOne.x, -posOne.y);
      ctx.lineTo(posTwo.x, -posTwo.y);
      ctx.lineTo(posThree.x, -posThree.y);
      ctx.lineTo(posFour.x, -posFour.y);
      ctx.lineTo(posOne.x, -posOne.y);
      ctx.stroke();
      */
    }

    ctx.stroke();
    ctx.restore(); // restore context before scale and translate
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    const style = DesignCore.StyleManager.getItemByName(this.styleName);

    file.writeGroupCode('0', 'ARCALIGNEDTEXT');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbArcAlignedText', DXFFile.Version.R2000);
    file.writeGroupCode('1', this.string);
    file.writeGroupCode('2', style.font);
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
    file.writeGroupCode('50', this.startAngle);
    file.writeGroupCode('51', this.endAngle);
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

    const ArcAlignedCharacters = this.getArcAlignedCharacters();

    for (const arcAlignedChar of ArcAlignedCharacters) {
      // Don't snap to space characters
      if (arcAlignedChar.character.trim() === '') continue;
      snaps.push(arcAlignedChar.position);
    }

    snaps.push(this.points[0]); // arc center

    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    // TODO: improve closest point calculation
    let distance = Infinity;
    let minPnt = P;

    const ArcAlignedCharacters = this.getArcAlignedCharacters();

    for (const arcAlignedChar of ArcAlignedCharacters) {
      const pntDist = P.distance(arcAlignedChar.position);


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
    // TODO: improve bounding box calculation
    const ArcAlignedCharacters = this.getArcAlignedCharacters();
    const points = ArcAlignedCharacters.map((char) => char.position);

    if (points.length > 0) {
      return BoundingBox.fromPoints(points);
    }

    return new BoundingBox();
  }

  /**
   * Intersect points
   * @return {Object} - object defining data required by intersect methods
   */
  intersectPoints() {
    // TODO: improve intersection calculation
    const ArcAlignedCharacters = this.getArcAlignedCharacters();

    if (ArcAlignedCharacters.length > 0) {
      const pts = ArcAlignedCharacters.map((char) => char.position);
      return { points: pts };
    }

    return {};
  }
}
