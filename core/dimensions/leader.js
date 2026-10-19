import { DimensionBase } from './dimensionBase.js';
import { Point } from '../entities/point.js';
import { Line } from '../entities/line.js';
import { Text } from '../entities/text.js';

import { Strings } from '../lib/strings.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';

import { DesignCore } from '../designCore.js';
import { Property } from '../properties/property.js';

// the last segment must be steeper than this (radians from horizontal) to get a hookline
const HOOKLINE_ANGLE = Math.PI / 12;

/**
 * Leader Entity Class
 * A polyline leader with an optional arrow head, hookline and embedded text annotation
 * @extends DimensionBase
 */
export class Leader extends DimensionBase {
  static type = 'Leader';

  /**
   * Create a Leader
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // the annotation replaces the dimension text override
    this.properties.remove(Property.Names.TEXTOVERRIDE);

    // Annotation text - written to dxf as a separate TEXT entity referenced by group code 340
    this.properties.add(Property.Names.STRING, {
      type: Property.Type.STRING,
      value: Property.loadValue([data?.string], ''),
    });

    // DXF Groupcode 71 - Arrowhead flag
    this.properties.add(Property.Names.ARROWHEAD, {
      type: Property.Type.BOOLEAN,
      value: Property.loadValue([data?.arrowHead], true),
      dxfCode: 71,
    });

    // DXF Groupcode 75 - Hookline flag
    this.properties.add(Property.Names.HOOKLINE, {
      type: Property.Type.BOOLEAN,
      value: Property.loadValue([data?.hookline], true),
      dxfCode: 75,
    });

    // handle of the annotation TEXT entity (group code 340) - kept stable between saves
    Object.defineProperty(this, 'textHandle', {
      value: data?.textHandle,
      writable: true,
    });
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Leader', shortcut: 'LE' };
    return command;
  }

  /**
   * Normalise raw DXF data before construction
   * @param {Object} data - raw DXF group code object
   * @return {Object} normalised data
   *
   * Handles:
   * - Group code 71: arrowhead flag
   * - Group code 75: hookline flag
   * - Group code 340: annotation handle (the annotation text is merged in by the dxf loader as data.annotation)
   */
  static fromDxf(data) {
    const toBoolean = (value) => (value === undefined ? undefined : Number(value) !== 0);

    return {
      ...data,
      string: data.string ?? data.annotation ?? '',
      arrowHead: data.arrowHead ?? toBoolean(data[71]),
      hookline: data.hookline ?? toBoolean(data[75]),
      textHandle: data.textHandle ?? data[340],
    };
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      this.setProperty(Property.Names.DIMENSIONSTYLE, DesignCore.DimStyleManager.getCstyle());

      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      let annotate = false;
      while (true) {
        const hasSegment = this.points.length >= 2;
        const options = hasSegment ? ['Annotation', 'None', 'Undo'] : [];
        const defaultValue = hasSegment ? 'Annotation' : undefined;
        const op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT, Input.Type.DYNAMIC], options, defaultValue);
        const input = await DesignCore.Scene.inputManager.requestInput(op2);
        if (input === undefined) return;

        if (Input.getType(input) === Input.Type.POINT) {
          this.points.push(input);
        } else if (input === 'Undo') {
          if (this.points.length > 1) this.points.pop();
        } else if (input === 'Annotation') {
          annotate = true;
          break;
        } else if (input === 'None') {
          break;
        }
      }

      if (annotate) {
        const op3 = new PromptOptions(Strings.Input.STRING, [Input.Type.STRING, Input.Type.NUMBER]);
        const string = await DesignCore.Scene.inputManager.requestInput(op3);
        if (string === undefined) return;
        this.setProperty(Property.Names.STRING, String(string));
      }

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (this.points.length === 0) return;

    const data = {
      dimensionStyle: this.getProperty(Property.Names.DIMENSIONSTYLE),
      arrowHead: this.getProperty(Property.Names.ARROWHEAD),
      hookline: this.getProperty(Property.Names.HOOKLINE),
    };

    const promptTypes = DesignCore.Scene.inputManager.promptOption?.types ?? [];
    if (promptTypes.includes(Input.Type.STRING)) {
      data.points = this.points;
      data.string = DesignCore.CommandLine.command;
    } else {
      data.points = [...this.points, DesignCore.Mouse.pointOnScene()];
    }

    DesignCore.Scene.previewEntities.create(this.type, data);
  }

  /**
   * Check if the leader has an annotation
   * @return {boolean}
   */
  hasAnnotation() {
    return this.getProperty(Property.Names.STRING).length > 0;
  }

  /**
   * Get the hookline and annotation layout, derived from the last segment
   * @return {Object} - { direction, hookline, attach, textPosition }
   */
  getLayout() {
    const style = this.getDimensionStyle();
    const arrowSize = style.getValue('DIMASZ');
    const gap = style.getValue('DIMGAP');

    const last = this.points.at(-1);
    const previous = this.points.at(-2);
    // the hookline and text extend towards the side the last segment is heading
    const direction = last.x >= previous.x ? 1 : -1;
    const slope = Math.atan2(Math.abs(last.y - previous.y), Math.abs(last.x - previous.x));
    const hookline = this.getProperty(Property.Names.HOOKLINE) && this.hasAnnotation() && slope > HOOKLINE_ANGLE;

    const attach = hookline ? new Point(last.x + direction * arrowSize, last.y) : last;
    const textPosition = new Point(attach.x + direction * gap, attach.y);

    return { direction, hookline, attach, textPosition };
  }

  /**
   * Get the annotation text entity
   * @param {Object} layout - result of getLayout()
   * @return {Text|undefined} - undefined when there is no annotation
   */
  getAnnotationText(layout) {
    if (!this.hasAnnotation()) return undefined;

    const string = this.getProperty(Property.Names.STRING);
    const height = this.getDimensionStyle().getValue('DIMTXT');

    const text = new Text();
    text.setProperty(Property.Names.HEIGHT, height);
    // text is left aligned when it extends to the right of the leader, otherwise right aligned
    text.setProperty(Property.Names.HORIZONTALALIGNMENT, layout.direction > 0 ? 0 : 2);
    text.setProperty(Property.Names.VERTICALALIGNMENT, 2);
    text.setProperty(Property.Names.STRING, string);
    text.points = [layout.textPosition];
    text.setRotation(0);
    // an estimate is used until the text is measured by the renderer
    text.boundingRect = { width: Text.getApproximateWidth(string, height), height: height };

    return text;
  }

  /**
   * Build the leader geometry
   * @return {Array} entities
   */
  buildDimension() {
    const entities = [];
    if (this.points.length < 2) return entities;

    for (let i = 0; i < this.points.length - 1; i++) {
      entities.push(new Line({ points: [this.points[i], this.points[i + 1]] }));
    }

    // the arrow is skipped when the first segment is too short to hold it
    const arrowSize = this.getDimensionStyle().getValue('DIMASZ');
    if (this.getProperty(Property.Names.ARROWHEAD) && this.points[0].distance(this.points[1]) > arrowSize) {
      entities.push(this.getArrowHead(this.points[0], this.points[0].angle(this.points[1])));
    }

    const layout = this.getLayout();
    if (layout.hookline) {
      entities.push(new Line({ points: [this.points.at(-1), layout.attach] }));
    }

    const text = this.getAnnotationText(layout);
    if (text) {
      entities.push(text);
    }

    return entities;
  }

  /**
   * Get the grip points for interactive editing on the canvas - one per vertex
   * @return {Array<{point: Point, apply: Function}>} grips
   */
  getGrips() {
    return this.points.map((point, index) => {
      const apply = (newPoint) => {
        return this.points.map((existing, i) => {
          if (i === index) {
            return new Point(newPoint.x, newPoint.y, existing.bulge, existing.sequence);
          }
          return existing;
        });
      };

      return { point: point, apply: apply };
    });
  }

  /**
   * Assign the annotation handle when the leader is added, before DXF export.
   * Existing handles remain assigned for undo and repeated saves.
   */
  assignHandles() {
    if (this.hasAnnotation() && this.textHandle === undefined) {
      this.textHandle = DesignCore.HandleManager.next();
    }
  }

  /**
   * Set a property and assign an annotation handle if text is added to an existing leader.
   * @param {string} property
   * @param {any} value
   */
  setProperty(property, value) {
    super.setProperty(property, value);
    if (property === Property.Names.STRING && this.getProperty(Property.Names.HANDLE) !== undefined) {
      this.assignHandles();
    }
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    // the LEADER entity is not available before R13
    if (file.version < DXFFile.Version.R13 || this.points.length < 2) return;

    const layout = this.getLayout();
    const text = this.getAnnotationText(layout);
    const textHeight = this.getDimensionStyle().getValue('DIMTXT');
    const layer = this.getProperty(Property.Names.LAYER);

    file.writeGroupCode('0', 'LEADER');
    file.writeGroupCode('5', this.getProperty(Property.Names.HANDLE), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', layer);
    file.writeGroupCode('100', 'AcDbLeader', DXFFile.Version.R2000);
    file.writeGroupCode('3', this.getProperty(Property.Names.DIMENSIONSTYLE));
    file.writeGroupCode('71', this.getProperty(Property.Names.ARROWHEAD) ? 1 : 0); // Arrowhead flag
    file.writeGroupCode('72', 0); // Leader path type - straight line segments
    file.writeGroupCode('73', text ? 0 : 3); // Annotation type - 0 text, 3 none
    file.writeGroupCode('74', layout.direction > 0 ? 0 : 1); // Hookline direction - AutoCAD draws 0 towards +X of the horizontal vector
    file.writeGroupCode('75', layout.hookline ? 1 : 0); // Hookline flag
    file.writeGroupCode('40', textHeight);
    file.writeGroupCode('41', text ? text.boundingRect.width : 0);
    file.writeGroupCode('76', this.points.length);

    this.points.forEach((point) => {
      file.writeGroupCode('10', point.x);
      file.writeGroupCode('20', point.y);
      file.writeGroupCode('30', '0.0');
    });

    if (text) {
      file.writeGroupCode('340', this.textHandle); // Associated annotation
    }

    // Normal
    file.writeGroupCode('210', '0.0');
    file.writeGroupCode('220', '0.0');
    file.writeGroupCode('230', '1.0');
    // Horizontal direction
    file.writeGroupCode('211', '1.0');
    file.writeGroupCode('221', '0.0');
    file.writeGroupCode('231', '0.0');
    // Offset of the block reference insertion point
    file.writeGroupCode('212', '0.0');
    file.writeGroupCode('222', '0.0');
    file.writeGroupCode('232', '0.0');
    // Offset of the last vertex from the annotation placement point
    const last = this.points.at(-1);
    file.writeGroupCode('213', last.x - layout.textPosition.x);
    file.writeGroupCode('223', last.y - layout.textPosition.y);
    file.writeGroupCode('233', '0.0');

    if (text) {
      // AutoCAD only associates MTEXT annotations, so the text is written as MTEXT
      file.writeGroupCode('0', 'MTEXT');
      file.writeGroupCode('5', this.textHandle, DXFFile.Version.R2000);
      file.writeGroupCode('102', '{ACAD_REACTORS', DXFFile.Version.R2000);
      file.writeGroupCode('330', this.getProperty(Property.Names.HANDLE), DXFFile.Version.R2000);
      file.writeGroupCode('102', '}', DXFFile.Version.R2000);
      file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
      file.writeGroupCode('8', layer);
      file.writeGroupCode('100', 'AcDbMText', DXFFile.Version.R2000);
      file.writeGroupCode('10', layout.textPosition.x);
      file.writeGroupCode('20', layout.textPosition.y);
      file.writeGroupCode('30', '0.0');
      file.writeGroupCode('40', textHeight);
      file.writeGroupCode('41', '0.0'); // No word wrap
      file.writeGroupCode('71', layout.direction > 0 ? 4 : 6); // Attachment - middle left or middle right
      file.writeGroupCode('72', 1); // Drawing direction - left to right
      file.writeGroupCode('1', this.getProperty(Property.Names.STRING).replace(/[\\{}]/g, '\\$&'));
    }
  }
}
