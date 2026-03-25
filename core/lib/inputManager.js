import { Tool } from '../tools/tool.js';
import { Snapping } from './snapping.js';
import { Utils } from './utils.js';

import { DesignCore } from '../designCore.js';
import { Point } from '../entities/point.js';
import { MouseStateChange } from './mouseStateChange.js';
import { Input } from './input.js';

export { MouseStateChange } from './mouseStateChange.js';
export { Input } from './input.js';
export { PromptOptions } from './promptOptions.js';

/** InputManager Class */
export class InputManager {
  /** Create InputManager */
  constructor() {
    this.activeCommand = undefined;

    this.selection = undefined;
    this.promptOption = undefined;

    // save the last point input
    // this is needed for snapping, polar, ortho etc.
    this.inputPoint = new Point();

    this.snapping = new Snapping();
  }

  /**
   * Reset the inputManager
   */
  reset() {
    this.snapping.active = false;
    DesignCore.CommandLine.resetPrompt();
    this.activeCommand = undefined;

    if (this.promptOption) {
      this.promptOption.cancel();
    }

    this.promptOption = undefined;
    DesignCore.Scene.reset();
  }

  /**
 * Create input request
 * @param {PromptOption} promptOption
 * @return {Object} promise
 */
  requestInput(promptOption) {
    this.promptOption = promptOption;
    this.setPrompt(this.promptOption.getPrompt());

    // Check the requested input types are valid
    promptOption.types.forEach((type) => {
      if (type === undefined) {
        throw Error('Undefined Input.Type');
      }

      if (!Object.values(Input.Type).includes(type)) {
        throw Error('Invalid input type');
      }
    });

    if (promptOption.types.includes(Input.Type.POINT)) {
      // turn on snapping
      this.snapping.active = true;
    }

    return new Promise((resolve, reject) => {
      this.promptOption.setResolve(resolve);
      this.promptOption.setReject(reject);
    });
  }

  /**
   * Handle command input
   * @param {any} input
   */
  onCommand(input) {
    if (this.activeCommand !== undefined) {
      let handledByPrompt = false;

      if (this.promptOption) {
        const inputType = Input.getType(input);
        const matchesType = inputType !== undefined && this.promptOption.types.includes(inputType);
        const matchesOption = this.promptOption.parseInputToOption(input) !== undefined;

        if (matchesType || matchesOption) {
          this.promptOption.respond(input);
          handledByPrompt = true;
        }
      }

      if (!handledByPrompt) {
        if (DesignCore.CommandManager.isCommandOrShortcut(input)) {
          this.reset();
          this.initialiseItem(DesignCore.CommandManager.getCommand(input));
          this.activeCommand.execute();
        } else if (this.promptOption) {
          // input does not match the active prompt type or any option — ignore it
          return;
        }
      }
    } else if (DesignCore.CommandManager.isCommandOrShortcut(input)) {
      this.initialiseItem(DesignCore.CommandManager.getCommand(input));
      this.activeCommand.execute();
    }
  }

  /**
   * Handle enter / return presses
   */
  onEnterPressed() {
    if (this.activeCommand !== undefined) {
      if (this.promptOption?.types.includes(Input.Type.SELECTIONSET) && DesignCore.Scene.selectionManager.selectionSet.accepted !== true) {
        DesignCore.Scene.selectionManager.selectionSet.accepted = true;
        this.promptOption.respond(DesignCore.Scene.selectionManager.selectionSet);
      } else {
        this.reset();
      }
    } else {
      const lastCommand = DesignCore.CommandLine.lastCommand[0];
      // if there was a previous command - repeat it...
      if (lastCommand) {
        this.initialiseItem(lastCommand);
        this.activeCommand.execute();
      }
    }
  }

  /**
   * Handle escape presses to reset
   */
  onEscapePressed() {
    this.reset();
  }

  /**
   * Handle left click input
   * @param {Point} point
   */
  onLeftClick(point) {
    // left clicks are used for selection of entities and points
    // Selection of entities can only occur if there is no active snap available
    // Selection of entities can only occur if the mouse is over an entity
    // Final selection is a non-snapped point on the scene

    // Selection Priority:
    // Point snapping
    // Entity Selection
    // Point of scene

    // TODO: snap and index is already performed during mouse moves
    const snap = this.snapping.snap();
    const index = DesignCore.Scene.selectionManager.findClosestItem(DesignCore.Mouse.pointOnScene());

    // Select entity only mouse is close to an entity and no snap point is available
    // Do allow selection when there is no command active
    // Don't allow selection of there is an active command that does't require a selection i.e. prompt option includes SINGLESELECTION
    const canSelectEntity = index !== undefined && !snap &&
      (this.activeCommand === undefined ||
        this.promptOption?.types.includes(Input.Type.SINGLESELECTION) ||
        this.promptOption?.types.includes(Input.Type.SELECTIONSET));

    if (canSelectEntity) {
      const selection = DesignCore.Scene.selectionManager.singleSelect(DesignCore.Mouse.pointOnScene());
      this.onSelection(selection);
    } else if (this.promptOption !== undefined && this.promptOption.types.includes(Input.Type.POINT)) {
      this.snapping.active = false;
      this.promptOption.respond(point);
    }
  }

  /**
   * Handle mouse position changes
   */
  mouseMoved() {
    DesignCore.Scene.tempEntities.clear();
    DesignCore.Scene.auxiliaryEntities.clear();

    if (DesignCore.Mouse.buttonOneDown) {
      const windowSelect = !this.promptOption || this.promptOption.types.includes(Input.Type.SELECTIONSET);

      if (windowSelect) {
        DesignCore.Scene.selectionManager.drawSelectionWindow();
      }
    }

    // store the snapped point
    let snapped;
    let selecting = false;
    if (this.snapping.active) {
      snapped = this.snapping.snap();
    }

    // Determine if the mouse is over a scene item only if no snap point is available
    if (snapped === undefined) {
      if (this.activeCommand === undefined || this.promptOption?.types.includes(Input.Type.SINGLESELECTION) || this.promptOption?.types.includes(Input.Type.SELECTIONSET)) {
        const index = DesignCore.Scene.selectionManager.findClosestItem(DesignCore.Mouse.pointOnScene());
        if (index !== undefined) {
          const copyofitem = Utils.cloneObject(DesignCore.Scene.entities.get(index));
          DesignCore.Scene.tempEntities.add(copyofitem);
          selecting = true;
        }
      }
    }

    // preview active commands when items are not being selected
    if (this.activeCommand !== undefined && !selecting) {
      this.activeCommand.preview();
    }

    DesignCore.Canvas.requestPaint();
  }

  /**
   * Handle single selection
   */
  singleSelect() {
    this.inputPoint = DesignCore.Mouse.pointOnScene();
    this.onLeftClick(this.inputPoint);
  }

  /**
   * Handle window selection
   */
  windowSelect() {
    DesignCore.Scene.selectionManager.windowSelect();
  }


  /**
 * Handle mouse down
 * @param {number} button
 */
  mouseDown(button) {
    switch (button) {
      case 0: // left button
        // TODO: can't select and window select at the same time
        // This needs combining with canvas.mouseMove to define selection, snapping and window selection
        this.singleSelect();
        if (this.promptOption?.types.includes(Input.Type.MOUSESTATECHANGE)) {
          const point = DesignCore.Mouse.pointOnScene();
          const mouseStateChange = new MouseStateChange(point);
          this.promptOption.respond(mouseStateChange);
        }
        break;
      case 1: // middle button
        break;
      case 2: // right button
        break;
    }
  };

  /**
 * Handle mouse up
 * @param {number} button
 */
  mouseUp(button) {
    switch (button) {
      case 0: // left button
        // Clear tempItems - This is here to remove the crossing window
        DesignCore.Scene.auxiliaryEntities.clear();


        if (this.promptOption !== undefined) {
          if (this.promptOption.types.includes(Input.Type.MOUSESTATECHANGE)) {
            const point = DesignCore.Mouse.pointOnScene();
            const mouseStateChange = new MouseStateChange(point);
            this.promptOption.respond(mouseStateChange);
          }
          // check if the active command requires a selection set
          if (!this.promptOption.types.includes(Input.Type.SELECTIONSET)) {
            return;
          }
        }

        // check if the mouse position has changed since mousedown
        if (!DesignCore.Mouse.mouseDownCanvasPoint.isSame(DesignCore.Mouse.pointOnCanvas())) {
          this.windowSelect();
        }

        break;
      case 1: // middle button
        break;
      case 2: // right button
        this.onEnterPressed();
        break;
    }
  };

  /**
   * Handle canvas selection
   * @param {Selection} selection
   */
  onSelection(selection) {
    if (this.activeCommand !== undefined && this.promptOption.types.includes(Input.Type.SINGLESELECTION)) {
      this.promptOption.respond(selection);
    } else {
      if (Input.getType(selection) === Input.Type.SINGLESELECTION) {
        DesignCore.Scene.selectionManager.addToSelectionSet(selection.selectedItemIndex);
      }
    }
  }

  /**
 * Initialise commands
 * @param {string} command
 */
  initialiseItem(command) {
    DesignCore.CommandLine.addToCommandHistory(command);
    this.activeCommand = DesignCore.CommandManager.createNew(command);
  };

  /**
   * Set the command prompt
   * @param {string} prompt
   */
  setPrompt(prompt) {
    // return if there is no active command
    if (this.activeCommand === undefined) {
      return;
    }

    DesignCore.CommandLine.setPrompt(`${this.activeCommand.type}${prompt ? '- ':''}${prompt}`);
  }

  /**
   * Execute the currently active command then reset
   * @param {Object} item - item to create
   * @param {number} index - index of item
   */
  executeCommand(item, index = undefined) {
    this.actionCommand(item, index);
    this.reset();
  }

  /**
   * Execute the currently active command without reset
   * @param {Object} item - item to create
   * @param {number} index - index of item
   * @return {number}
   */
  actionCommand(item, index = undefined) {
    if (this.activeCommand instanceof Tool) {
      this.activeCommand.action();
    } else {
      if (item !== undefined) {
      // set the items layer to the current layer
        item.layer = DesignCore.LayerManager.getCstyle();
        // return the item index
        return DesignCore.Scene.addItem(item.type, item, index);
      }
    }
  }
}
