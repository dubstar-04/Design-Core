import { Text } from './text.js';
import { Point } from './point.js';
import { Property } from '../properties/property.js';
import { DesignCore } from '../designCore.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Strings } from '../lib/strings.js';
import { Utils } from '../lib/utils.js';
import { Colours } from '../lib/colours.js';

/** Multiline text with a wrapping rectangle and a DXF attachment point. */
export class MText extends Text {
  static type = 'MText';

  /** @param {Object} data */
  constructor(data) {
    const chunks = data?.[3] === undefined ? [] : [data[3]].flat();
    super({
      ...data,
      string: data?.string ?? chunks.concat(data?.[1] ?? '').join(''),
      flags: 0,
      horizontalAlignment: 0,
      verticalAlignment: 3,
    });

    this.properties.remove(Property.Names.BACKWARDS);
    this.properties.remove(Property.Names.UPSIDEDOWN);
    this.properties.add(Property.Names.WIDTH, {
      type: Property.Type.NUMBER,
      value: Property.loadValue([data?.width, data?.[41]], 0),
      dxfCode: 41,
    });
    this.properties.add(Property.Names.ATTACHMENTPOINT, {
      type: Property.Type.LIST,
      value: Property.loadValue([data?.attachmentPoint, data?.[71]], 1),
      dxfCode: 71,
      options: () => ['Top left', 'Top centre', 'Top right', 'Middle left', 'Middle centre',
        'Middle right', 'Bottom left', 'Bottom centre', 'Bottom right']
          .map((display, index) => ({ display, value: index + 1 })),
    });
    this.properties.add(Property.Names.LINESPACINGFACTOR, {
      type: Property.Type.NUMBER,
      value: Property.loadValue([data?.lineSpacingFactor, data?.[44]], 1),
      dxfCode: 44,
    });
    this.properties.add(Property.Names.LINESPACINGSTYLE, {
      type: Property.Type.LIST,
      value: Property.loadValue([data?.lineSpacingStyle, data?.[73]], 1),
      dxfCode: 73,
      options: () => [{ display: 'At least', value: 1 }, { display: 'Exact', value: 2 }],
    });
    this.properties.add(Property.Names.HORIZONTALALIGNMENT, {
      visible: false,
      get: (entity) => (entity.getProperty(Property.Names.ATTACHMENTPOINT) - 1) % 3,
    });
    this.properties.add(Property.Names.VERTICALALIGNMENT, {
      visible: false,
      get: (entity) => 3 - Math.floor((entity.getProperty(Property.Names.ATTACHMENTPOINT) - 1) / 3),
    });
    Object.defineProperty(this, 'layout', { value: undefined, writable: true });

    for (const name of [Property.Names.HEIGHT, Property.Names.WIDTH, Property.Names.STRING, Property.Names.ROTATION,
      Property.Names.ATTACHMENTPOINT, Property.Names.LINESPACINGFACTOR, Property.Names.LINESPACINGSTYLE]) {
      MText.validateProperty(name, this.getProperty(name));
    }
    this.warnFormatting();
    if ((data?.[72] !== undefined && ![1, 5].includes(data[72])) || data?.[75] || data?.[90] ||
      data?.embeddedObjects?.some((object) => object[101] === 'Embedded Object' && object[71]) ||
      data?.[210] || data?.[220] || (data?.[230] !== undefined && data[230] !== 1)) {
      Logging.instance.warn(`${this.type} - ${Strings.Warning.MTEXTLAYOUT}`);
    }
  }

  /** @return {Object} command registration */
  static register() {
    return { command: 'MText', shortcut: 'MT' };
  }

  /** @param {Object} data
   * @return {Object} normalised geometry
   */
  static fromDxf(data) {
    const insertion = data.points?.find((point) => point.sequence === 10) ?? data.points?.[0];
    let direction = data.points?.find((point) => point.sequence === 11);
    if (!direction && data.rotation === undefined && data[50] === undefined) {
      direction = data.embeddedObjects?.find((object) => object[101] === 'Embedded Object')?.points?.find((point) => point.sequence === 10);
    }
    if (!direction && data.rotation === undefined && data[50] === undefined && data.points?.length > 1) return data;
    let rotation = data.rotation ?? Utils.radians2degrees(data[50] ?? 0);
    if (direction) {
      if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y) || (direction.x === 0 && direction.y === 0)) {
        throw new Error(`${Strings.Error.INVALIDPOINT}: MTEXT direction`);
      }
      rotation = Utils.radians2degrees(Math.atan2(direction.y, direction.x));
      if (data[50] !== undefined) Logging.instance.warn(`MText - ${Strings.Warning.MTEXTROTATION}`);
    }
    return {
      ...data,
      rotation,
      points: insertion ? [insertion, insertion.project(Utils.degrees2radians(rotation), data.height ?? data[40] ?? 2.5)] : [],
    };
  }

  /** @param {string} name
   * @param {any} value
   */
  static validateProperty(name, value) {
    let valid = true;
    if (name === Property.Names.STRING) valid = typeof value === 'string';
    if (name === Property.Names.HEIGHT) valid = Number.isFinite(value) && value > 0;
    if (name === Property.Names.WIDTH) valid = Number.isFinite(value) && value >= 0;
    if (name === Property.Names.ROTATION) valid = Number.isFinite(value);
    if (name === Property.Names.ATTACHMENTPOINT) valid = Number.isInteger(value) && value >= 1 && value <= 9;
    if (name === Property.Names.LINESPACINGFACTOR) valid = Number.isFinite(value) && value >= 0.25 && value <= 4;
    if (name === Property.Names.LINESPACINGSTYLE) valid = value === 1 || value === 2;
    if (!valid) throw new RangeError(`MText - ${Strings.Error.INPUT}: ${name}`);
  }

  /** Decode display text without modifying the original DXF content.
   * @param {string} string
   * @return {{text: string, formatted: boolean}}
   */
  static parseText(string) {
    let text = '';
    let formatted = false;
    for (let i = 0; i < string.length; i++) {
      const char = string[i];
      if (char === '{' || char === '}') {
        formatted = true;
        continue;
      }
      if (char !== '\\') {
        text += char;
        continue;
      }
      const code = string[++i];
      if (code === undefined) {
        text += '\\';
      } else if ('\\{}'.includes(code)) {
        text += code;
      } else if (code === 'P' || code === 'X') {
        text += '\n';
        if (code === 'X') formatted = true;
      } else if (code === '~') {
        text += '\u00a0';
      } else if (code === 'U' && /^\+[0-9a-f]{4}/i.test(string.slice(i + 1, i + 6))) {
        text += String.fromCharCode(parseInt(string.slice(i + 2, i + 6), 16));
        i += 5;
      } else if ('LlOoKk'.includes(code)) {
        formatted = true;
      } else if ('AaCcFfHhQqTtWwpS'.includes(code) && string.indexOf(';', i) !== -1) {
        const end = string.indexOf(';', i);
        if (code === 'S') text += string.slice(i + 1, end).replace(/[#^]/g, '/');
        i = end;
        formatted = true;
      } else {
        text += `\\${code}`;
        formatted = true;
      }
    }
    text = text.replace(/%%([dpc])/gi, (_, code) => ({ d: '\u00b0', p: '\u00b1', c: '\u00d8' })[code.toLowerCase()]);
    return { text: text.replace(/\r\n?/g, '\n'), formatted };
  }

  /** Warn once when formatted content is supplied, not on each paint. */
  warnFormatting() {
    if (MText.parseText(this.getProperty(Property.Names.STRING)).formatted) {
      Logging.instance.warn(`${this.type} - ${Strings.Warning.MTEXTFORMATTING}`);
    }
  }

  /** @return {string} plain display text */
  getPlainText() {
    return MText.parseText(this.getProperty(Property.Names.STRING)).text;
  }

  /** @param {string} property
   * @param {any} value
   */
  setProperty(property, value) {
    MText.validateProperty(property, value);
    const rotation = this.getRotation();
    if (property === Property.Names.POINTS && this.points.length > 1 && value.length > 1) {
      const scale = this.points[0].distance(this.points[1]) > 0 ?
        value[0].distance(value[1]) / this.points[0].distance(this.points[1]) : 1;
      if (Math.abs(scale - 1) > 1e-10) {
        MText.validateProperty(Property.Names.HEIGHT, this.getProperty(Property.Names.HEIGHT) * scale);
        super.setProperty(Property.Names.HEIGHT, this.getProperty(Property.Names.HEIGHT) * scale);
        super.setProperty(Property.Names.WIDTH, this.getProperty(Property.Names.WIDTH) * scale);
      }
    }
    super.setProperty(property, value);
    if (property === Property.Names.HEIGHT && this.points.length) this.setRotation(rotation);
    if (property === Property.Names.STRING) this.warnFormatting();
  }

  /** Wrap paragraphs using measured widths, with estimates before the first draw.
   * @param {Function} [measure]
   * @return {Object} local text layout
   */
  getLayout(measure) {
    const height = this.getProperty(Property.Names.HEIGHT);
    const width = this.getProperty(Property.Names.WIDTH);
    const style = DesignCore.StyleManager.getItemByName(this.getProperty(Property.Names.STYLENAME));
    const key = JSON.stringify([this.getProperty(Property.Names.STRING), height, width, style?.font,
      this.getProperty(Property.Names.LINESPACINGFACTOR)]);
    if (!measure && this.layout?.key === key) return this.layout;
    const measureWidth = measure ?? ((text) => Text.getApproximateWidth(text, height));
    const lines = [];
    for (const paragraph of this.getPlainText().split('\n')) {
      if (!width) {
        lines.push(paragraph);
        continue;
      }
      let line = '';
      for (const token of paragraph.match(/[^\S\u00a0]+|[\S\u00a0]+/gu) ?? ['']) {
        if (measureWidth(line + token) <= width) {
          line += token;
          continue;
        }
        if (line) {
          lines.push(line.trimEnd());
          line = '';
        }
        if (/^\s+$/.test(token)) continue;
        for (const char of token) {
          if (line && measureWidth(line + char) > width) {
            lines.push(line);
            line = '';
          }
          line += char;
        }
      }
      lines.push(line.trimEnd());
    }
    const measured = lines.map((text) => ({ text, width: measureWidth(text) }));
    const advance = height * 5 / 3 * this.getProperty(Property.Names.LINESPACINGFACTOR);
    this.layout = {
      key, lines: measured, advance,
      width: measured.reduce((max, line) => Math.max(max, line.width), width),
      height: height + (lines.length - 1) * advance,
    };
    this.boundingRect = { width: this.layout.width, height: this.layout.height };
    return this.layout;
  }

  /** @return {Object} unrotated frame dimensions and insertion point */
  getBoundingRect() {
    const layout = this.getLayout();
    return { width: layout.width, height: layout.height, x: this.points[0].x, y: this.points[0].y };
  }

  /** @return {Array} one renderer descriptor per line */
  toCharacters() {
    const layout = this.getLayout();
    const bottomLeft = this.getTextFrameCorners()[0];
    const angle = Utils.degrees2radians(this.getRotation());
    const alignment = this.getProperty(Property.Names.HORIZONTALALIGNMENT) / 2;
    return layout.lines.map((line, index) => {
      const point = new Point(
          bottomLeft.x + (layout.width - line.width) * alignment,
          bottomLeft.y + layout.height - this.getProperty(Property.Names.HEIGHT) - index * layout.advance,
      )
          .rotate(bottomLeft, angle);
      return { x: point.x, y: point.y, rotation: angle, char: line.text };
    }).filter((line) => line.char.length);
  }

  /** @param {Object} renderer */
  draw(renderer) {
    if (!this.getProperty(Property.Names.STRING)) return;
    const style = DesignCore.StyleManager.getItemByName(this.getProperty(Property.Names.STYLENAME));
    const height = this.getProperty(Property.Names.HEIGHT);
    this.getLayout((text) => renderer.measureText(text, style?.font, height)?.width ?? Text.getApproximateWidth(text, height));
    renderer.drawText(this.toCharacters(), style?.font, height);
  }

  /** Create multiline text through the existing command-line input workflow. */
  async execute() {
    try {
      const point = await DesignCore.Scene.inputManager.requestInput(new PromptOptions(Strings.Input.START, [Input.Type.POINT]));
      if (point === undefined) return;
      this.points = [point];
      const styleName = DesignCore.StyleManager.getCstyle();
      this.setProperty(Property.Names.STYLENAME, styleName);
      const style = DesignCore.StyleManager.getItemByName(styleName);
      if (style?.textHeight) this.setProperty(Property.Names.HEIGHT, style.textHeight);
      for (const [name, prompt] of [[Property.Names.HEIGHT, Strings.Input.HEIGHT], [Property.Names.WIDTH, Strings.Input.WIDTH]]) {
        if (name === Property.Names.HEIGHT && style?.textHeight) continue;
        while (true) {
          const value = await DesignCore.Scene.inputManager.requestInput(new PromptOptions(prompt, [Input.Type.NUMBER], [], this.getProperty(name)));
          if (value === undefined) return;
          if (!Number.isFinite(value) || value < 0 || (name === Property.Names.HEIGHT && value === 0)) {
            DesignCore.Core.notify(`${this.type} - ${name === Property.Names.HEIGHT ? Strings.Error.NONZERO : Strings.Error.NONNEGATIVE}`);
            continue;
          }
          this.setProperty(name, value);
          break;
        }
      }
      const angle = await DesignCore.Scene.inputManager.requestInput(new PromptOptions(Strings.Input.ROTATION, [Input.Type.NUMBER], [], 0));
      if (angle === undefined) return;
      this.setProperty(Property.Names.ROTATION, angle);
      const string = await DesignCore.Scene.inputManager.requestInput(new PromptOptions(Strings.Input.STRING, [Input.Type.STRING, Input.Type.NUMBER]));
      if (string === undefined) return;
      if (!String(string).trim()) {
        DesignCore.Scene.inputManager.reset();
        return;
      }
      this.setProperty(Property.Names.STRING, String(string));
      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /** Preview using the same width, style and height as the final entity. */
  preview() {
    if (this.points.length && DesignCore.Scene.inputManager.promptOption.types.includes(Input.Type.STRING)) {
      DesignCore.Scene.previewEntities.create(this.type, {
        points: this.points,
        string: DesignCore.CommandLine.command,
        height: this.getProperty(Property.Names.HEIGHT),
        width: this.getProperty(Property.Names.WIDTH),
        styleName: this.getProperty(Property.Names.STYLENAME),
        attachmentPoint: this.getProperty(Property.Names.ATTACHMENTPOINT),
        lineSpacingFactor: this.getProperty(Property.Names.LINESPACINGFACTOR),
      });
    } else {
      super.preview();
    }
  }

  /** @param {DXFFile} file */
  dxf(file) {
    if (file.version < DXFFile.Version.R13) {
      throw new Error(`${this.type} - ${Strings.Error.INVALIDDXFFORMAT}: MTEXT requires R13 or newer`);
    }
    file.writeGroupCode('0', 'MTEXT');
    file.writeGroupCode('5', this.getProperty(Property.Names.HANDLE));
    file.writeGroupCode('100', 'AcDbEntity');
    file.writeGroupCode('8', this.getProperty(Property.Names.LAYER));
    if (this.entityColour.aci !== 256) file.writeGroupCode('62', this.entityColour.aci);
    if (this.entityColour.isTrueColour) file.writeGroupCode('420', Colours.rgbToTrueColour(this.getColour()), DXFFile.Version.R2004);
    file.writeGroupCode('100', 'AcDbMText');
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', 0);
    file.writeGroupCode('40', this.getProperty(Property.Names.HEIGHT));
    file.writeGroupCode('41', this.getProperty(Property.Names.WIDTH));
    file.writeGroupCode('71', this.getProperty(Property.Names.ATTACHMENTPOINT));
    file.writeGroupCode('72', 1);
    file.writeGroupCode('7', this.getProperty(Property.Names.STYLENAME));
    const angle = Utils.degrees2radians(this.getRotation());
    file.writeGroupCode('11', Math.cos(angle));
    file.writeGroupCode('21', Math.sin(angle));
    file.writeGroupCode('31', 0);
    file.writeGroupCode('73', this.getProperty(Property.Names.LINESPACINGSTYLE));
    file.writeGroupCode('44', this.getProperty(Property.Names.LINESPACINGFACTOR));
    const string = this.getProperty(Property.Names.STRING).replace(/\r\n?|\n/g, '\\P');
    let offset = 0;
    while (string.length - offset >= 250) {
      const length = /[\uD800-\uDBFF]/.test(string[offset + 249]) ? 249 : 250;
      file.writeGroupCode('3', string.slice(offset, offset + length));
      offset += length;
    }
    file.writeGroupCode('1', string.slice(offset));
  }
}
