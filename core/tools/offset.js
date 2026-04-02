import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Offset Command Class
 * @extends Tool
 */
export class Offset extends Tool {
  /** Create an Offset command */
  constructor() {
    super();
    this.offsetDistance = 0;
    this.selectedItem = null;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Offset', shortcut: 'O', type: 'Tool' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      // Initialise from the last used offset distance stored in headers
      const storedDistance = DesignCore.Scene.headers.offsetDistance;
      if (storedDistance > 0) this.offsetDistance = storedDistance;

      const op = new PromptOptions(Strings.Input.DISTANCE, [Input.Type.NUMBER], ['Through']);
      const distanceInput = await DesignCore.Scene.inputManager.requestInput(op);
      if (distanceInput === undefined) return;

      if (Input.getType(distanceInput) === Input.Type.STRING && distanceInput === 'Through') {
        DesignCore.Scene.headers.offsetDistance = -1;
        // Through mode: select entity, then specify a through point
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const selection = await DesignCore.Scene.inputManager.requestInput(op2);
          if (selection === undefined) break;
          this.selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);

          const op3 = new PromptOptions(Strings.Input.THROUGHPOINT, [Input.Type.POINT]);
          const throughPoint = await DesignCore.Scene.inputManager.requestInput(op3);
          if (throughPoint === undefined) break;

          this.offsetDistance = this.getThroughDistance(this.selectedItem, throughPoint);
          this.points = [throughPoint];
          DesignCore.Scene.inputManager.actionCommand();
        }
      } else {
        // Distance mode
        this.offsetDistance = distanceInput;

        if (this.offsetDistance <= 0) {
          DesignCore.Core.notify(`${this.type} - ${Strings.Error.NONZERO}`);
          return;
        }

        DesignCore.Scene.headers.offsetDistance = this.offsetDistance;

        // Select entity and side point (repeating)
        const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
        while (true) {
          const selection = await DesignCore.Scene.inputManager.requestInput(op2);
          if (selection === undefined) break;
          this.selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);

          const op3 = new PromptOptions(Strings.Input.SIDE, [Input.Type.POINT]);
          const sidePoint = await DesignCore.Scene.inputManager.requestInput(op3);
          if (sidePoint === undefined) break;

          this.points = [sidePoint];
          DesignCore.Scene.inputManager.actionCommand();
        }
      }

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    if (this.selectedItem && this.offsetDistance > 0) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const offsetPoints = this.getOffsetPoints(this.selectedItem, mousePoint, this.offsetDistance);

      if (offsetPoints) {
        const data = { points: offsetPoints };

        if (this.selectedItem.type === 'Arc') {
          data.direction = this.selectedItem.direction;
        }

        DesignCore.Scene.tempEntities.create(this.selectedItem.type, data);
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    if (!this.selectedItem || this.offsetDistance <= 0) return;

    const sidePoint = this.points[0];
    const entity = this.selectedItem;
    const offsetPoints = this.getOffsetPoints(entity, sidePoint, this.offsetDistance);

    if (!offsetPoints) {
      Logging.instance.warn(`${this.type}: ${entity.type} ${Strings.Message.CANNOTBEACTIONED}`);
      return;
    }

    const offsetEntity = Utils.cloneObject(entity);
    offsetEntity.setProperty('points', offsetPoints);

    if (entity.type === 'Arc') {
      offsetEntity.radius = entity.points[0].distance(offsetPoints[1]);
    }

    const stateChange = new AddState(offsetEntity);
    DesignCore.Scene.commit([stateChange]);
  }

  /**
   * Get offset points for an entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset points or null if unsupported
   */
  getOffsetPoints(entity, sidePoint, distance) {
    switch (entity.type) {
      case 'Line':
        return this.getOffsetLinePoints(entity, sidePoint, distance);
      case 'Circle':
        return this.getOffsetCirclePoints(entity, sidePoint, distance);
      case 'Arc':
        return this.getOffsetArcPoints(entity, sidePoint, distance);
      default:
        return null;
    }
  }

  /**
   * Get offset points for a line entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array} offset line points
   */
  getOffsetLinePoints(entity, sidePoint, distance) {
    const p1 = entity.points[0];
    const p2 = entity.points[1];

    // Line direction and perpendicular normal
    const direction = p2.subtract(p1);
    const normal = new Point(-direction.y, direction.x).normalise();

    // Determine which side using cross product
    const toSide = sidePoint.subtract(p1);
    const sign = direction.cross(toSide) >= 0 ? 1 : -1;

    const offset = normal.scale(distance * sign);
    return [p1.add(offset), p2.add(offset)];
  }

  /**
   * Get offset points for a circle entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset circle points or null if radius would be non-positive
   */
  getOffsetCirclePoints(entity, sidePoint, distance) {
    const center = entity.points[0];
    const currentRadius = center.distance(entity.points[1]);

    // Outside: grow, Inside: shrink
    const distFromCenter = center.distance(sidePoint);
    const newRadius = distFromCenter >= currentRadius ?
      currentRadius + distance :
      currentRadius - distance;

    if (newRadius <= 0) return null;

    const angle = center.angle(entity.points[1]);
    return [center, center.project(angle, newRadius)];
  }

  /**
   * Get offset points for an arc entity
   * @param {Object} entity
   * @param {Point} sidePoint
   * @param {number} distance
   * @return {Array|null} offset arc points or null if radius would be non-positive
   */
  getOffsetArcPoints(entity, sidePoint, distance) {
    const center = entity.points[0];
    const currentRadius = center.distance(entity.points[1]);

    const distFromCenter = center.distance(sidePoint);
    const newRadius = distFromCenter >= currentRadius ?
      currentRadius + distance :
      currentRadius - distance;

    if (newRadius <= 0) return null;

    // Preserve start and end angles
    const startAngle = center.angle(entity.points[1]);
    const endAngle = center.angle(entity.points[2]);

    return [center, center.project(startAngle, newRadius), center.project(endAngle, newRadius)];
  }

  /**
   * Calculate through distance from entity to through point
   * @param {Object} entity
   * @param {Point} throughPoint
   * @return {number} distance
   */
  getThroughDistance(entity, throughPoint) {
    switch (entity.type) {
      case 'Line': {
        const closest = throughPoint.perpendicular(entity.points[0], entity.points[1]);
        return throughPoint.distance(closest);
      }
      case 'Circle':
      case 'Arc': {
        const center = entity.points[0];
        const currentRadius = center.distance(entity.points[1]);
        return Math.abs(center.distance(throughPoint) - currentRadius);
      }
      default:
        return 0;
    }
  }
}
