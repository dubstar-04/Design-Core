import { Strings } from '../lib/strings.js';
import { ChamferFilletBase } from './chamferFilletBase.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Constants } from '../lib/constants.js';
import { Utils } from '../lib/utils.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { AddState } from '../lib/stateManager.js';
import { CornerEntity } from './cornerEntity.js';
import { Intersection } from '../lib/intersect.js';
import { Colour } from '../lib/colour.js';

import { DesignCore } from '../designCore.js';

/**
 * Fillet Command Class
 * @extends ChamferFilletBase
 */
export class Fillet extends ChamferFilletBase {
  static type = 'Fillet';

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
              DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.INVALIDNUMBER}`);
            } else {
              DesignCore.Scene.headers.filletRadius = r;
            }
            this.#notifySettings();
          } else if (input1 === 'Trim') {
            const top = new PromptOptions(Strings.Input.OPTION, [], ['Trim', 'No trim']);
            const trimInput = await DesignCore.Scene.inputManager.requestInput(top);
            if (trimInput === undefined) return;
            DesignCore.Scene.headers.trimMode = (trimInput === 'Trim');
            this.#notifySettings();
          }
          continue;
        }

        // input1 is a selection — validate and store first entity
        const firstEntity = DesignCore.Scene.entities.get(input1.selectedItemIndex);
        DesignCore.Scene.selectionManager.removeLastSelection();
        if (!(firstEntity instanceof Line) && !(firstEntity instanceof BasePolyline)) {
          DesignCore.Core.notify(`${this.type} - ${firstEntity.type} ${Strings.Message.NOFILLET}`);
          continue;
        }
        if (!this.firstPick.setPick(firstEntity, input1.selectedPoint, `${Strings.Strings.ARC} - ${Strings.Message.NOFILLET}`)) continue;

        // Prompt for second object
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const input2 = await DesignCore.Scene.inputManager.requestInput(op2);
          if (input2 === undefined) return;

          const candidate = DesignCore.Scene.entities.get(input2.selectedItemIndex);
          DesignCore.Scene.selectionManager.removeLastSelection();
          if (!(candidate instanceof Line) && !(candidate instanceof BasePolyline)) {
            DesignCore.Core.notify(`${this.type} - ${candidate.type} ${Strings.Message.NOFILLET}`);
            continue;
          }
          if (!this.secondPick.setPick(candidate, input2.selectedPoint, `${Strings.Strings.ARC} - ${Strings.Message.NOFILLET}`)) continue;
          // If both selections are the same polyline, segments must be consecutive
          // or they must be the open-end segments of an open polyline.
          if (candidate === firstEntity && firstEntity instanceof BasePolyline) {
            const isConsecutive = firstEntity.areConsecutiveSegments(this.firstPick.segmentIndex, this.secondPick.segmentIndex);
            const lastIdx = firstEntity.points.length - 1;
            const isOpenEnds = !firstEntity.flags.hasFlag(1) &&
              ((this.firstPick.segmentIndex === 1 && this.secondPick.segmentIndex === lastIdx) ||
               (this.secondPick.segmentIndex === 1 && this.firstPick.segmentIndex === lastIdx));
            if (!isConsecutive && !isOpenEnds) {
              DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Message.NONCONSECUTIVESEGMENTS}`);
              continue;
            }
          }
          break;
        }

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
    if (!this.firstPick.entity) return;
    if (!this.firstPick.resolveEndpoints()) return;

    const mousePoint = DesignCore.Mouse.pointOnScene();
    const index = DesignCore.Scene.selectionManager.findClosestItem(mousePoint);
    if (index === undefined) return;

    const candidate = DesignCore.Scene.entities.get(index);
    if (!(candidate instanceof Line) && !(candidate instanceof BasePolyline)) return;

    // Temporary second pick — do NOT write to this.secondPick
    const tempSecond = new CornerEntity();
    if (!tempSecond.setPick(candidate, mousePoint, '')) return;
    if (!tempSecond.resolveEndpoints()) return;

    // Virtual intersection of the two infinite lines
    const result = Intersection.intersectSegmentSegment(
        this.firstPick.lineStart, this.firstPick.lineEnd,
        tempSecond.lineStart, tempSecond.lineEnd,
        true, true,
    );
    if (result.status === Intersection.Status.PARALLEL ||
        result.status === Intersection.Status.OVERLAPPING ||
        result.status === Intersection.Status.COINCIDENT) return;

    const intersectionPoint = result.points[0];
    if (!intersectionPoint) return;

    const filletRadius = DesignCore.Scene.headers.filletRadius;
    const trimMode = DesignCore.Scene.headers.trimMode;

    const geo = this.#computeFillet(this.firstPick, tempSecond, intersectionPoint, filletRadius);
    if (!geo) return;
    if (trimMode && !geo.tangentsInBounds) return;

    if (!trimMode) {
      if (geo.arc) DesignCore.Scene.previewEntities.add(geo.arc);
      return;
    }

    // trimMode: dull the original segments then show the shortened versions + arc
    this.#dullSegment(this.firstPick);
    this.#dullSegment(tempSecond);

    DesignCore.Scene.previewEntities.add(DesignCore.CommandManager.createNew('Line', {
      points: [this.firstPick.lineKeptEnd(intersectionPoint), geo.firstTangentPoint],
      ...Utils.cloneProperties(this.firstPick.entity),
    }));
    DesignCore.Scene.previewEntities.add(DesignCore.CommandManager.createNew('Line', {
      points: [tempSecond.lineKeptEnd(intersectionPoint), geo.secondTangentPoint],
      ...Utils.cloneProperties(candidate),
    }));
    if (geo.arc) DesignCore.Scene.previewEntities.add(geo.arc);
  }

  /**
   * Perform the fillet
   */
  action() {
    if (!this.firstPick.entity || !this.secondPick.entity) return;
    if (!this.resolveCornerGeometry(Strings.Message.NOFILLET)) return;

    // radius = 0: trim/extend both lines to the sharp intersection with no arc
    const filletRadius = DesignCore.Scene.headers.filletRadius;
    const trimMode = DesignCore.Scene.headers.trimMode;
    const geo = this.#computeFillet(this.firstPick, this.secondPick, this.intersectionPoint, filletRadius);
    if (!geo) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.PARALLELLINES}`);
      return;
    }

    if (trimMode && !geo.tangentsInBounds) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.RADIUSTOOLARGE}`);
      return;
    }

    if (!trimMode) {
      if (geo.arc) DesignCore.Scene.commit([new AddState(geo.arc)]);
      return;
    }

    const [firstCornerPoint, secondCornerPoint] = geo.arc ?
      geo.arc.toPolylinePoints() :
      [this.intersectionPoint, this.intersectionPoint];
    const stateChanges = this.applyCornerTrim(firstCornerPoint, secondCornerPoint, geo.arc ?? null);
    DesignCore.Scene.commit(stateChanges);
  }

  /**
   * Compute the fillet geometry for two picks meeting at intersectionPoint.
   * Returns null if the lines are collinear or antiparallel.
   * When filletRadius is 0, returns arc: null with both tangent points at the intersection.
   * @param {CornerEntity} firstPick
   * @param {CornerEntity} secondPick
   * @param {Point} intersectionPoint
   * @param {number} filletRadius
   * @return {{arc, firstTangentPoint, secondTangentPoint, tangentsInBounds}|null}
   */
  #computeFillet(firstPick, secondPick, intersectionPoint, filletRadius) {
    if (filletRadius === 0) {
      return { arc: null, firstTangentPoint: intersectionPoint, secondTangentPoint: intersectionPoint, tangentsInBounds: true };
    }

    const firstUnit = firstPick.clickUnit(intersectionPoint);
    const secondUnit = secondPick.clickUnit(intersectionPoint);
    const cosAngle = Math.min(1, Math.max(-1, firstUnit.dot(secondUnit)));
    const cornerAngle = Math.acos(cosAngle);
    if (cornerAngle < Constants.Tolerance.EPSILON || cornerAngle > Math.PI - Constants.Tolerance.EPSILON) return null;

    const bisectorUnit = firstUnit.add(secondUnit).normalise();
    const arcCentre = intersectionPoint.add(bisectorUnit.scale(filletRadius / Math.sin(cornerAngle / 2)));
    const firstTangentPoint = arcCentre.perpendicular(firstPick.lineStart, firstPick.lineEnd);
    const secondTangentPoint = arcCentre.perpendicular(secondPick.lineStart, secondPick.lineEnd);

    const firstKeptDir = firstPick.lineKeptEnd(intersectionPoint).subtract(intersectionPoint);
    const secondKeptDir = secondPick.lineKeptEnd(intersectionPoint).subtract(intersectionPoint);
    const firstDot = firstTangentPoint.subtract(intersectionPoint).dot(firstKeptDir);
    const secondDot = secondTangentPoint.subtract(intersectionPoint).dot(secondKeptDir);
    const tangentsInBounds = firstDot >= 0 && firstDot <= firstKeptDir.dot(firstKeptDir) &&
                             secondDot >= 0 && secondDot <= secondKeptDir.dot(secondKeptDir);

    const windingCross = firstTangentPoint.subtract(arcCentre).cross(secondTangentPoint.subtract(arcCentre));
    const arc = DesignCore.CommandManager.createNew('Arc', {
      points: [arcCentre, firstTangentPoint, secondTangentPoint],
      direction: windingCross > 0 ? 1 : -1,
      ...Utils.cloneProperties(firstPick.entity),
    });

    return { arc, firstTangentPoint, secondTangentPoint, tangentsInBounds };
  }

  /**
   * Dull a segment for preview by cloning it and blending its colour toward the background.
   * For polyline picks, only the relevant line segment is dulled (not the full polyline).
   * @param {CornerEntity} pick
   */
  #dullSegment(pick) {
    const seg = Utils.cloneObject(pick.activeSeg);
    seg.setColour(Colour.blend(pick.entity.getDrawColour(), DesignCore.Settings.canvasbackgroundcolour, 0.8));
    DesignCore.Scene.previewEntities.add(seg);
  }

  /**
   * Display the current fillet settings to the command line
   */
  #notifySettings() {
    const filletRadius = DesignCore.Scene.headers.filletRadius;
    const trimMode = DesignCore.Scene.headers.trimMode;
    DesignCore.Core.notify(`Current settings: Mode = ${trimMode ? 'TRIM' : 'NOTRIM'}, Radius = ${filletRadius}`);
  }
}
