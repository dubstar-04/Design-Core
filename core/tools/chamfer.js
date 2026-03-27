import { Strings } from '../lib/strings.js';
import { ChamferFilletBase } from './chamferFilletBase.js';
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
        const firstResolved = this.resolveSegment(firstEntity, input1.selectedPoint, `${Strings.Strings.ARC} ${Strings.Message.NOCHAMFER}`);
        if (!firstResolved) continue;
        this.firstEntity = firstEntity;
        this.firstSegment = firstResolved.segment;
        this.firstSegmentIndex = firstResolved.index;
        this.firstClickPoint = input1.selectedPoint;

        // Prompt for second object
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        let secondEntity;
        let secondSegment;
        let secondSegmentIndex = null;
        while (true) {
          const input2 = await DesignCore.Scene.inputManager.requestInput(op2);
          if (input2 === undefined) return;

          const candidate = DesignCore.Scene.entities.get(input2.selectedItemIndex);
          DesignCore.Scene.selectionManager.removeLastSelection();
          if (!(candidate instanceof Line) && !(candidate instanceof BasePolyline)) {
            DesignCore.Core.notify(`${candidate.type} ${Strings.Message.NOCHAMFER}`);
            continue;
          }
          const candidateResolved = this.resolveSegment(candidate, input2.selectedPoint, `${Strings.Strings.ARC} ${Strings.Message.NOCHAMFER}`);
          if (!candidateResolved) continue;
          const { segment: candidateSegment, index: candidateSegmentIndex } = candidateResolved;
          // If both selections are the same polyline, segments must be consecutive
          // or they must be the open-end segments of an open polyline.
          if (candidate === firstEntity && firstEntity instanceof BasePolyline) {
            const isConsecutive = firstEntity.areConsecutiveSegments(this.firstSegmentIndex, candidateSegmentIndex);
            const lastIdx = firstEntity.points.length - 1;
            const isOpenEnds = !firstEntity.flags.hasFlag(1) &&
              ((this.firstSegmentIndex === 1 && candidateSegmentIndex === lastIdx) ||
               (candidateSegmentIndex === 1 && this.firstSegmentIndex === lastIdx));
            if (!isConsecutive && !isOpenEnds) {
              DesignCore.Core.notify(Strings.Message.NONCONSECUTIVESEGMENTS);
              continue;
            }
          }
          secondEntity = candidate;
          secondSegment = candidateSegment;
          secondSegmentIndex = candidateSegmentIndex;
          this.secondClickPoint = input2.selectedPoint;
          break;
        }
        this.secondEntity = secondEntity;
        this.secondSegment = secondSegment;
        this.secondSegmentIndex = secondSegmentIndex;

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
    if (!this.firstEntity || !this.secondEntity) return;
    if (!this.resolveCornerGeometry(Strings.Message.NOCHAMFER)) return;

    const {
      secondLineStart, secondLineDirection,
      intersectionPoint, firstClickDir, secondClickDir,
      firstClickDistance, secondClickDistance,
      firstLineKeptEnd, secondLineKeptEnd,
    } = this;

    if (firstClickDistance < 1e-10 || secondClickDistance < 1e-10) {
      DesignCore.Core.notify(`Selected corner ${Strings.Message.NOCHAMFER}`);
      return;
    }
    const firstClickUnit = new Point(firstClickDir.x / firstClickDistance, firstClickDir.y / firstClickDistance);
    const secondClickUnit = new Point(secondClickDir.x / secondClickDistance, secondClickDir.y / secondClickDistance);

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
    let firstChamferPoint;
    let secondChamferPoint;

    if (!chamferMode) {
      // Distance method: measure distA along line1 and distB along line2 from intersection
      const distB = DesignCore.Scene.headers.chamferDistanceB;
      firstChamferPoint = new Point(
          intersectionPoint.x + firstClickUnit.x * distA,
          intersectionPoint.y + firstClickUnit.y * distA,
      );
      secondChamferPoint = new Point(
          intersectionPoint.x + secondClickUnit.x * distB,
          intersectionPoint.y + secondClickUnit.y * distB,
      );
    } else {
      // Angle method: measure distA along line1, then project using chamferAngle to find
      // where the chamfer line meets line2.
      // chamferAngle is stored in degrees (as entered by the user).
      const alpha = DesignCore.Scene.headers.chamferAngle * (Math.PI / 180);

      if (alpha <= 0 || alpha >= Math.PI) {
        DesignCore.Core.notify(Strings.Error.INVALIDNUMBER);
        return;
      }

      firstChamferPoint = new Point(
          intersectionPoint.x + firstClickUnit.x * distA,
          intersectionPoint.y + firstClickUnit.y * distA,
      );

      // Rotate firstClickUnit by ±(π - alpha) to get the chamfer direction from
      // firstChamferPoint. Choose the rotation that points toward line2 (positive
      // dot product with secondClickUnit).
      const rotAngle = Math.PI - alpha;
      const candidate1 = new Point(
          firstClickUnit.x * Math.cos(rotAngle) - firstClickUnit.y * Math.sin(rotAngle),
          firstClickUnit.x * Math.sin(rotAngle) + firstClickUnit.y * Math.cos(rotAngle),
      );
      const chamferDir = candidate1.dot(secondClickUnit) >= 0 ? candidate1 : new Point(
          firstClickUnit.x * Math.cos(-rotAngle) - firstClickUnit.y * Math.sin(-rotAngle),
          firstClickUnit.x * Math.sin(-rotAngle) + firstClickUnit.y * Math.cos(-rotAngle),
      );

      // Intersect chamfer ray from firstChamferPoint with the infinite line2
      const chamferCross = chamferDir.cross(secondLineDirection);
      if (Math.abs(chamferCross) < 1e-10) {
        // Chamfer direction is parallel to line2 — no intersection
        DesignCore.Core.notify(Strings.Error.PARALLELLINES);
        return;
      }
      const diff = secondLineStart.subtract(firstChamferPoint);
      const t = diff.cross(secondLineDirection) / chamferCross;
      secondChamferPoint = new Point(
          firstChamferPoint.x + chamferDir.x * t,
          firstChamferPoint.y + chamferDir.y * t,
      );
    }

    // Verify both chamfer endpoints lie on the correct side of the intersection and
    // not beyond the kept endpoints.  Uses the same dot-product approach as Fillet so
    // that segments are treated as infinite lines (extensions are allowed).
    if (trimMode) {
      const firstKeptDir = firstLineKeptEnd.subtract(intersectionPoint);
      const secondKeptDir = secondLineKeptEnd.subtract(intersectionPoint);
      const firstChamferDot = firstChamferPoint.subtract(intersectionPoint).dot(firstKeptDir);
      const secondChamferDot = secondChamferPoint.subtract(intersectionPoint).dot(secondKeptDir);
      if (firstChamferDot < 0 || firstChamferDot > firstKeptDir.dot(firstKeptDir) ||
          secondChamferDot < 0 || secondChamferDot > secondKeptDir.dot(secondKeptDir)) {
        DesignCore.Core.notify(Strings.Error.DISTANCETOOLARGE);
        return;
      }
    }

    const chamferLine = DesignCore.CommandManager.createNew('Line', {
      points: [firstChamferPoint, secondChamferPoint],
    });

    const firstIsPolyline = this.firstEntity instanceof BasePolyline;
    const secondIsPolyline = this.secondEntity instanceof BasePolyline;

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
        stateChanges.push(new UpdateState(this.firstEntity, { points: [firstLineKeptEnd, firstChamferPoint] }));
        stateChanges.push(new UpdateState(this.secondEntity, { points: [secondLineKeptEnd, secondChamferPoint] }));
      } else if (firstIsPolyline && secondIsPolyline && this.firstEntity === this.secondEntity) {
        const lastIdx = this.firstEntity.points.length - 1;
        const segDiff = Math.abs(this.firstSegmentIndex - this.secondSegmentIndex);
        const isOpenEnds = segDiff !== 1 && (
          (this.firstSegmentIndex === 1 && this.secondSegmentIndex === lastIdx) ||
          (this.firstSegmentIndex === lastIdx && this.secondSegmentIndex === 1)
        );
        const newPoints = this.firstEntity.points.map((p) => p.clone());
        if (isOpenEnds) {
          // Open ends: trim both endpoints to their chamfer points; chamfer line fills the gap.
          stateChanges.push(new AddState(chamferLine));
          if (this.firstSegmentIndex === 1) {
            newPoints[0] = firstChamferPoint.clone();
            newPoints[lastIdx] = secondChamferPoint.clone();
          } else {
            newPoints[0] = secondChamferPoint.clone();
            newPoints[lastIdx] = firstChamferPoint.clone();
          }
        } else {
          // Consecutive segments: replace the shared corner vertex with the two chamfer points
          // as a straight polyline segment — no separate chamfer Line entity needed.
          const isFirstLower = this.firstSegmentIndex < this.secondSegmentIndex;
          const cornerIdx = Math.min(this.firstSegmentIndex, this.secondSegmentIndex);
          const lowerChamfer = isFirstLower ? firstChamferPoint : secondChamferPoint;
          const upperChamfer = isFirstLower ? secondChamferPoint : firstChamferPoint;
          newPoints.splice(cornerIdx, 1, lowerChamfer.clone(), upperChamfer.clone());
        }
        stateChanges.push(new UpdateState(this.firstEntity, { points: newPoints }));
      } else {
        // Line + Polyline or Polyline + Line: consume the line into the polyline.
        // The chamfer segment is encoded as a straight polyline segment — no separate Line entity.
        const lineEntity = !firstIsPolyline ? this.firstEntity : this.secondEntity;
        const polyEntity = firstIsPolyline ? this.firstEntity : this.secondEntity;
        const polyChamferPoint = firstIsPolyline ? firstChamferPoint : secondChamferPoint;
        const lineChamferPoint = !firstIsPolyline ? firstChamferPoint : secondChamferPoint;
        const lineKeptEnd = !firstIsPolyline ? firstLineKeptEnd : secondLineKeptEnd;
        const polySegIdx = firstIsPolyline ? this.firstSegmentIndex : this.secondSegmentIndex;

        // Trim away all points beyond the connecting end — same as the trim command.
        const polyClickDir = firstIsPolyline ? firstClickDir : secondClickDir;
        const segStart = polyEntity.points[polySegIdx - 1];
        const segEnd = polyEntity.points[polySegIdx];
        const keepStart = polyClickDir.dot(segStart.subtract(intersectionPoint)) >= polyClickDir.dot(segEnd.subtract(intersectionPoint));
        let newPoints;
        if (keepStart) {
          // Keep start portion: points[0..polySegIdx-1], then chamfer, then line end
          newPoints = [
            ...polyEntity.points.slice(0, polySegIdx).map((p) => p.clone()),
            polyChamferPoint.clone(),
            lineChamferPoint.clone(),
            lineKeptEnd.clone(),
          ];
        } else {
          // Keep end portion: line end, then chamfer, then points[polySegIdx..end]
          newPoints = [
            lineKeptEnd.clone(),
            lineChamferPoint.clone(),
            polyChamferPoint.clone(),
            ...polyEntity.points.slice(polySegIdx).map((p) => p.clone()),
          ];
        }

        stateChanges.push(new RemoveState(lineEntity));
        stateChanges.push(new UpdateState(polyEntity, { points: newPoints }));
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
