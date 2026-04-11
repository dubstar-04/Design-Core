import { Intersection } from '../lib/intersect.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Entity } from '../entities/entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { AddState } from '../lib/stateManager.js';
import { Utils } from '../lib/utils.js';
import { Colour } from '../lib/colour.js';

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
    if (entity.trim === Entity.prototype.trim) return;
    const intersectPoints = this.#collectIntersectPoints(entity);
    if (!intersectPoints.length) return;

    const stateChanges = entity.trim(intersectPoints);
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
        const stateChanges = this.selectedItem.trim(intersectPoints);
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
}

