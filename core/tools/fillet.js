import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState, UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Fillet Command Class
 * @extends Tool
 */
export class Fillet extends Tool {
  /** Create a Fillet command */
  constructor() {
    super();
    this.radius = 0;
    this.trim = true;
    this.firstEntity = null;
    this.secondEntity = null;
    this.firstClickPoint = null;
    this.secondClickPoint = null;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Fillet', shortcut: 'F' }; // , type: 'Tool' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      this.#notifySettings();

      while (true) {
        const op1 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION], ['Radius', 'Trim']);
        const input1 = await DesignCore.Scene.inputManager.requestInput(op1);
        if (input1 === undefined) return;

        if (Input.getType(input1) === Input.Type.STRING) {
          if (input1 === 'Radius') {
            const rop = new PromptOptions(Strings.Input.RADIUS, [Input.Type.NUMBER]);
            const r = await DesignCore.Scene.inputManager.requestInput(rop);
            if (r === undefined) return;
            if (r < 0) {
              DesignCore.Core.notify(Strings.Error.INVALIDNUMBER);
            } else {
              this.radius = r;
            }
            this.#notifySettings();
          } else if (input1 === 'Trim') {
            const top = new PromptOptions(Strings.Input.OPTION, [Input.Type.STRING], ['Trim', 'No trim']);
            const trimInput = await DesignCore.Scene.inputManager.requestInput(top);
            if (trimInput === undefined) return;
            this.trim = (trimInput === 'Trim');
            this.#notifySettings();
          }
          continue;
        }

        // input1 is a selection — store first entity
        this.firstEntity = DesignCore.Scene.entities.get(input1.selectedItemIndex);
        this.firstClickPoint = input1.selectedPoint;
        DesignCore.Scene.selectionManager.removeLastSelection();

        // Prompt for second object
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        const input2 = await DesignCore.Scene.inputManager.requestInput(op2);
        if (input2 === undefined) return;

        this.secondEntity = DesignCore.Scene.entities.get(input2.selectedItemIndex);
        this.secondClickPoint = input2.selectedPoint;
        DesignCore.Scene.selectionManager.removeLastSelection();

        // Apply fillet then reset
        DesignCore.Scene.inputManager.executeCommand();
        return;
      }
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    // No preview
  }

  /**
   * Perform the fillet
   * Supports Line–Line fillet with optional tangent-arc insertion and trim.
   */
  action() {
    if (!this.firstEntity || !this.secondEntity) return;

    if (this.firstEntity.type !== 'Line' || this.secondEntity.type !== 'Line') {
      DesignCore.Core.notify(`${this.firstEntity.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    const p1 = this.firstEntity.points[0];
    const p2 = this.firstEntity.points[1];
    const p3 = this.secondEntity.points[0];
    const p4 = this.secondEntity.points[1];

    // Direction vectors
    const d1 = p2.subtract(p1);
    const d2 = p4.subtract(p3);
    const cross = d1.cross(d2);

    if (Math.abs(cross) < 1e-10) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return;
    }

    // Virtual intersection point I (parametric line–line intersection)
    const diff = p3.subtract(p1);
    const t = diff.cross(d2) / cross;
    const I = new Point(p1.x + t * d1.x, p1.y + t * d1.y);

    // Determine which endpoint of each line is on the "kept" side
    const farEnd1 = this.firstClickPoint.distance(p1) >= this.firstClickPoint.distance(p2) ? p1 : p2;
    const farEnd2 = this.secondClickPoint.distance(p3) >= this.secondClickPoint.distance(p4) ? p3 : p4;

    // radius = 0: sharp corner only
    if (this.radius === 0) {
      if (this.trim) {
        const stateChanges = [
          new UpdateState(this.firstEntity, { points: [farEnd1, I] }),
          new UpdateState(this.secondEntity, { points: [farEnd2, I] }),
        ];
        DesignCore.Scene.commit(stateChanges);
      }
      return;
    }

    // Project click points onto their respective lines to get accurate direction vectors
    const c1 = this.firstClickPoint.perpendicular(p1, p2);
    const c2 = this.secondClickPoint.perpendicular(p3, p4);

    const v1 = c1.subtract(I);
    const v2 = c2.subtract(I);
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (len1 < 1e-10 || len2 < 1e-10) {
      DesignCore.Core.notify(`${this.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    const u1 = new Point(v1.x / len1, v1.y / len1);
    const u2 = new Point(v2.x / len2, v2.y / len2);

    const cosAlpha = Math.min(1, Math.max(-1, u1.x * u2.x + u1.y * u2.y));
    const alpha = Math.acos(cosAlpha);

    // Collinear or antiparallel lines cannot be filleted
    if (alpha < 1e-10 || alpha > Math.PI - 1e-10) {
      DesignCore.Core.notify(`${this.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    // Bisector direction (points into the corner toward the fillet center)
    const bisSum = new Point(u1.x + u2.x, u1.y + u2.y);
    const bisLen = Math.sqrt(bisSum.x * bisSum.x + bisSum.y * bisSum.y);

    if (bisLen < 1e-10) {
      DesignCore.Core.notify(`${this.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    const bisector = new Point(bisSum.x / bisLen, bisSum.y / bisLen);

    // Distance from I to fillet centre along the bisector
    const dist = this.radius / Math.sin(alpha / 2);
    const C = new Point(I.x + bisector.x * dist, I.y + bisector.y * dist);

    // Tangent points: foot of perpendicular from C to each line
    const T1 = C.perpendicular(p1, p2);
    const T2 = C.perpendicular(p3, p4);

    // Arc winding direction: CCW if (T1–C) × (T2–C) > 0
    const cT1 = T1.subtract(C);
    const cT2 = T2.subtract(C);
    const dirCross = cT1.x * cT2.y - cT1.y * cT2.x;
    const direction = dirCross > 0 ? 1 : -1;

    const arc = DesignCore.CommandManager.createNew('Arc', {
      points: [C, T1, T2],
      direction: direction,
    });

    const stateChanges = [new AddState(arc)];

    if (this.trim) {
      stateChanges.push(new UpdateState(this.firstEntity, { points: [farEnd1, T1] }));
      stateChanges.push(new UpdateState(this.secondEntity, { points: [farEnd2, T2] }));
    }

    DesignCore.Scene.commit(stateChanges);
  }

  /**
   * Display the current fillet settings to the command line
   */
  #notifySettings() {
    DesignCore.Core.notify(`Current settings: Mode = ${this.trim ? 'TRIM' : 'NOTRIM'}, Radius = ${this.radius}`);
  }
}
