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
    this.firstEntity = null;
    this.secondEntity = null;
    // If the lines form a cross there are four possible fillet locations.
    // The click points are used to determine the arc location.
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
        // Only Line entities can be filleted
        if (firstEntity.type !== 'Line') {
          DesignCore.Core.notify(`${firstEntity.type} ${Strings.Message.NOFILLET}`);
          continue;
        }
        this.firstEntity = firstEntity;
        this.firstClickPoint = input1.selectedPoint;

        // Prompt for second object — re-prompt if the selection is not a Line
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        let secondEntity;
        while (true) {
          const input2 = await DesignCore.Scene.inputManager.requestInput(op2);
          if (input2 === undefined) return;

          const candidate = DesignCore.Scene.entities.get(input2.selectedItemIndex);
          DesignCore.Scene.selectionManager.removeLastSelection();
          // Only Line entities can be filleted
          if (candidate.type !== 'Line') {
            DesignCore.Core.notify(`${candidate.type} ${Strings.Message.NOFILLET}`);
            continue;
          }
          secondEntity = candidate;
          this.secondClickPoint = input2.selectedPoint;
          break;
        }
        this.secondEntity = secondEntity;

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

    if (this.firstEntity.type !== 'Line') {
      DesignCore.Core.notify(`${this.firstEntity.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    if (this.secondEntity.type !== 'Line') {
      DesignCore.Core.notify(`${this.secondEntity.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    // Endpoints of the first line
    const firstLineStart = this.firstEntity.points[0];
    const firstLineEnd = this.firstEntity.points[1];

    // Endpoints of the second line
    const secondLineStart = this.secondEntity.points[0];
    const secondLineEnd = this.secondEntity.points[1];

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

    // The endpoint of each line farthest from the intersection is the one to keep after trimming
    const firstLineKeptEnd = intersectionPoint.distance(firstLineStart) >= intersectionPoint.distance(firstLineEnd) ? firstLineStart : firstLineEnd;
    const secondLineKeptEnd = intersectionPoint.distance(secondLineStart) >= intersectionPoint.distance(secondLineEnd) ? secondLineStart : secondLineEnd;

    // radius = 0: trim/extend both lines to the sharp intersection with no arc
    const filletRadius = DesignCore.Scene.headers.filletRadius;
    const trimMode = DesignCore.Scene.headers.trimMode;
    if (filletRadius === 0) {
      if (trimMode) {
        const stateChanges = [
          new UpdateState(this.firstEntity, { points: [firstLineKeptEnd, intersectionPoint] }),
          new UpdateState(this.secondEntity, { points: [secondLineKeptEnd, intersectionPoint] }),
        ];
        DesignCore.Scene.commit(stateChanges);
      }
      return;
    }

    // Project the click points onto their respective lines so they sit exactly on the line.
    // This gives a point on the clicked side of the intersection, used to determine
    // which of the four corners formed by the two lines receives the fillet arc.
    const firstClickOnLine = this.firstClickPoint.perpendicular(firstLineStart, firstLineEnd);
    const secondClickOnLine = this.secondClickPoint.perpendicular(secondLineStart, secondLineEnd);

    // Distances from the intersection to the clicked projection on each line
    const firstClickDistance = firstClickOnLine.distance(intersectionPoint);
    const secondClickDistance = secondClickOnLine.distance(intersectionPoint);

    if (firstClickDistance < 1e-10 || secondClickDistance < 1e-10) {
      DesignCore.Core.notify(`${this.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    // Unit vectors pointing from the intersection toward the clicked side of each line
    const firstClickDirection = firstClickOnLine.subtract(intersectionPoint);
    const secondClickDirection = secondClickOnLine.subtract(intersectionPoint);
    const firstClickUnit = new Point(firstClickDirection.x / firstClickDistance, firstClickDirection.y / firstClickDistance);
    const secondClickUnit = new Point(secondClickDirection.x / secondClickDistance, secondClickDirection.y / secondClickDistance);

    // Angle between the two clicked-side direction vectors (i.e. the opening angle of the chosen corner)
    const cosAngle = Math.min(1, Math.max(-1, firstClickUnit.dot(secondClickUnit)));
    const cornerAngle = Math.acos(cosAngle);

    // Collinear or antiparallel lines cannot be filleted
    if (cornerAngle < 1e-10 || cornerAngle > Math.PI - 1e-10) {
      DesignCore.Core.notify(`${this.type} ${Strings.Message.NOFILLET}`);
      return;
    }

    // Bisector unit vector: points into the chosen corner toward the fillet centre
    const bisectorSum = firstClickUnit.add(secondClickUnit);
    const bisectorLength = Math.sqrt(bisectorSum.x ** 2 + bisectorSum.y ** 2);

    if (bisectorLength < 1e-10) {
      DesignCore.Core.notify(`${this.type} ${Strings.Message.NOFILLET}`);
      return;
    }

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

    // Verify both tangent points lie within the actual line segments when trim mode is on
    if (trimMode) {
      if (intersectionPoint.distance(firstTangentPoint) > intersectionPoint.distance(firstLineKeptEnd) ||
        intersectionPoint.distance(secondTangentPoint) > intersectionPoint.distance(secondLineKeptEnd)) {
        DesignCore.Core.notify(`${this.type}: ${Strings.Error.RADIUSTOOLARGE}`);
        return;
      }
    }

    // Determine arc winding direction: CCW (1) if (T1–C) × (T2–C) > 0, otherwise CW (-1)
    const centreToFirst = firstTangentPoint.subtract(arcCentre);
    const centreToSecond = secondTangentPoint.subtract(arcCentre);
    const windingCross = centreToFirst.cross(centreToSecond);
    const arcDirection = windingCross > 0 ? 1 : -1;

    const arc = DesignCore.CommandManager.createNew('Arc', {
      points: [arcCentre, firstTangentPoint, secondTangentPoint],
      direction: arcDirection,
    });

    const stateChanges = [new AddState(arc)];

    if (trimMode) {
      stateChanges.push(new UpdateState(this.firstEntity, { points: [firstLineKeptEnd, firstTangentPoint] }));
      stateChanges.push(new UpdateState(this.secondEntity, { points: [secondLineKeptEnd, secondTangentPoint] }));
    }

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
