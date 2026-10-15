import { Tool } from './tool.js';
import { Strings } from '../lib/strings.js';
import { Input } from '../lib/input.js';
import { PromptOptions } from '../lib/promptOptions.js';
import { Logging } from '../lib/logging.js';
import { UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * GripStretch Command Class
 * Not shown in any toolbar and never started via the command line - only InputManager creates it.
 * @extends Tool
 */
export class GripStretch extends Tool {
  static type = 'GripStretch';

  /**
   * Create a GripStretch command
   * @param {number} entityIndex - index of the entity in the selection set that owns the grip
   * @param {Object} grip - { point, apply } descriptor returned by Entity.getGrips()
   */
  constructor(entityIndex, grip) {
    super();
    this.entityIndex = entityIndex;
    this.grip = grip;
  }

  /**
   * Execute method
   * requests the stretch point, then commits it - keeping the entity selected afterwards
   * (with its grips still visible), unlike most commands which deselect on completion
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.STRETCHPOINT, [Input.Type.POINT]);
      const newPoint = await DesignCore.Scene.inputManager.requestInput(op);
      if (newPoint === undefined) return;
      this.points.push(newPoint);

      const inputManager = DesignCore.Scene.inputManager;
      inputManager.actionCommand();

      // finish without the standard executeCommand()/reset() combo, which would deselect the
      // entity via Scene.reset() - grip editing must leave it selected (grips still visible)
      inputManager.activeCommand = undefined;
      inputManager.promptOption = undefined;
      // reset() normally clears this - without it the next command's first point (or the next
      // grip drag's tracking line) would stay anchored to this drop, not start fresh
      inputManager.inputPoint = null;
      DesignCore.CommandLine.resetPrompt();
      DesignCore.Scene.selectionManager.reloadSelectedEntities();
      DesignCore.Canvas.requestPaint();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the live grip position while dragging
   */
  preview() {
    const newPoints = this.grip.apply(DesignCore.Mouse.pointOnScene());
    const previewIndex = DesignCore.Scene.selectionManager.selectionSet.selectionSet.indexOf(this.entityIndex);
    if (previewIndex !== -1) {
      DesignCore.Scene.selectionManager.selectedEntities[previewIndex].setProperty('points', newPoints);
    }
  }

  /**
   * Perform the command - commits the grip's new (dropped) position
   */
  action() {
    const entity = DesignCore.Scene.entities.get(this.entityIndex);
    const newPoints = this.grip.apply(this.points[0]);
    const properties = { points: newPoints };
    // all grips currently implemented reposition dimension text - record the flag
    // explicitly so its pre-drag value is captured by the UpdateState undo snapshot too
    if (entity.dimType) {
      properties.userPositionedText = true;
    }
    DesignCore.Scene.commit([new UpdateState(entity, properties)]);
  }

  /**
   * Cancel the in-progress stretch - unlike Tool's default (full reset), this must not deselect
   * the entity, and must resolve the suspended execute()'s pending requestInput() promise so it
   * doesn't stay forever awaiting a prompt nobody can respond to or cancel again
   */
  cancel() {
    const inputManager = DesignCore.Scene.inputManager;
    inputManager.promptOption?.cancel();
    inputManager.promptOption = undefined;
    inputManager.activeCommand = undefined;
    DesignCore.Scene.selectionManager.reloadSelectedEntities();
  }
}
