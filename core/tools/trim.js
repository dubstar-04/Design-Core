import { Intersection } from '../lib/intersect.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { AddState, RemoveState } from '../lib/stateManager.js';
import { Utils } from '../lib/utils.js';
import { Colour } from '../lib/colour.js';
import { PolylineUtils } from '../lib/polylineUtils.js';

import { DesignCore } from '../designCore.js';

/**
 * Trim Command Class
 * @extends Tool
 */
export class Trim extends Tool {
  static type = 'Trim';

  /** Create a Trim command */
  constructor() {
    super();
    this.selectedItem = null;
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
    const command = { command: 'Trim', shortcut: 'TR', type: 'Tool' };
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

      // add all selected items to boundary items
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const boundaryItem = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
        this.selectedBoundaryItems.push(boundaryItem);
      }

      const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
      while (true) {
        const selection = await DesignCore.Scene.inputManager.requestInput(op2);
        if (selection === undefined) break;
        this.selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);
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
    if (typeof entity.toPolylinePoints !== 'function') return;
    const intersectPoints = this.#collectIntersectPoints(entity);
    if (!intersectPoints.length) return;

    const stateChanges = this.#trimEntity(entity, intersectPoints);
    if (!stateChanges?.length) return;

    // Draw the full entity in a dulled colour, then draw survivors on top.
    const dulledEntity = Utils.cloneObject(entity);
    dulledEntity.setColour(Colour.blend(entity.getDrawColour(), DesignCore.Settings.canvasbackgroundcolour, DesignCore.Settings.previewBlendFactor));
    DesignCore.Scene.previewEntities.add(dulledEntity);

    for (const change of stateChanges) {
      if (change instanceof AddState) {
        DesignCore.Scene.previewEntities.add(change.entity);
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    if (this.selectedItem && this.selectedBoundaryItems.length) {
      const intersectPoints = this.#collectIntersectPoints(this.selectedItem);

      if (intersectPoints.length) {
        const stateChanges = this.#trimEntity(this.selectedItem, intersectPoints);
        if (stateChanges?.length) {
          DesignCore.Scene.commit(stateChanges);
        }
      } else {
        DesignCore.Core.notify(`${this.type} - ${this.selectedItem.type} ${Strings.Message.NOTRIM}`);
      }
    }

    this.selectedItem = null;
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
        const intersect = Intersection.intersectPolylinePolyline(boundaryItem.toPolylinePoints(), entity.toPolylinePoints());
        intersectPoints.push(...intersect.points);
      } catch {
        // skip unsupported entity combinations
      }
    }
    return intersectPoints;
  }

  /**
   * Compute state changes to trim entity at the pair of intersection points
   * surrounding the mouse position. Operates entirely in polyline-point space
   * via entity.toPolylinePoints() / entity.fromPolylinePoints(), so it works
   * for any entity that implements that protocol (Line, Arc, Circle,
   * BasePolyline, and future entities such as Spline or Ellipse).
   * @param {Object} entity
   * @param {Array}  intersectPoints
   * @return {Array}
   */
  #trimEntity(entity, intersectPoints) {
    const polyPoints = entity.toPolylinePoints();
    const mousePosition = DesignCore.Mouse.pointOnScene();

    // Drop any intersection point that coincides with an existing vertex
    const filtered = intersectPoints.filter((p) => !polyPoints.some((v) => v.isSame(p)));
    if (!filtered.length) return [];

    // Locate each intersection point within the polyline segments
    const locatedIntersections = [];
    for (const point of filtered) {
      for (let i = 1; i < polyPoints.length; i++) {
        if (PolylineUtils.isPointOnSegment(point, polyPoints[i - 1], polyPoints[i])) {
          locatedIntersections.push({
            segmentIndex: i,
            point,
            positionAlongSegment: PolylineUtils.positionOnSegment(polyPoints, point, i),
          });
          break;
        }
      }
    }

    if (!locatedIntersections.length) return [];

    locatedIntersections.sort((a, b) => {
      if (a.segmentIndex !== b.segmentIndex) return a.segmentIndex - b.segmentIndex;
      return a.positionAlongSegment - b.positionAlongSegment;
    });

    // Find which segment the mouse is closest to
    let mouseSegmentIndex = 0;
    let minDistance = Infinity;
    for (let i = 1; i < polyPoints.length; i++) {
      const closest = PolylineUtils.closestPointOnSegment(polyPoints, mousePosition, i);
      if (closest) {
        const dist = mousePosition.distance(closest);
        if (dist < minDistance) {
          minDistance = dist;
          mouseSegmentIndex = i;
        }
      }
    }

    const mouseClosest = PolylineUtils.closestPointOnSegment(polyPoints, mousePosition, mouseSegmentIndex);
    const mousePos = mouseClosest ?
      PolylineUtils.positionOnSegment(polyPoints, mouseClosest, mouseSegmentIndex) :
      0;

    // Find the nearest intersections before and after the mouse position
    let trimBefore = null;
    let trimAfter = null;
    for (const loc of locatedIntersections) {
      if (loc.segmentIndex < mouseSegmentIndex) {
        trimBefore = loc;
      } else if (loc.segmentIndex === mouseSegmentIndex) {
        if (loc.positionAlongSegment <= mousePos) {
          trimBefore = loc;
        } else if (!trimAfter) {
          trimAfter = loc;
        }
      } else if (!trimAfter) {
        trimAfter = loc;
      }
    }

    // Build Portion 1 points: start of entity to trimBefore
    let portion1Points = null;
    if (trimBefore) {
      const points = [];
      for (let i = 0; i < trimBefore.segmentIndex - 1; i++) {
        points.push(polyPoints[i].clone());
      }
      const segStart = polyPoints[trimBefore.segmentIndex - 1];
      const segStartClone = segStart.clone();
      if (segStart.bulge !== 0 && segStart.bulge !== undefined) {
        segStartClone.bulge = segStart.partialBulge(polyPoints[trimBefore.segmentIndex], trimBefore.point);
      }
      points.push(segStartClone);
      const trimPoint = trimBefore.point.clone();
      if (!points.at(-1).isSame(trimPoint)) points.push(trimPoint);
      if (points.length >= 2) portion1Points = points;
    }

    // Build Portion 2 points: trimAfter to end of entity
    let portion2Points = null;
    if (trimAfter) {
      const points = [];
      const trimPoint = trimAfter.point.clone();
      const segStart = polyPoints[trimAfter.segmentIndex - 1];
      if (segStart.bulge !== 0 && segStart.bulge !== undefined) {
        trimPoint.bulge = segStart.partialBulge(polyPoints[trimAfter.segmentIndex], trimPoint, true);
      }
      points.push(trimPoint);
      for (let i = trimAfter.segmentIndex; i < polyPoints.length; i++) {
        const nextPoint = polyPoints[i].clone();
        if (!points.at(-1).isSame(nextPoint)) points.push(nextPoint);
      }
      if (points.length >= 2) portion2Points = points;
    }

    const stateChanges = [];
    const isClosed = polyPoints[0].isSame(polyPoints.at(-1));

    if (isClosed && portion1Points && portion2Points) {
      // Closed entity trimmed at two points: the two open-ended portions are
      // actually one continuous arc/path running from trimAfter → seam → trimBefore.
      // Drop the bulge-less closure point at the end of portion2 and prepend
      // portion2 before portion1 so the bulge on portion1[0] is preserved.
      const joinedPoints = [...portion2Points.slice(0, -1), ...portion1Points];
      const output = Utils.cloneObject(entity).fromPolylinePoints(joinedPoints);
      output.flags?.removeValue(1);
      stateChanges.push(new AddState(output));
    } else {
      if (portion1Points) {
        const output = Utils.cloneObject(entity).fromPolylinePoints(portion1Points);
        output.flags?.removeValue(1);
        stateChanges.push(new AddState(output));
      }
      if (portion2Points) {
        const output = Utils.cloneObject(entity).fromPolylinePoints(portion2Points);
        output.flags?.removeValue(1);
        stateChanges.push(new AddState(output));
      }
    }

    if (trimBefore || trimAfter) {
      stateChanges.push(new RemoveState(entity));
    }

    return stateChanges;
  }
}

