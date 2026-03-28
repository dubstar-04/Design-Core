import { Strings } from '../lib/strings.js';
import { ChamferFilletBase } from './chamferFilletBase.js';
import { CornerEntity } from './cornerEntity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
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
        this.first.entity = firstEntity;
        this.first.clickPoint = input1.selectedPoint;
        if (!this.first.resolveSegment(`${Strings.Strings.ARC} ${Strings.Message.NOFILLET}`)) continue;

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
            const isConsecutive = firstEntity.areConsecutiveSegments(this.first.segmentIndex, secondCorner.segmentIndex);
            const lastIdx = firstEntity.points.length - 1;
            const isOpenEnds = !firstEntity.flags.hasFlag(1) &&
              ((this.first.segmentIndex === 1 && secondCorner.segmentIndex === lastIdx) ||
               (secondCorner.segmentIndex === 1 && this.first.segmentIndex === lastIdx));
            if (!isConsecutive && !isOpenEnds) {
              DesignCore.Core.notify(Strings.Message.NONCONSECUTIVESEGMENTS);
              continue;
            }
          }
          this.second.entity = candidate;
          this.second.clickPoint = input2.selectedPoint;
          this.second.segment = secondCorner.segment;
          this.second.segmentIndex = secondCorner.segmentIndex;
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
    if (!this.first.entity || !this.second.entity) return;
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
    const cosAngle = Math.min(1, Math.max(-1, this.first.clickUnit.dot(this.second.clickUnit)));
    const cornerAngle = Math.acos(cosAngle);

    // Collinear or antiparallel lines cannot be filleted
    if (cornerAngle < 1e-10 || cornerAngle > Math.PI - 1e-10) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return;
    }

    // Bisector unit vector: points into the chosen corner toward the fillet centre
    const bisectorSum = this.first.clickUnit.add(this.second.clickUnit);
    const bisectorLength = Math.sqrt(bisectorSum.x ** 2 + bisectorSum.y ** 2);
    const bisectorUnit = new Point(bisectorSum.x / bisectorLength, bisectorSum.y / bisectorLength);

    // Distance from the intersection point to the fillet centre along the bisector
    const intersectToCentreDistance = filletRadius / Math.sin(cornerAngle / 2);

    // Fillet arc centre point
    const arcCentre = new Point(
        this.intersectionPoint.x + bisectorUnit.x * intersectToCentreDistance,
        this.intersectionPoint.y + bisectorUnit.y * intersectToCentreDistance,
    );

    // Tangent points where the fillet arc meets each line (foot of perpendicular from centre to line)
    const firstTangentPoint = arcCentre.perpendicular(this.first.lineStart, this.first.lineEnd);
    const secondTangentPoint = arcCentre.perpendicular(this.second.lineStart, this.second.lineEnd);

    // Verify the tangent points are reachable — same direction as the kept end from the
    // intersection and not farther than the kept end (which would flip the line direction).
    if (trimMode) {
      const firstKeptDir = this.first.lineKeptEnd.subtract(this.intersectionPoint);
      const secondKeptDir = this.second.lineKeptEnd.subtract(this.intersectionPoint);
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

    const firstIsPolyline = this.first.entity instanceof BasePolyline;
    const secondIsPolyline = this.second.entity instanceof BasePolyline;

    if (!trimMode) {
      DesignCore.Scene.commit([new AddState(arc)]);
      return;
    }

    if (!firstIsPolyline && !secondIsPolyline) {
      const stateChanges = this.#trimLineAndLine(firstTangentPoint, secondTangentPoint, arc);
      DesignCore.Scene.commit(stateChanges);
    } else if (firstIsPolyline && secondIsPolyline && this.first.entity === this.second.entity) {
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
      new UpdateState(this.first.entity, { points: [this.first.lineKeptEnd, firstTangentPoint] }),
      new UpdateState(this.second.entity, { points: [this.second.lineKeptEnd, secondTangentPoint] }),
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
    const lastIdx = this.first.entity.points.length - 1;
    const segDiff = Math.abs(this.first.segmentIndex - this.second.segmentIndex);
    const isOpenEnds = segDiff !== 1 && (
      (this.first.segmentIndex === 1 && this.second.segmentIndex === lastIdx) ||
      (this.first.segmentIndex === lastIdx && this.second.segmentIndex === 1)
    );
    const newPoints = this.first.entity.points.map((p) => p.clone());
    const stateChanges = [];

    if (isOpenEnds) {
      stateChanges.push(new AddState(arc));
      if (this.first.segmentIndex === 1) {
        newPoints[0] = firstTangentPoint.clone();
        newPoints[lastIdx] = secondTangentPoint.clone();
      } else {
        newPoints[0] = secondTangentPoint.clone();
        newPoints[lastIdx] = firstTangentPoint.clone();
      }
    } else {
      const isFirstLower = this.first.segmentIndex < this.second.segmentIndex;
      const cornerIdx = Math.min(this.first.segmentIndex, this.second.segmentIndex);
      const lowerTangent = isFirstLower ? firstTangentPoint : secondTangentPoint;
      const upperTangent = isFirstLower ? secondTangentPoint : firstTangentPoint;
      const polyArcDir = isFirstLower ? arcDirection : -arcDirection;
      const startAngle = arcCentre.angle(lowerTangent);
      const endAngle = arcCentre.angle(upperTangent);
      const includedAngle = ((endAngle - startAngle) * polyArcDir + 4 * Math.PI) % (2 * Math.PI);
      const bulge = polyArcDir * Math.tan(includedAngle / 4);
      const arcStartPoint = lowerTangent.clone();
      arcStartPoint.bulge = bulge;
      newPoints.splice(cornerIdx, 1, arcStartPoint, upperTangent.clone());
    }

    stateChanges.push(new UpdateState(this.first.entity, { points: newPoints }));
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
    const firstIsPolyline = this.first.entity instanceof BasePolyline;
    const [poly, line] = firstIsPolyline ? [this.first, this.second] : [this.second, this.first];
    const lineTangentPoint = line === this.first ? firstTangentPoint : secondTangentPoint;
    const polyTangentPoint = poly === this.first ? firstTangentPoint : secondTangentPoint;
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
      newPoints = [
        ...poly.entity.points.slice(0, polySegIdx).map((p) => p.clone()),
        arcStartPoint,
        lineTangentPoint.clone(),
        line.lineKeptEnd.clone(),
      ];
    } else {
      const revArcStartPoint = lineTangentPoint.clone();
      revArcStartPoint.bulge = -bulge;
      newPoints = [
        line.lineKeptEnd.clone(),
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
