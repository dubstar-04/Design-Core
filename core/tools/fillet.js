import { Strings } from '../lib/strings.js';
import { ChamferFilletBase } from './chamferFilletBase.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Constants } from '../lib/constants.js';
import { Utils } from '../lib/utils.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { AddState } from '../lib/stateManager.js';

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
        const stateChanges = this.applyCornerTrim(this.intersectionPoint, this.intersectionPoint, null);
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
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.PARALLELLINES}`);
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
        DesignCore.Core.notify(`${this.type} - ${Strings.Error.ERROR}:${Strings.Error.RADIUSTOOLARGE}`);
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
      ...Utils.cloneProperties(this.firstPick.entity),
    });

    if (!trimMode) {
      DesignCore.Scene.commit([new AddState(arc)]);
      return;
    }

    // Use arc.toPolylinePoints() to get the tangent points with bulge already computed
    const arcPolyPoints = arc.toPolylinePoints();
    const firstCornerPoint = arcPolyPoints[0]; // firstTangentPoint with bulge
    const secondCornerPoint = arcPolyPoints[1]; // secondTangentPoint

    const stateChanges = this.applyCornerTrim(firstCornerPoint, secondCornerPoint, arc);
    DesignCore.Scene.commit(stateChanges);
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
