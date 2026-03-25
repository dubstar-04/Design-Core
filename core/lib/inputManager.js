import { Tool } from '../tools/tool.js';
import { Snapping } from './snapping.js';
import { Utils } from './utils.js';

import { DesignCore } from '../designCore.js';
import { Point } from '../entities/point.js';
import { Input } from './input.js';

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
      this.snapping.active = true;
    }

    return promptOption.createPromise().then((input) => {
      if (input === undefined) return undefined;

      // Handle DYNAMIC: convert number to projected point
      if (promptOption.types.includes(Input.Type.DYNAMIC) && !isNaN(input)) {
        const angle = this.inputPoint.angle(DesignCore.Mouse.pointOnScene());
        input = this.inputPoint.project(angle, input);
      }

      // Track the last input point
      if (input instanceof Point) {
        this.inputPoint = input;
      }

      return input;
    });
  }

  /**
   * Handle command input
   * @param {any} input
   */
  onCommand(input) {
    // If the active prompt would accept this input, pass it through directly
    if (this.activeCommand !== undefined && this.promptOption) {
      const accepted = this.promptOption.acceptsInput(input) ||
                       this.promptOption.parseInputToOption(input) !== undefined;
      if (accepted) {
        this.promptOption.respond(input);
        return;
      }
    }

    // If it's a recognised command/shortcut, switch commands without
    // passing through the prompt (avoids a spurious invalid-input notification)
    if (DesignCore.CommandManager.isCommandOrShortcut(input)) {
      this.startCommand(input);
      return;
    }

    // Input is neither accepted by the prompt nor a command — let the prompt notify
    if (this.activeCommand !== undefined) {
      this.handlePromptInput(input);
    }
  }

  /**
   * Handle a command triggered by a UI button press.
   * Always resets any active command and starts the new one,
   * bypassing the active prompt entirely.
   * @param {string} command
   */
  onCommandButton(command) {
    if (DesignCore.CommandManager.isCommandOrShortcut(command)) {
      this.startCommand(command);
    }
  }

  /**
   * Reset any active command and start a new one.
   * @param {string} command - command name or shortcut
   */
  startCommand(command) {
    if (this.activeCommand !== undefined) {
      this.reset();
    }

    const resolvedCommand = DesignCore.CommandManager.getCommand(command);
    DesignCore.CommandLine.addToCommandHistory(resolvedCommand);
    this.activeCommand = DesignCore.CommandManager.createNew(resolvedCommand);
    this.activeCommand.execute();
  }

  /**
   * Try to handle input with the active prompt
   * @param {any} input
   * @return {boolean} true if handled
   */
  handlePromptInput(input) {
    if (!this.promptOption) {
      return false;
    }

    return this.promptOption.respond(input);
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
        this.startCommand(lastCommand);
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
      const windowSelect = (this.activeCommand === undefined && !this.promptOption) ||
        this.promptOption?.types.includes(Input.Type.SELECTIONSET);

      if (windowSelect) {
        DesignCore.Scene.selectionManager.drawSelectionWindow();
      }
    }

    const snapped = this.snapping.active && this.snapping.snap();
    const selecting = !snapped && this.highlightEntityUnderMouse();

    // preview active commands when items are not being selected
    if (this.activeCommand !== undefined && !selecting) {
      this.activeCommand.preview();
    }

    DesignCore.Canvas.requestPaint();
  }

  /**
   * Highlight the entity under the mouse cursor
   * @return {boolean} true if an entity was highlighted
   */
  highlightEntityUnderMouse() {
    if (this.activeCommand !== undefined &&
      !this.promptOption?.types.includes(Input.Type.SINGLESELECTION) &&
      !this.promptOption?.types.includes(Input.Type.SELECTIONSET)) {
      return false;
    }

    const index = DesignCore.Scene.selectionManager.findClosestItem(DesignCore.Mouse.pointOnScene());
    if (index !== undefined) {
      DesignCore.Scene.tempEntities.add(Utils.cloneObject(DesignCore.Scene.entities.get(index)));
      return true;
    }

    return false;
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
        this.singleSelect();
        if (this.promptOption?.types.includes(Input.Type.MOUSEDOWN)) {
          this.promptOption.resolve?.(true);
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
        if (this.promptOption?.types.includes(Input.Type.MOUSEUP)) {
          this.promptOption.resolve?.(true);
          return;
        }

        // Skip window selection when there is an active prompt or command, unless it is a selection set
        if ((this.promptOption !== undefined || this.activeCommand !== undefined) &&
            !this.promptOption?.types.includes(Input.Type.SELECTIONSET)) {
          return;
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
      return;
    }

    if (Input.getType(selection) === Input.Type.SINGLESELECTION) {
      DesignCore.Scene.selectionManager.addToSelectionSet(selection.selectedItemIndex);
    }
  }

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
