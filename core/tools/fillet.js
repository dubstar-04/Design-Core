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
        const firstResolved = this.resolveSegment(firstEntity, input1.selectedPoint, `${Strings.Strings.ARC} ${Strings.Message.NOFILLET}`);
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
            DesignCore.Core.notify(`${candidate.type} ${Strings.Message.NOFILLET}`);
            continue;
          }
          const candidateResolved = this.resolveSegment(candidate, input2.selectedPoint, `${Strings.Strings.ARC} ${Strings.Message.NOFILLET}`);
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
    if (!this.firstEntity || !this.secondEntity) return;

    // Resolve segments: execute() populates firstSegment/secondSegment for polylines,
    const firstSeg = this.firstSegment ?? this.firstEntity;
    const secondSeg = this.secondSegment ?? this.secondEntity;

    if (!(firstSeg instanceof Line)) {
      DesignCore.Core.notify(`${this.firstEntity.type} ${Strings.Message.NOFILLET}`);
      return;
    }
    if (!(secondSeg instanceof Line)) {
      DesignCore.Core.notify(`${this.secondEntity.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    // Endpoints of the first line (or the resolved segment from a polyline)
    const firstLineStart = firstSeg.points[0];
    const firstLineEnd = firstSeg.points[1];

    // Endpoints of the second line (or the resolved segment from a polyline)
    const secondLineStart = secondSeg.points[0];
    const secondLineEnd = secondSeg.points[1];

    // Direction vectors along each line
    const firstLineDirection = firstLineEnd.subtract(firstLineStart);
    const secondLineDirection = secondLineEnd.subtract(secondLineStart);

    // Cross product of the two direction vectors; zero means the lines are parallel
    const directionCross = firstLineDirection.cross(secondLineDirection);

    if (Math.abs(directionCross) < 1e-10) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return;
    }

    // Find where the two infinite lines intersect using the parametric form:
    // point = firstLineStart + (intersectParam * firstLineDirection)
    // intersectParam = 0 is firstLineStart, intersectParam = 1 is firstLineEnd
    const startDiff = secondLineStart.subtract(firstLineStart);
    const intersectParam = startDiff.cross(secondLineDirection) / directionCross;

    // Virtual intersection point of the two (infinite) lines
    const intersectionPoint = firstLineStart.lerp(firstLineEnd, intersectParam);

    // Project the click points onto their respective lines so they sit exactly on the line.
    // This gives a point on the clicked side of the intersection, used to determine
    // which of the four corners formed by the two lines receives the fillet arc.
    const firstClickOnLine = this.firstClickPoint.perpendicular(firstLineStart, firstLineEnd);
    const secondClickOnLine = this.secondClickPoint.perpendicular(secondLineStart, secondLineEnd);

    // Distances from the intersection to the clicked projection on each line
    const firstClickDistance = firstClickOnLine.distance(intersectionPoint);
    const secondClickDistance = secondClickOnLine.distance(intersectionPoint);

    // Vectors pointing from the intersection toward the clicked side of each line.
    // Using the click direction (rather than "farthest endpoint") correctly handles
    // cases where the intersection lies inside the segment and both endpoints are
    // equidistant from the intersection.
    const firstClickDir = firstClickOnLine.subtract(intersectionPoint);
    const secondClickDir = secondClickOnLine.subtract(intersectionPoint);

    // Pick the endpoint whose direction from the intersection is more aligned with the click.
    // Comparing the two dot products against each other (rather than against zero) correctly
    // handles the case where one endpoint is exactly at the intersection (dot product = 0).
    const firstLineKeptEnd = firstClickDir.dot(firstLineStart.subtract(intersectionPoint)) >= firstClickDir.dot(firstLineEnd.subtract(intersectionPoint)) ? firstLineStart : firstLineEnd;
    const secondLineKeptEnd = secondClickDir.dot(secondLineStart.subtract(intersectionPoint)) >= secondClickDir.dot(secondLineEnd.subtract(intersectionPoint)) ? secondLineStart : secondLineEnd;

    // radius = 0: trim/extend both lines to the sharp intersection with no arc
    const filletRadius = DesignCore.Scene.headers.filletRadius;
    const trimMode = DesignCore.Scene.headers.trimMode;
    if (filletRadius === 0) {
      if (trimMode) this.applySharpTrim(intersectionPoint, firstClickDir, secondClickDir, firstLineKeptEnd, secondLineKeptEnd);
      return;
    }

    if (firstClickDistance < 1e-10 || secondClickDistance < 1e-10) {
      DesignCore.Core.notify(`${Strings.Error.SELECTION}`);
      return;
    }

    // Unit vectors pointing from the intersection toward the clicked side of each line
    const firstClickUnit = new Point(firstClickDir.x / firstClickDistance, firstClickDir.y / firstClickDistance);
    const secondClickUnit = new Point(secondClickDir.x / secondClickDistance, secondClickDir.y / secondClickDistance);

    // Angle between the two clicked-side direction vectors (i.e. the opening angle of the chosen corner)
    const cosAngle = Math.min(1, Math.max(-1, firstClickUnit.dot(secondClickUnit)));
    const cornerAngle = Math.acos(cosAngle);

    // Collinear or antiparallel lines cannot be filleted
    if (cornerAngle < 1e-10 || cornerAngle > Math.PI - 1e-10) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return;
    }

    // Bisector unit vector: points into the chosen corner toward the fillet centre
    const bisectorSum = firstClickUnit.add(secondClickUnit);
    const bisectorLength = Math.sqrt(bisectorSum.x ** 2 + bisectorSum.y ** 2);
    const bisectorUnit = new Point(bisectorSum.x / bisectorLength, bisectorSum.y / bisectorLength);

    // Distance from the intersection point to the fillet centre along the bisector
    const intersectToCentreDistance = filletRadius / Math.sin(cornerAngle / 2);

    // Fillet arc centre point
    const arcCentre = new Point(
        intersectionPoint.x + bisectorUnit.x * intersectToCentreDistance,
        intersectionPoint.y + bisectorUnit.y * intersectToCentreDistance,
    );

    // Tangent points where the fillet arc meets each line (foot of perpendicular from centre to line)
    const firstTangentPoint = arcCentre.perpendicular(firstLineStart, firstLineEnd);
    const secondTangentPoint = arcCentre.perpendicular(secondLineStart, secondLineEnd);

    // Verify the tangent points are reachable — same direction as the kept end from the
    // intersection and not farther than the kept end (which would flip the line direction).
    if (trimMode) {
      const firstKeptDir = firstLineKeptEnd.subtract(intersectionPoint);
      const secondKeptDir = secondLineKeptEnd.subtract(intersectionPoint);
      const firstTangentDot = firstTangentPoint.subtract(intersectionPoint).dot(firstKeptDir);
      const secondTangentDot = secondTangentPoint.subtract(intersectionPoint).dot(secondKeptDir);
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

    const firstIsPolyline = this.firstEntity instanceof BasePolyline;
    const secondIsPolyline = this.secondEntity instanceof BasePolyline;

    if (!trimMode) {
      DesignCore.Scene.commit([new AddState(arc)]);
      return;
    }

    if (!firstIsPolyline && !secondIsPolyline) {
      this.#trimLineAndLine(firstLineKeptEnd, secondLineKeptEnd, firstTangentPoint, secondTangentPoint, arc);
    } else if (firstIsPolyline && secondIsPolyline && this.firstEntity === this.secondEntity) {
      this.#trimPolyAndPoly(firstTangentPoint, secondTangentPoint, arcDirection, arcCentre, arc);
    } else {
      this.#trimLineAndPoly(firstTangentPoint, secondTangentPoint, firstLineKeptEnd, secondLineKeptEnd, firstClickDir, secondClickDir, arcDirection, arcCentre, intersectionPoint);
    }
  }

  /**
   * Apply trim and arc for a Line + Line fillet.
   * @param {Point} firstLineKeptEnd
   * @param {Point} secondLineKeptEnd
   * @param {Point} firstTangentPoint
   * @param {Point} secondTangentPoint
   * @param {Arc} arc
   */
  #trimLineAndLine(firstLineKeptEnd, secondLineKeptEnd, firstTangentPoint, secondTangentPoint, arc) {
    DesignCore.Scene.commit([
      new AddState(arc),
      new UpdateState(this.firstEntity, { points: [firstLineKeptEnd, firstTangentPoint] }),
      new UpdateState(this.secondEntity, { points: [secondLineKeptEnd, secondTangentPoint] }),
    ]);
  }

  /**
   * Apply trim and arc for a Polyline + Polyline (same entity) fillet.
   * Handles both the open-ends case and the consecutive-segments case.
   * @param {Point} firstTangentPoint
   * @param {Point} secondTangentPoint
   * @param {number} arcDirection
   * @param {Point} arcCentre
   * @param {Arc} arc
   */
  #trimPolyAndPoly(firstTangentPoint, secondTangentPoint, arcDirection, arcCentre, arc) {
    const lastIdx = this.firstEntity.points.length - 1;
    const segDiff = Math.abs(this.firstSegmentIndex - this.secondSegmentIndex);
    const isOpenEnds = segDiff !== 1 && (
      (this.firstSegmentIndex === 1 && this.secondSegmentIndex === lastIdx) ||
      (this.firstSegmentIndex === lastIdx && this.secondSegmentIndex === 1)
    );
    const newPoints = this.firstEntity.points.map((p) => p.clone());
    const stateChanges = [];

    if (isOpenEnds) {
      stateChanges.push(new AddState(arc));
      if (this.firstSegmentIndex === 1) {
        newPoints[0] = firstTangentPoint.clone();
        newPoints[lastIdx] = secondTangentPoint.clone();
      } else {
        newPoints[0] = secondTangentPoint.clone();
        newPoints[lastIdx] = firstTangentPoint.clone();
      }
    } else {
      const isFirstLower = this.firstSegmentIndex < this.secondSegmentIndex;
      const cornerIdx = Math.min(this.firstSegmentIndex, this.secondSegmentIndex);
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

    stateChanges.push(new UpdateState(this.firstEntity, { points: newPoints }));
    DesignCore.Scene.commit(stateChanges);
  }

  /**
   * Apply trim and arc for a Line + Polyline (or Polyline + Line) fillet.
   * The line is consumed into the polyline with the arc encoded as a bulge.
   * @param {Point} firstTangentPoint
   * @param {Point} secondTangentPoint
   * @param {Point} firstLineKeptEnd
   * @param {Point} secondLineKeptEnd
   * @param {Point} firstClickDir
   * @param {Point} secondClickDir
   * @param {number} arcDirection
   * @param {Point} arcCentre
   * @param {Point} intersectionPoint
   */
  #trimLineAndPoly(firstTangentPoint, secondTangentPoint, firstLineKeptEnd, secondLineKeptEnd, firstClickDir, secondClickDir, arcDirection, arcCentre, intersectionPoint) {
    const firstIsPolyline = this.firstEntity instanceof BasePolyline;
    const lineEntity = !firstIsPolyline ? this.firstEntity : this.secondEntity;
    const polyEntity = firstIsPolyline ? this.firstEntity : this.secondEntity;
    const lineTangentPoint = !firstIsPolyline ? firstTangentPoint : secondTangentPoint;
    const polyTangentPoint = firstIsPolyline ? firstTangentPoint : secondTangentPoint;
    const lineKeptEnd = !firstIsPolyline ? firstLineKeptEnd : secondLineKeptEnd;
    const polySegIdx = firstIsPolyline ? this.firstSegmentIndex : this.secondSegmentIndex;
    const polyToLineDir = firstIsPolyline ? arcDirection : -arcDirection;

    const startAngle = arcCentre.angle(polyTangentPoint);
    const endAngle = arcCentre.angle(lineTangentPoint);
    const includedAngle = ((endAngle - startAngle) * polyToLineDir + 4 * Math.PI) % (2 * Math.PI);
    const bulge = polyToLineDir * Math.tan(includedAngle / 4);
    const arcStartPoint = polyTangentPoint.clone();
    arcStartPoint.bulge = bulge;

    const polyClickDir = firstIsPolyline ? firstClickDir : secondClickDir;
    const segStart = polyEntity.points[polySegIdx - 1];
    const segEnd = polyEntity.points[polySegIdx];
    const keepStart = polyClickDir.dot(segStart.subtract(intersectionPoint)) >= polyClickDir.dot(segEnd.subtract(intersectionPoint));
    let newPoints;
    if (keepStart) {
      newPoints = [
        ...polyEntity.points.slice(0, polySegIdx).map((p) => p.clone()),
        arcStartPoint,
        lineTangentPoint.clone(),
        lineKeptEnd.clone(),
      ];
    } else {
      const revArcStartPoint = lineTangentPoint.clone();
      revArcStartPoint.bulge = -bulge;
      newPoints = [
        lineKeptEnd.clone(),
        revArcStartPoint,
        polyTangentPoint.clone(),
        ...polyEntity.points.slice(polySegIdx).map((p) => p.clone()),
      ];
    }

    DesignCore.Scene.commit([
      new RemoveState(lineEntity),
      new UpdateState(polyEntity, { points: newPoints }),
    ]);
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
