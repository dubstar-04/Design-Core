import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState, UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Chamfer Command Class
 * @extends Tool
 */
export class Chamfer extends Tool {
  /** Create a Chamfer command */
  constructor() {
    super();
    this.firstEntity = null;
    this.secondEntity = null;
    // Click points are used to identify which side of the intersection to chamfer.
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
        if (firstEntity.type !== 'Line') {
          DesignCore.Core.notify(`${firstEntity.type} ${Strings.Message.NOCHAMFER}`);
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
          if (candidate.type !== 'Line') {
            DesignCore.Core.notify(`${candidate.type} ${Strings.Message.NOCHAMFER}`);
            continue;
          }
          secondEntity = candidate;
          this.secondClickPoint = input2.selectedPoint;
          break;
        }
        this.secondEntity = secondEntity;

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

    if (this.firstEntity.type !== 'Line') {
      DesignCore.Core.notify(`${this.firstEntity.type} ${Strings.Message.NOCHAMFER}`);
      return;
    }

    if (this.secondEntity.type !== 'Line') {
      DesignCore.Core.notify(`${this.secondEntity.type} ${Strings.Message.NOCHAMFER}`);
      return;
    }

    const firstLineStart = this.firstEntity.points[0];
    const firstLineEnd = this.firstEntity.points[1];

    const secondLineStart = this.secondEntity.points[0];
    const secondLineEnd = this.secondEntity.points[1];

    // Direction vectors along each line
    const firstLineDirection = firstLineEnd.subtract(firstLineStart);
    const secondLineDirection = secondLineEnd.subtract(secondLineStart);

    // Zero cross product means the lines are parallel — no intersection
    const directionCross = firstLineDirection.cross(secondLineDirection);
    if (Math.abs(directionCross) < 1e-10) {
      DesignCore.Core.notify(Strings.Error.PARALLELLINES);
      return;
    }

    // Virtual intersection point of the two infinite lines
    const startDiff = secondLineStart.subtract(firstLineStart);
    const intersectParam = startDiff.cross(secondLineDirection) / directionCross;
    const intersectionPoint = firstLineStart.lerp(firstLineEnd, intersectParam);

    // Project the click points onto their respective lines to get a point on the
    // clicked side of the intersection, used to determine which corner is chamfered.
    const firstClickOnLine = this.firstClickPoint.perpendicular(firstLineStart, firstLineEnd);
    const secondClickOnLine = this.secondClickPoint.perpendicular(secondLineStart, secondLineEnd);

    const firstClickDistance = firstClickOnLine.distance(intersectionPoint);
    const secondClickDistance = secondClickOnLine.distance(intersectionPoint);

    // Vectors from the intersection toward the clicked side of each line
    const firstClickDir = firstClickOnLine.subtract(intersectionPoint);
    const secondClickDir = secondClickOnLine.subtract(intersectionPoint);

    // Pick the endpoint on the same side as the click (dot-product comparison handles the
    // edge case where one endpoint coincides with the intersection)
    const firstLineKeptEnd = firstClickDir.dot(firstLineStart.subtract(intersectionPoint)) >= firstClickDir.dot(firstLineEnd.subtract(intersectionPoint)) ? firstLineStart : firstLineEnd;
    const secondLineKeptEnd = secondClickDir.dot(secondLineStart.subtract(intersectionPoint)) >= secondClickDir.dot(secondLineEnd.subtract(intersectionPoint)) ? secondLineStart : secondLineEnd;

    // Unit vectors pointing from the intersection toward the clicked side of each line
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
        const stateChanges = [
          new UpdateState(this.firstEntity, { points: [firstLineKeptEnd, intersectionPoint] }),
          new UpdateState(this.secondEntity, { points: [secondLineKeptEnd, intersectionPoint] }),
        ];
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

    // Verify both chamfer endpoints lie within their respective segments
    if (trimMode) {
      if (!firstChamferPoint.isOnLine(firstLineStart, firstLineEnd) ||
        !secondChamferPoint.isOnLine(secondLineStart, secondLineEnd)) {
        DesignCore.Core.notify(`${Strings.Error.DISTANCETOOLARGE}`);
        return;
      }
    }

    const chamferLine = DesignCore.CommandManager.createNew('Line', {
      points: [firstChamferPoint, secondChamferPoint],
    });

    const stateChanges = [new AddState(chamferLine)];

    if (trimMode) {
      stateChanges.push(new UpdateState(this.firstEntity, { points: [firstLineKeptEnd, firstChamferPoint] }));
      stateChanges.push(new UpdateState(this.secondEntity, { points: [secondLineKeptEnd, secondChamferPoint] }));
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
