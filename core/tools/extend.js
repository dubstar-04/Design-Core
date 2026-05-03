import { Intersection } from '../lib/intersect.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { UpdateState } from '../lib/stateManager.js';
import { Utils } from '../lib/utils.js';
import { PolylineUtils } from '../lib/polylineUtils.js';

import { DesignCore } from '../designCore.js';

/**
 * Extend Command Class
 * @extends Tool
 */
export class Extend extends Tool {
  static type = 'Extend';

  /** Create an Extend command */
  constructor() {
    super();
    this.selectedEntity = null;
    this.selectedBoundaryItems = [];
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Extend', shortcut: 'EX', type: 'Tool' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.BOUNDARY, [Input.Type.SELECTIONSET]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        const boundary = await DesignCore.Scene.inputManager.requestInput(op);
        if (boundary === undefined) return;
      }

      // add all selected entities to boundary items
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const boundaryItem = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
        this.selectedBoundaryItems.push(boundaryItem);
      }

      const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
      while (true) {
        const selection = await DesignCore.Scene.inputManager.requestInput(op2);
        if (selection === undefined) break;
        this.selectedEntity = DesignCore.Scene.entities.get(selection.selectedEntityIndex);
        DesignCore.Scene.selectionManager.removeLastSelection();
        DesignCore.Scene.inputManager.actionCommand();
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
    if (!this.selectedBoundaryItems.length) return;

    const index = DesignCore.Scene.selectionManager.findClosestItem(DesignCore.Mouse.pointOnScene());
    if (index === undefined) return;

    const entity = DesignCore.Scene.entities.get(index);
    if (typeof entity.toPolylinePoints !== 'function' || typeof entity.fromPolylinePoints !== 'function') return;
    const intersectPoints = this.#collectIntersectPoints(entity);
    if (!intersectPoints.length) return;

    const stateChanges = this.#extendEntity(entity, intersectPoints);
    if (!stateChanges?.length) return;

    for (const change of stateChanges) {
      if (change instanceof UpdateState) {
        const extended = Utils.cloneObject(entity);
        extended.setProperty('points', change.properties.points);
        DesignCore.Scene.previewEntities.add(extended);
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    if (this.selectedEntity && this.selectedBoundaryItems.length) {
      if (typeof this.selectedEntity.fromPolylinePoints !== 'function') {
        DesignCore.Core.notify(`${this.type} - ${this.selectedEntity.type} ${Strings.Message.NOEXTEND}`);
        this.selectedEntity = null;
        return;
      }

      const intersectPoints = this.#collectIntersectPoints(this.selectedEntity);

      if (intersectPoints.length) {
        const stateChanges = this.#extendEntity(this.selectedEntity, intersectPoints);
        if (stateChanges?.length) {
          DesignCore.Scene.commit(stateChanges);
        } else {
          DesignCore.Core.notify(`${this.type} - ${this.selectedEntity.type} ${Strings.Message.NOEXTEND}`);
        }
      } else {
        DesignCore.Core.notify(`${this.type} - ${this.selectedEntity.type} ${Strings.Message.NOEXTEND}`);
      }
    }

    this.selectedEntity = null;
  }

  /**
   * Collect all intersection points between the boundary items and the given entity.
   * Unsupported entity combinations are silently skipped.
   * @param {Object} entity
   * @return {Array}
   */
  #collectIntersectPoints(entity) {
    const intersectPoints = [];
    for (const boundaryItem of this.selectedBoundaryItems) {
      if (boundaryItem === entity) continue;
      try {
        const intersect = Intersection.intersectPolylinePolyline(boundaryItem.toPolylinePoints(), entity.toPolylinePoints(), true);
        intersectPoints.push(...intersect.points);
      } catch {
        // skip unsupported entity combinations
      }
    }
    return intersectPoints;
  }

  /**
   * Compute a state change to extend entity to the nearest valid boundary
   * intersection. Operates entirely in polyline-point space via
   * entity.toPolylinePoints() / entity.fromPolylinePoints(), so it works for
   * any entity that implements that protocol (Line, PolylineBase, and future
   * entities such as Spline or Ellipse).
   * Only straight end-segments (bulge === 0) can be extended.
   * @param {Object} entity
   * @param {Array}  intersectPoints
   * @return {Array}
   */
  #extendEntity(entity, intersectPoints) {
    if (!intersectPoints?.length) return [];

    const polyPoints = entity.toPolylinePoints();

    // Closed entities have no open endpoints to extend
    if (polyPoints[0].isSame(polyPoints.at(-1))) return [];

    const mousePosition = DesignCore.Mouse.pointOnScene();
    const lastIndex = polyPoints.length - 1;

    // Determine which end segment is closest to the mouse
    const closestOnFirst = PolylineUtils.closestPointOnSegment(polyPoints, mousePosition, 1);
    const closestOnLast = PolylineUtils.closestPointOnSegment(polyPoints, mousePosition, lastIndex);
    const distToFirst = mousePosition.distance(closestOnFirst);
    const distToLast = mousePosition.distance(closestOnLast);

    let endPointIndex;
    let endSegmentBulge;
    if (distToFirst < distToLast) {
      endPointIndex = 0;
      endSegmentBulge = polyPoints[0].bulge ?? 0;
    } else if (distToLast < distToFirst) {
      endPointIndex = lastIndex;
      endSegmentBulge = polyPoints[lastIndex - 1].bulge ?? 0;
    } else {
      if (mousePosition.distance(polyPoints[0]) <= mousePosition.distance(polyPoints[lastIndex])) {
        endPointIndex = 0;
        endSegmentBulge = polyPoints[0].bulge ?? 0;
      } else {
        endPointIndex = lastIndex;
        endSegmentBulge = polyPoints[lastIndex - 1].bulge ?? 0;
      }
    }

    // Only straight end-segments can be extended
    if (endSegmentBulge !== 0) return [];

    const endPoint = polyPoints[endPointIndex];
    const adjacentPoint = endPointIndex === 0 ? polyPoints[1] : polyPoints[lastIndex - 1];

    Utils.sortPointsByDistance(intersectPoints, endPoint);

    const direction = endPoint.subtract(adjacentPoint);
    const newEndPoint = intersectPoints.find((p) => {
      // Ignore the current end point itself
      if (p.isSame(endPoint)) return false;
      // Point must be ahead of the end point in the extension direction
      if (p.subtract(endPoint).dot(direction) <= 0) return false;
      // Point must be further from the adjacent point than the end point is (i.e. actually extends the segment)
      if (adjacentPoint.distance(p) <= adjacentPoint.distance(endPoint)) return false;
      // Point must lie on the extension line of the end segment; intersections from internal
      // segments extended as infinite lines will have a non-zero cross product with direction
      if (Utils.round(direction.cross(p.subtract(adjacentPoint))) !== 0) return false;
      return true;
    });

    if (!newEndPoint) return [];

    const newPolyPoints = polyPoints.map((p) => p.clone());
    newPolyPoints[endPointIndex] = newEndPoint.clone();

    if (newPolyPoints[endPointIndex].isSame(polyPoints[endPointIndex])) return [];

    const clone = Utils.cloneObject(entity);
    const output = clone.fromPolylinePoints(newPolyPoints);
    return [new UpdateState(entity, { points: output.points })];
  }
}

