import { Strings } from '../lib/strings.js';
import { ChamferFilletBase } from './chamferFilletBase.js';
import { CornerEntity } from './cornerEntity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Constants } from '../lib/constants.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { AddState, RemoveState, UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Fillet Command Class
 * @extends ChamferFilletBase
 */
export class Fillet extends ChamferFilletBase {
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
          DesignCore.Core.notify(`${firstEntity.type} ${Strings.Message.NOFILLET}`);
          continue;
        }
        this.firstPick.entity = firstEntity;
        this.firstPick.clickPoint = input1.selectedPoint;
        if (!this.firstPick.resolveSegment(`${Strings.Strings.ARC} ${Strings.Message.NOFILLET}`)) continue;

        // Prompt for second object
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const input2 = await DesignCore.Scene.inputManager.requestInput(op2);
          if (input2 === undefined) return;

          const candidate = DesignCore.Scene.entities.get(input2.selectedItemIndex);
          DesignCore.Scene.selectionManager.removeLastSelection();
          if (!(candidate instanceof Line) && !(candidate instanceof BasePolyline)) {
            DesignCore.Core.notify(`${candidate.type} ${Strings.Message.NOFILLET}`);
            continue;
          }
          const secondCorner = new CornerEntity();
          secondCorner.entity = candidate;
          secondCorner.clickPoint = input2.selectedPoint;
          if (!secondCorner.resolveSegment(`${Strings.Strings.ARC} ${Strings.Message.NOFILLET}`)) continue;
          // If both selections are the same polyline, segments must be consecutive
          // or they must be the open-end segments of an open polyline.
          if (candidate === firstEntity && firstEntity instanceof BasePolyline) {
            const isConsecutive = firstEntity.areConsecutiveSegments(this.firstPick.segmentIndex, secondCorner.segmentIndex);
            const lastIdx = firstEntity.points.length - 1;
            const isOpenEnds = !firstEntity.flags.hasFlag(1) &&
              ((this.firstPick.segmentIndex === 1 && secondCorner.segmentIndex === lastIdx) ||
               (secondCorner.segmentIndex === 1 && this.firstPick.segmentIndex === lastIdx));
            if (!isConsecutive && !isOpenEnds) {
              DesignCore.Core.notify(Strings.Message.NONCONSECUTIVESEGMENTS);
              continue;
            }
          }
          this.secondPick.entity = candidate;
          this.secondPick.clickPoint = input2.selectedPoint;
          this.secondPick.segment = secondCorner.segment;
          this.secondPick.segmentIndex = secondCorner.segmentIndex;
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
    // No preview
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
    if (filletRadius === 0) {
      if (trimMode) {
        const stateChanges = this.applySharpTrim();
        DesignCore.Scene.commit(stateChanges);
      }
      return;
    }

    // Angle between the two clicked-side direction vectors (i.e. the opening angle of the chosen corner)
    const firstUnit = this.firstPick.clickUnit(this.intersectionPoint);
    const secondUnit = this.secondPick.clickUnit(this.intersectionPoint);
    const cosAngle = Math.min(1, Math.max(-1, firstUnit.dot(secondUnit)));
    const cornerAngle = Math.acos(cosAngle);

    // Collinear or antiparallel lines cannot be filleted
    if (cornerAngle < Constants.Tolerance.EPSILON || cornerAngle > Math.PI - Constants.Tolerance.EPSILON) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return;
    }

    // Bisector unit vector: points into the chosen corner toward the fillet centre
    const bisectorUnit = firstUnit.add(secondUnit).normalise();

    // Distance from the intersection point to the fillet centre along the bisector
    const intersectToCentreDistance = filletRadius / Math.sin(cornerAngle / 2);

    // Fillet arc centre point
    const arcCentre = this.intersectionPoint.add(bisectorUnit.scale(intersectToCentreDistance));

    // Tangent points where the fillet arc meets each line (foot of perpendicular from centre to line)
    const firstTangentPoint = arcCentre.perpendicular(this.firstPick.lineStart, this.firstPick.lineEnd);
    const secondTangentPoint = arcCentre.perpendicular(this.secondPick.lineStart, this.secondPick.lineEnd);

    // Verify the tangent points are reachable — same direction as the kept end from the
    // intersection and not farther than the kept end (which would flip the line direction).
    if (trimMode) {
      const firstKeptDir = this.firstPick.lineKeptEnd(this.intersectionPoint).subtract(this.intersectionPoint);
      const secondKeptDir = this.secondPick.lineKeptEnd(this.intersectionPoint).subtract(this.intersectionPoint);
      const firstTangentDot = firstTangentPoint.subtract(this.intersectionPoint).dot(firstKeptDir);
      const secondTangentDot = secondTangentPoint.subtract(this.intersectionPoint).dot(secondKeptDir);
      if (firstTangentDot < 0 || firstTangentDot > firstKeptDir.dot(firstKeptDir) ||
          secondTangentDot < 0 || secondTangentDot > secondKeptDir.dot(secondKeptDir)) {
        DesignCore.Core.notify(`${this.type}: ${Strings.Error.RADIUSTOOLARGE}`);
        return;
      }
    }

    // Determine arc winding direction: if the cross product of the two centre-to-tangent
    // vectors is positive, the short arc from firstTangentPoint to secondTangentPoint
    // travels CCW (direction = 1), otherwise CW (direction = -1).
    const centreToFirst = firstTangentPoint.subtract(arcCentre);
    const centreToSecond = secondTangentPoint.subtract(arcCentre);
    const windingCross = centreToFirst.cross(centreToSecond);
    const arcDirection = windingCross > 0 ? 1 : -1;

    const arc = DesignCore.CommandManager.createNew('Arc', {
      points: [arcCentre, firstTangentPoint, secondTangentPoint],
      direction: arcDirection,
    });

    const firstIsPolyline = this.firstPick.entity instanceof BasePolyline;
    const secondIsPolyline = this.secondPick.entity instanceof BasePolyline;

    if (!trimMode) {
      DesignCore.Scene.commit([new AddState(arc)]);
      return;
    }

    if (!firstIsPolyline && !secondIsPolyline) {
      const stateChanges = this.#trimLineAndLine(firstTangentPoint, secondTangentPoint, arc);
      DesignCore.Scene.commit(stateChanges);
    } else if (firstIsPolyline && secondIsPolyline && this.firstPick.entity === this.secondPick.entity) {
      const stateChanges = this.#trimPolyAndPoly(firstTangentPoint, secondTangentPoint, arcDirection, arcCentre, arc);
      DesignCore.Scene.commit(stateChanges);
    } else {
      const stateChanges = this.#trimLineAndPoly(firstTangentPoint, secondTangentPoint, arcDirection, arcCentre);
      DesignCore.Scene.commit(stateChanges);
    }
  }

  /**
   * Apply trim and arc for a Line + Line fillet.
   * @param {Point} firstTangentPoint
   * @param {Point} secondTangentPoint
   * @param {Arc} arc
   * @return {Array}
   */
  #trimLineAndLine(firstTangentPoint, secondTangentPoint, arc) {
    return [
      new AddState(arc),
      new UpdateState(this.firstPick.entity, { points: [this.firstPick.lineKeptEnd(this.intersectionPoint), firstTangentPoint] }),
      new UpdateState(this.secondPick.entity, { points: [this.secondPick.lineKeptEnd(this.intersectionPoint), secondTangentPoint] }),
    ];
  }

  /**
   * Apply trim and arc for a Polyline + Polyline (same entity) fillet.
   * Handles both the open-ends case and the consecutive-segments case.
   * @param {Point} firstTangentPoint
   * @param {Point} secondTangentPoint
   * @param {number} arcDirection
   * @param {Point} arcCentre
   * @param {Arc} arc
   * @return {Array}
   */
  #trimPolyAndPoly(firstTangentPoint, secondTangentPoint, arcDirection, arcCentre, arc) {
    const closeSegIdx = this.firstPick.entity.points.length;
    const lastIdx = closeSegIdx - 1;
    const segDiff = Math.abs(this.firstPick.segmentIndex - this.secondPick.segmentIndex);
    const isOpenEnds = !this.firstPick.entity.flags.hasFlag(1) && segDiff !== 1 && (
      (this.firstPick.segmentIndex === 1 && this.secondPick.segmentIndex === lastIdx) ||
      (this.firstPick.segmentIndex === lastIdx && this.secondPick.segmentIndex === 1)
    );
    const newPoints = this.firstPick.entity.points.map((p) => p.clone());
    const stateChanges = [];

    if (isOpenEnds) {
      stateChanges.push(new AddState(arc));
      if (this.firstPick.segmentIndex === 1) {
        newPoints[0] = firstTangentPoint.clone();
        newPoints[lastIdx] = secondTangentPoint.clone();
      } else {
        newPoints[0] = secondTangentPoint.clone();
        newPoints[lastIdx] = firstTangentPoint.clone();
      }
    } else {
      const seg1 = this.firstPick.segmentIndex;
      const seg2 = this.secondPick.segmentIndex;
      const isClosingWrap = (seg1 === closeSegIdx && seg2 === 1) || (seg2 === closeSegIdx && seg1 === 1);
      const isFirstLower = seg1 < seg2;
      const cornerIdx = isClosingWrap ? 0 : Math.min(seg1, seg2);
      const lowerTangent = (isClosingWrap ? seg1 === closeSegIdx : !isFirstLower) ? secondTangentPoint : firstTangentPoint;
      const upperTangent = (isClosingWrap ? seg1 === closeSegIdx : !isFirstLower) ? firstTangentPoint : secondTangentPoint;
      const polyArcDir = (isClosingWrap ? seg1 === closeSegIdx : !isFirstLower) ? -arcDirection : arcDirection;
      const startAngle = arcCentre.angle(lowerTangent);
      const endAngle = arcCentre.angle(upperTangent);
      const includedAngle = ((endAngle - startAngle) * polyArcDir + 4 * Math.PI) % (2 * Math.PI);
      const bulge = polyArcDir * Math.tan(includedAngle / 4);
      const arcStartPoint = lowerTangent.clone();
      arcStartPoint.bulge = bulge;
      newPoints.splice(cornerIdx, 1, arcStartPoint, upperTangent.clone());
    }

    stateChanges.push(new UpdateState(this.firstPick.entity, { points: newPoints }));
    return stateChanges;
  }

  /**
   * Apply trim and arc for a Line + Polyline (or Polyline + Line) fillet.
   * The line is consumed into the polyline with the arc encoded as a bulge.
   * @param {Point} firstTangentPoint
   * @param {Point} secondTangentPoint
   * @param {number} arcDirection
   * @param {Point} arcCentre
   * @return {Array}
   */
  #trimLineAndPoly(firstTangentPoint, secondTangentPoint, arcDirection, arcCentre) {
    const firstIsPolyline = this.firstPick.entity instanceof BasePolyline;
    const [poly, line] = firstIsPolyline ? [this.firstPick, this.secondPick] : [this.secondPick, this.firstPick];
    const lineTangentPoint = line === this.firstPick ? firstTangentPoint : secondTangentPoint;
    const polyTangentPoint = poly === this.firstPick ? firstTangentPoint : secondTangentPoint;
    const polyToLineDir = firstIsPolyline ? arcDirection : -arcDirection;

    const startAngle = arcCentre.angle(polyTangentPoint);
    const endAngle = arcCentre.angle(lineTangentPoint);
    const includedAngle = ((endAngle - startAngle) * polyToLineDir + 4 * Math.PI) % (2 * Math.PI);
    const bulge = polyToLineDir * Math.tan(includedAngle / 4);
    const arcStartPoint = polyTangentPoint.clone();
    arcStartPoint.bulge = bulge;

    const polySegIdx = poly.segmentIndex;
    const keepStart = poly.keepStart(this.intersectionPoint);
    let newPoints;
    if (keepStart) {
      // Keep the polyline points up to (not including) the selected segment start,
      // then the arc start (with bulge), the line tangent point, and the kept end of the line.
      newPoints = [
        ...poly.entity.points.slice(0, polySegIdx).map((p) => p.clone()),
        arcStartPoint,
        lineTangentPoint.clone(),
        line.lineKeptEnd(this.intersectionPoint).clone(),
      ];
    } else {
      // Keep the polyline points from the selected segment start onwards,
      // prepending the kept end of the line, the reversed arc start (with negated bulge), and the poly tangent point.
      const revArcStartPoint = lineTangentPoint.clone();
      revArcStartPoint.bulge = -bulge;
      newPoints = [
        line.lineKeptEnd(this.intersectionPoint).clone(),
        revArcStartPoint,
        polyTangentPoint.clone(),
        ...poly.entity.points.slice(polySegIdx).map((p) => p.clone()),
      ];
    }

    return [
      new RemoveState(line.entity),
      new UpdateState(poly.entity, { points: newPoints }),
    ];
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
