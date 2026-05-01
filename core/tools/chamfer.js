import { Strings } from '../lib/strings.js';
import { ChamferFilletBase } from './chamferFilletBase.js';
import { Intersection } from '../lib/intersect.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Utils } from '../lib/utils.js';
import { Point } from '../entities/point.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { AddState } from '../lib/stateManager.js';
import { Colour } from '../lib/colour.js';

import { DesignCore } from '../designCore.js';

/**
 * Chamfer Command Class
 * @extends ChamferFilletBase
 */
export class Chamfer extends ChamferFilletBase {
  static type = 'Chamfer';

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Chamfer', shortcut: 'CHA' };
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
        const op1 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION], ['Distance', 'Angle', 'Trim', 'Method']);
        const input1 = await DesignCore.Scene.inputManager.requestInput(op1);
        if (input1 === undefined) return;

        if (Input.getType(input1) === Input.Type.STRING) {
          if (input1 === 'Distance') {
            const dop1 = new PromptOptions('Specify first chamfer distance', [Input.Type.NUMBER]);
            const d1 = await DesignCore.Scene.inputManager.requestInput(dop1);
            if (d1 === undefined) return;
            if (d1 < 0) {
              DesignCore.Core.notify(`${this.type} - ${Strings.Error.INVALIDNUMBER}`);
            } else {
              DesignCore.Scene.headers.chamferDistanceA = d1;
              const dop2 = new PromptOptions('Specify second chamfer distance', [Input.Type.NUMBER]);
              const d2 = await DesignCore.Scene.inputManager.requestInput(dop2);
              if (d2 === undefined) return;
              if (d2 < 0) {
                DesignCore.Core.notify(`${this.type} - ${Strings.Error.INVALIDNUMBER}`);
              } else {
                DesignCore.Scene.headers.chamferDistanceB = d2;
              }
            }
            this.#notifySettings();
          } else if (input1 === 'Angle') {
            const lop = new PromptOptions('Specify chamfer length on first line', [Input.Type.NUMBER]);
            const len = await DesignCore.Scene.inputManager.requestInput(lop);
            if (len === undefined) return;
            if (len < 0) {
              DesignCore.Core.notify(`${this.type} - ${Strings.Error.INVALIDNUMBER}`);
            } else {
              DesignCore.Scene.headers.chamferLength = len;
              const aop = new PromptOptions(Strings.Input.ANGLE, [Input.Type.NUMBER]);
              const ang = await DesignCore.Scene.inputManager.requestInput(aop);
              if (ang === undefined) return;
              if (ang <= 0 || ang >= 180) {
                DesignCore.Core.notify(`${this.type} - ${Strings.Error.INVALIDNUMBER}`);
              } else {
                DesignCore.Scene.headers.chamferAngle = ang;
              }
            }
            this.#notifySettings();
          } else if (input1 === 'Trim') {
            const top = new PromptOptions(Strings.Input.OPTION, [], ['Trim', 'No trim']);
            const trimInput = await DesignCore.Scene.inputManager.requestInput(top);
            if (trimInput === undefined) return;
            DesignCore.Scene.headers.trimMode = (trimInput === 'Trim');
            this.#notifySettings();
          } else if (input1 === 'Method') {
            const mop = new PromptOptions(Strings.Input.OPTION, [], ['Distance', 'Angle']);
            const methodInput = await DesignCore.Scene.inputManager.requestInput(mop);
            if (methodInput === undefined) return;
            DesignCore.Scene.headers.chamferMode = (methodInput === 'Angle');
            this.#notifySettings();
          }
          continue;
        }

        // input1 is a selection — validate and store first entity
        const firstEntity = DesignCore.Scene.entities.get(input1.selectedItemIndex);
        DesignCore.Scene.selectionManager.removeLastSelection();
        if (!(firstEntity instanceof Line) && !(firstEntity instanceof BasePolyline)) {
          DesignCore.Core.notify(`${firstEntity.type} - ${Strings.Message.NOCHAMFER}`);
          continue;
        }
        if (!this.firstPick.setPick(firstEntity, input1.selectedPoint, `${Strings.Strings.ARC} - ${Strings.Message.NOCHAMFER}`)) continue;

        // Prompt for second object
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const input2 = await DesignCore.Scene.inputManager.requestInput(op2);
          if (input2 === undefined) return;

          const candidate = DesignCore.Scene.entities.get(input2.selectedItemIndex);
          DesignCore.Scene.selectionManager.removeLastSelection();
          if (!(candidate instanceof Line) && !(candidate instanceof BasePolyline)) {
            DesignCore.Core.notify(`${this.type} - ${candidate.type} ${Strings.Message.NOCHAMFER}`);
            continue;
          }
          if (!this.secondPick.setPick(candidate, input2.selectedPoint, `${Strings.Strings.ARC} - ${Strings.Message.NOCHAMFER}`)) continue;
          // If both selections are the same polyline, segments must be consecutive
          // or they must be the open-end segments of an open polyline.
          if (candidate === firstEntity && firstEntity instanceof BasePolyline) {
            const isConsecutive = firstEntity.areConsecutiveSegments(this.firstPick.segmentIndex, this.secondPick.segmentIndex);
            const lastIdx = firstEntity.points.length - 1;
            const isOpenEnds = !firstEntity.flags.hasFlag(1) &&
              ((this.firstPick.segmentIndex === 1 && this.secondPick.segmentIndex === lastIdx) ||
               (this.secondPick.segmentIndex === 1 && this.firstPick.segmentIndex === lastIdx));
            if (!isConsecutive && !isOpenEnds) {
              DesignCore.Core.notify(`${this.type} - ${Strings.Message.NONCONSECUTIVESEGMENTS}`);
              continue;
            }
          }
          break;
        }

        // Apply chamfer then reset
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
    const selection = this.validateSelection();
    if (!selection) return;

    const chamferMode = DesignCore.Scene.headers.chamferMode;
    const trimMode = DesignCore.Scene.headers.trimMode;
    const geo = this.#computeChamfer(this.firstPick, selection.tempSecond, selection.intersectionPoint);
    if (!geo) return;
    if (trimMode && !geo.chamferInBounds) return;

    const isSharpCorner = !chamferMode &&
      DesignCore.Scene.headers.chamferDistanceA === 0 &&
      DesignCore.Scene.headers.chamferDistanceB === 0;

    if (!trimMode) {
      if (!isSharpCorner) DesignCore.Scene.previewEntities.add(geo.chamferLine);
      return;
    }

    // trimMode: dull the original segments then show the shortened versions + chamfer line
    const firstSeg = Utils.cloneObject(this.firstPick.activeSeg);
    firstSeg.setColour(Colour.blend(this.firstPick.entity.getDrawColour(), DesignCore.Settings.canvasbackgroundcolour, DesignCore.Settings.previewBlendFactor));
    firstSeg.setProperty('colour', Colour.blend(this.firstPick.entity.getDrawColour(), DesignCore.Settings.canvasbackgroundcolour, DesignCore.Settings.previewBlendFactor));
    DesignCore.Scene.previewEntities.add(firstSeg);

    const secondSeg = Utils.cloneObject(selection.tempSecond.activeSeg);
    secondSeg.setColour(Colour.blend(selection.tempSecond.entity.getDrawColour(), DesignCore.Settings.canvasbackgroundcolour, DesignCore.Settings.previewBlendFactor));
    secondSeg.setProperty('colour', Colour.blend(selection.tempSecond.entity.getDrawColour(), DesignCore.Settings.canvasbackgroundcolour, DesignCore.Settings.previewBlendFactor));
    DesignCore.Scene.previewEntities.add(secondSeg);

    const firstTrimLine = DesignCore.CommandManager.createNew('Line', {
      points: [this.firstPick.lineKeptEnd(selection.intersectionPoint), geo.firstChamferPoint],
      ...Utils.cloneProperties(this.firstPick.entity),
    });
    DesignCore.Scene.previewEntities.add(firstTrimLine);

    const secondTrimLine = DesignCore.CommandManager.createNew('Line', {
      points: [selection.tempSecond.lineKeptEnd(selection.intersectionPoint), geo.secondChamferPoint],
      ...Utils.cloneProperties(selection.candidate),
    });
    DesignCore.Scene.previewEntities.add(secondTrimLine);

    DesignCore.Scene.previewEntities.add(geo.chamferLine);
  }

  /**
   * Perform the chamfer
   */
  action() {
    if (!this.firstPick.entity || !this.secondPick.entity) return;
    if (!this.resolveCornerGeometry(Strings.Message.NOCHAMFER)) return;

    const chamferMode = DesignCore.Scene.headers.chamferMode;
    const trimMode = DesignCore.Scene.headers.trimMode;

    // Validate angle before computing — parallel-lines error would be misleading
    if (chamferMode) {
      const alpha = DesignCore.Scene.headers.chamferAngle * (Math.PI / 180);
      if (alpha <= 0 || alpha >= Math.PI) {
        DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.INVALIDNUMBER}`);
        return;
      }
    }

    const geo = this.#computeChamfer(this.firstPick, this.secondPick, this.intersectionPoint);
    if (!geo) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.PARALLELLINES}`);
      return;
    }

    // dist=0 in distance mode: sharp corner trim with no chamfer line (mirrors fillet radius=0)
    const isSharpCorner = !chamferMode &&
      DesignCore.Scene.headers.chamferDistanceA === 0 &&
      DesignCore.Scene.headers.chamferDistanceB === 0;

    if (trimMode && !geo.chamferInBounds) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.MAXVALUE}`);
      return;
    }

    if (!trimMode) {
      if (!isSharpCorner) DesignCore.Scene.commit([new AddState(geo.chamferLine)]);
      return;
    }

    const stateChanges = this.applyCornerTrim(
        geo.firstChamferPoint, geo.secondChamferPoint,
        isSharpCorner ? null : geo.chamferLine,
    );
    DesignCore.Scene.commit(stateChanges);
  }

  /**
   * Compute the chamfer geometry for two picks meeting at intersectionPoint.
   * Returns null if the lines are parallel/collinear or the chamfer direction is parallel to line2 (angle mode).
   * @param {CornerEntity} firstPick
   * @param {CornerEntity} secondPick
   * @param {Point} intersectionPoint
   * @return {{chamferLine, firstChamferPoint, secondChamferPoint, chamferInBounds}|null}
   */
  #computeChamfer(firstPick, secondPick, intersectionPoint) {
    const chamferMode = DesignCore.Scene.headers.chamferMode;
    const distA = DesignCore.Scene.headers.chamferDistanceA;
    const firstUnit = firstPick.clickUnit(intersectionPoint);
    const secondUnit = secondPick.clickUnit(intersectionPoint);

    let firstChamferPoint;
    let secondChamferPoint;

    if (!chamferMode) {
      // Distance method: distA = distB = 0 means sharp corner trim with no chamfer line
      const distB = DesignCore.Scene.headers.chamferDistanceB;
      firstChamferPoint = intersectionPoint.add(firstUnit.scale(distA));
      secondChamferPoint = intersectionPoint.add(secondUnit.scale(distB));
    } else {
      // Angle method
      const chamferLength = DesignCore.Scene.headers.chamferLength;
      const alpha = DesignCore.Scene.headers.chamferAngle * (Math.PI / 180);
      if (alpha <= 0 || alpha >= Math.PI) return null;

      firstChamferPoint = intersectionPoint.add(firstUnit.scale(chamferLength));

      const rotAngle = Math.PI - alpha;
      const origin = new Point(0, 0);
      const candidate1 = firstUnit.rotate(origin, rotAngle);
      const chamferDir = candidate1.dot(secondUnit) >= 0 ? candidate1 : firstUnit.rotate(origin, -rotAngle);

      const chamferResult = Intersection.intersectSegmentSegment(
          firstChamferPoint, firstChamferPoint.add(chamferDir),
          secondPick.lineStart, secondPick.lineEnd,
          true, true,
      );
      if (chamferResult.status === Intersection.Status.PARALLEL ||
          chamferResult.status === Intersection.Status.OVERLAPPING ||
          chamferResult.status === Intersection.Status.COINCIDENT) return null;

      secondChamferPoint = chamferResult.points[0];
      if (!secondChamferPoint) return null;
    }

    const firstKeptDir = firstPick.lineKeptEnd(intersectionPoint).subtract(intersectionPoint);
    const secondKeptDir = secondPick.lineKeptEnd(intersectionPoint).subtract(intersectionPoint);
    const firstDot = firstChamferPoint.subtract(intersectionPoint).dot(firstKeptDir);
    const secondDot = secondChamferPoint.subtract(intersectionPoint).dot(secondKeptDir);
    const chamferInBounds = firstDot >= 0 && firstDot <= firstKeptDir.dot(firstKeptDir) &&
                            secondDot >= 0 && secondDot <= secondKeptDir.dot(secondKeptDir);

    const chamferLine = DesignCore.CommandManager.createNew('Line', {
      points: [firstChamferPoint, secondChamferPoint],
      ...Utils.cloneProperties(firstPick.entity),
    });

    return { chamferLine, firstChamferPoint, secondChamferPoint, chamferInBounds };
  }

  /**
   * Display the current chamfer settings to the command line
   */
  #notifySettings() {
    const trimMode = DesignCore.Scene.headers.trimMode;
    const chamferMode = DesignCore.Scene.headers.chamferMode;
    if (chamferMode) {
      const length = DesignCore.Scene.headers.chamferLength;
      const angle = DesignCore.Scene.headers.chamferAngle;
      DesignCore.Core.notify(`Current settings: Mode = ${trimMode ? 'TRIM' : 'NOTRIM'}, Method = ANGLE, Length = ${length}, Angle = ${angle}`);
    } else {
      const distA = DesignCore.Scene.headers.chamferDistanceA;
      const distB = DesignCore.Scene.headers.chamferDistanceB;
      DesignCore.Core.notify(`Current settings: Mode = ${trimMode ? 'TRIM' : 'NOTRIM'}, Method = DIST, Dist1 = ${distA}, Dist2 = ${distB}`);
    }
  }
}
