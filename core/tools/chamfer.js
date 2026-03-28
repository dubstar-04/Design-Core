import { Strings } from '../lib/strings.js';
import { ChamferFilletBase } from './chamferFilletBase.js';
import { Intersection } from '../lib/intersect.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { AddState, RemoveState, UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Chamfer Command Class
 * @extends ChamferFilletBase
 */
export class Chamfer extends ChamferFilletBase {
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
              DesignCore.Core.notify(Strings.Error.INVALIDNUMBER);
            } else {
              DesignCore.Scene.headers.chamferDistanceA = d1;
              const dop2 = new PromptOptions('Specify second chamfer distance', [Input.Type.NUMBER]);
              const d2 = await DesignCore.Scene.inputManager.requestInput(dop2);
              if (d2 === undefined) return;
              if (d2 < 0) {
                DesignCore.Core.notify(Strings.Error.INVALIDNUMBER);
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
              DesignCore.Core.notify(Strings.Error.INVALIDNUMBER);
            } else {
              DesignCore.Scene.headers.chamferDistanceA = len;
              const aop = new PromptOptions(Strings.Input.ANGLE, [Input.Type.NUMBER]);
              const ang = await DesignCore.Scene.inputManager.requestInput(aop);
              if (ang === undefined) return;
              if (ang < 0 || ang >= 180) {
                DesignCore.Core.notify(Strings.Error.INVALIDNUMBER);
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
          DesignCore.Core.notify(`${firstEntity.type} ${Strings.Message.NOCHAMFER}`);
          continue;
        }
        if (!this.firstPick.setPick(firstEntity, input1.selectedPoint, `${Strings.Strings.ARC} ${Strings.Message.NOCHAMFER}`)) continue;

        // Prompt for second object
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const input2 = await DesignCore.Scene.inputManager.requestInput(op2);
          if (input2 === undefined) return;

          const candidate = DesignCore.Scene.entities.get(input2.selectedItemIndex);
          DesignCore.Scene.selectionManager.removeLastSelection();
          if (!(candidate instanceof Line) && !(candidate instanceof BasePolyline)) {
            DesignCore.Core.notify(`${candidate.type} ${Strings.Message.NOCHAMFER}`);
            continue;
          }
          if (!this.secondPick.setPick(candidate, input2.selectedPoint, `${Strings.Strings.ARC} ${Strings.Message.NOCHAMFER}`)) continue;
          // If both selections are the same polyline, segments must be consecutive
          // or they must be the open-end segments of an open polyline.
          if (candidate === firstEntity && firstEntity instanceof BasePolyline) {
            const isConsecutive = firstEntity.areConsecutiveSegments(this.firstPick.segmentIndex, this.secondPick.segmentIndex);
            const lastIdx = firstEntity.points.length - 1;
            const isOpenEnds = !firstEntity.flags.hasFlag(1) &&
              ((this.firstPick.segmentIndex === 1 && this.secondPick.segmentIndex === lastIdx) ||
               (this.secondPick.segmentIndex === 1 && this.firstPick.segmentIndex === lastIdx));
            if (!isConsecutive && !isOpenEnds) {
              DesignCore.Core.notify(Strings.Message.NONCONSECUTIVESEGMENTS);
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
    // No preview
  }

  /**
   * Perform the chamfer
   */
  action() {
    if (!this.firstPick.entity || !this.secondPick.entity) return;
    if (!this.resolveCornerGeometry(Strings.Message.NOCHAMFER)) return;

    const trimMode = DesignCore.Scene.headers.trimMode;
    const chamferMode = DesignCore.Scene.headers.chamferMode;
    const distA = DesignCore.Scene.headers.chamferDistanceA;

    // distA = distB = 0: trim/extend both lines to the sharp intersection with no chamfer line
    if (!chamferMode && distA === 0 && DesignCore.Scene.headers.chamferDistanceB === 0) {
      if (trimMode) {
        const stateChanges = this.applySharpTrim();
        DesignCore.Scene.commit(stateChanges);
      }
      return;
    }

    // Compute the two chamfer endpoints on each line
    const firstUnit = this.firstPick.clickUnit(this.intersectionPoint);
    const secondUnit = this.secondPick.clickUnit(this.intersectionPoint);
    let firstChamferPoint;
    let secondChamferPoint;

    if (!chamferMode) {
      // Distance method: measure distA along line1 and distB along line2 from intersection
      const distB = DesignCore.Scene.headers.chamferDistanceB;
      firstChamferPoint = this.intersectionPoint.add(firstUnit.scale(distA));
      secondChamferPoint = this.intersectionPoint.add(secondUnit.scale(distB));
    } else {
      // Angle method: measure distA along line1, then project using chamferAngle to find
      // where the chamfer line meets line2.
      // chamferAngle is stored in degrees (as entered by the user).
      const alpha = DesignCore.Scene.headers.chamferAngle * (Math.PI / 180);

      if (alpha <= 0 || alpha >= Math.PI) {
        DesignCore.Core.notify(Strings.Error.INVALIDNUMBER);
        return;
      }

      firstChamferPoint = this.intersectionPoint.add(firstUnit.scale(distA));

      // Rotate firstUnit by ±(π - alpha) to get the chamfer direction from
      // firstChamferPoint. Choose the rotation that points toward line2 (positive
      // dot product with secondUnit).
      const rotAngle = Math.PI - alpha;
      const origin = new Point(0, 0);
      const candidate1 = firstUnit.rotate(origin, rotAngle);
      const chamferDir = candidate1.dot(secondUnit) >= 0 ? candidate1 : firstUnit.rotate(origin, -rotAngle);

      // Intersect chamfer ray from firstChamferPoint with the infinite line2
      secondChamferPoint = Intersection.intersectRayRay(
          firstChamferPoint, firstChamferPoint.add(chamferDir),
          this.secondPick.lineStart, this.secondPick.lineEnd,
      );
      if (!secondChamferPoint) {
        // Chamfer direction is parallel to line2 — no intersection
        DesignCore.Core.notify(Strings.Error.PARALLELLINES);
        return;
      }
    }

    // Verify both chamfer endpoints lie on the correct side of the intersection and
    // not beyond the kept endpoints.  Uses the same dot-product approach as Fillet so
    // that segments are treated as infinite lines (extensions are allowed).
    if (trimMode) {
      const firstKeptDir = this.firstPick.lineKeptEnd(this.intersectionPoint).subtract(this.intersectionPoint);
      const secondKeptDir = this.secondPick.lineKeptEnd(this.intersectionPoint).subtract(this.intersectionPoint);
      const firstChamferDot = firstChamferPoint.subtract(this.intersectionPoint).dot(firstKeptDir);
      const secondChamferDot = secondChamferPoint.subtract(this.intersectionPoint).dot(secondKeptDir);
      if (firstChamferDot < 0 || firstChamferDot > firstKeptDir.dot(firstKeptDir) ||
          secondChamferDot < 0 || secondChamferDot > secondKeptDir.dot(secondKeptDir)) {
        DesignCore.Core.notify(Strings.Error.DISTANCETOOLARGE);
        return;
      }
    }

    const chamferLine = DesignCore.CommandManager.createNew('Line', {
      points: [firstChamferPoint, secondChamferPoint],
    });

    const firstIsPolyline = this.firstPick.entity instanceof BasePolyline;
    const secondIsPolyline = this.secondPick.entity instanceof BasePolyline;

    // The standalone chamfer Line entity is added when no polyline trimming is involved.
    // For polyline trim cases the chamfer segment is encoded as a straight polyline segment,
    // except for the open-ends case where the chamfer line fills the gap between the two
    // open ends and is added separately there.
    const stateChanges = (!trimMode || (!firstIsPolyline && !secondIsPolyline)) ?
      [new AddState(chamferLine)] :
      [];

    if (trimMode) {
      if (!firstIsPolyline && !secondIsPolyline) {
        // Line + Line: trim both lines
        stateChanges.push(new UpdateState(this.firstPick.entity, { points: [this.firstPick.lineKeptEnd(this.intersectionPoint), firstChamferPoint] }));
        stateChanges.push(new UpdateState(this.secondPick.entity, { points: [this.secondPick.lineKeptEnd(this.intersectionPoint), secondChamferPoint] }));
      } else if (firstIsPolyline && secondIsPolyline && this.firstPick.entity === this.secondPick.entity) {
        const closeSegIdx = this.firstPick.entity.points.length;
        const lastIdx = closeSegIdx - 1;
        const segDiff = Math.abs(this.firstPick.segmentIndex - this.secondPick.segmentIndex);
        const isOpenEnds = !this.firstPick.entity.flags.hasFlag(1) && segDiff !== 1 && (
          (this.firstPick.segmentIndex === 1 && this.secondPick.segmentIndex === lastIdx) ||
          (this.firstPick.segmentIndex === lastIdx && this.secondPick.segmentIndex === 1)
        );
        const newPoints = this.firstPick.entity.points.map((p) => p.clone());
        if (isOpenEnds) {
          // Open ends: trim both endpoints to their chamfer points; chamfer line fills the gap.
          stateChanges.push(new AddState(chamferLine));
          if (this.firstPick.segmentIndex === 1) {
            newPoints[0] = firstChamferPoint.clone();
            newPoints[lastIdx] = secondChamferPoint.clone();
          } else {
            newPoints[0] = secondChamferPoint.clone();
            newPoints[lastIdx] = firstChamferPoint.clone();
          }
        } else {
          // Consecutive segments: replace the shared corner vertex with the two chamfer points
          // as a straight polyline segment — no separate chamfer Line entity needed.
          const seg1 = this.firstPick.segmentIndex;
          const seg2 = this.secondPick.segmentIndex;
          const isClosingWrap = (seg1 === closeSegIdx && seg2 === 1) || (seg2 === closeSegIdx && seg1 === 1);
          const isFirstLower = seg1 < seg2;
          const cornerIdx = isClosingWrap ? 0 : Math.min(seg1, seg2);
          const lowerChamfer = (isClosingWrap ? seg1 === closeSegIdx : !isFirstLower) ? secondChamferPoint : firstChamferPoint;
          const upperChamfer = (isClosingWrap ? seg1 === closeSegIdx : !isFirstLower) ? firstChamferPoint : secondChamferPoint;
          newPoints.splice(cornerIdx, 1, lowerChamfer.clone(), upperChamfer.clone());
        }
        stateChanges.push(new UpdateState(this.firstPick.entity, { points: newPoints }));
      } else {
        // Line + Polyline or Polyline + Line: consume the line into the polyline.
        const [poly, line] = firstIsPolyline ? [this.firstPick, this.secondPick] : [this.secondPick, this.firstPick];
        const polyChamferPoint = poly === this.firstPick ? firstChamferPoint : secondChamferPoint;
        const lineChamferPoint = line === this.firstPick ? firstChamferPoint : secondChamferPoint;
        const polySegIdx = poly.segmentIndex;
        const keepStart = poly.keepStart(this.intersectionPoint);
        let newPoints;
        if (keepStart) {
          // Keep start portion: points[0..polySegIdx-1], then chamfer, then line end
          newPoints = [
            ...poly.entity.points.slice(0, polySegIdx).map((p) => p.clone()),
            polyChamferPoint.clone(),
            lineChamferPoint.clone(),
            line.lineKeptEnd(this.intersectionPoint).clone(),
          ];
        } else {
          // Keep end portion: line end, then chamfer, then points[polySegIdx..end]
          newPoints = [
            line.lineKeptEnd(this.intersectionPoint).clone(),
            lineChamferPoint.clone(),
            polyChamferPoint.clone(),
            ...poly.entity.points.slice(polySegIdx).map((p) => p.clone()),
          ];
        }

        stateChanges.push(new RemoveState(line.entity));
        stateChanges.push(new UpdateState(poly.entity, { points: newPoints }));
      }
    }

    DesignCore.Scene.commit(stateChanges);
  }

  /**
   * Display the current chamfer settings to the command line
   */
  #notifySettings() {
    const trimMode = DesignCore.Scene.headers.trimMode;
    const chamferMode = DesignCore.Scene.headers.chamferMode;
    if (chamferMode) {
      const distA = DesignCore.Scene.headers.chamferDistanceA;
      const angle = DesignCore.Scene.headers.chamferAngle;
      DesignCore.Core.notify(`Current settings: Mode = ${trimMode ? 'TRIM' : 'NOTRIM'}, Method = ANGLE, Length = ${distA}, Angle = ${angle}`);
    } else {
      const distA = DesignCore.Scene.headers.chamferDistanceA;
      const distB = DesignCore.Scene.headers.chamferDistanceB;
      DesignCore.Core.notify(`Current settings: Mode = ${trimMode ? 'TRIM' : 'NOTRIM'}, Method = DIST, Dist1 = ${distA}, Dist2 = ${distB}`);
    }
  }
}
