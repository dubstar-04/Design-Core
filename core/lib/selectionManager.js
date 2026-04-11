import { Utils } from './utils.js';
import { Point } from '../entities/point.js';
import { SelectionWindow } from './auxiliary/selectionWindow.js';
import { DesignCore } from '../designCore.js';

/** SingleSelection Class */
export class SingleSelection {
  static type = 'SingleSelection';

  /**
   * Create a SingleSelection
   * @param {number} index
   * @param {Point} point
   */
  constructor(index, point) {
    this.selectedItemIndex = index;
    this.selectedPoint = point;
  }
}

/** SelectionSet Class */
export class SelectionSet {
  static type = 'SelectionSet';

  /** Create SelectionSet */
  constructor() {
    this.accepted = false;
    this.selectionSet = [];
  }

  /**
   * Remove the last selection from the selectionSet
   */
  removeLastSelection() {
    this.selectionSet.pop();
  }
}

// TODO: Refactor class.
/** Selection Manager Class */
export class SelectionManager {
  /** Create a SelectionManager */
  constructor() {
    this.selectionSet = new SelectionSet(); // store a list of selected items indices
    this.selectedItems = []; // store a copy of selected items
  }

  /**
   * Reset the selection state
   */
  reset() {
    this.selectedItems = [];
    this.selectionSet = new SelectionSet();
    this.selectionSetChanged();
  }

  /**
   * Remove the last selection from the selected items
   */
  removeLastSelection() {
    this.selectedItems.pop();
    this.selectionSet.removeLastSelection();
    this.selectionSetChanged();
  }

  /**
   * Handle selection set changes
   */
  selectionSetChanged() {
    // signal to the properties manager that the selection set is changed
    DesignCore.Core.propertyManager.selectionSetChanged();
  }

  /**
   * Draw the selection selection window
   */
  drawSelectionWindow() {
    const selectionPoints = [];
    selectionPoints.push(DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint));
    selectionPoints.push(DesignCore.Mouse.pointOnScene());

    const data = {
      points: selectionPoints,
    };

    DesignCore.Scene.auxiliaryEntities.add(new SelectionWindow(data));
  }

  /**
   * Find items within a selection window
   */
  windowSelect() {
    const selectionRect = this.getSelectionRect();
    const crossingSelect = DesignCore.Mouse.pointOnScene().y > DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint).y;

    if (selectionRect !== undefined) {
      // Loop through all the entities and see if it should be selected
      for (let i = 0; i < DesignCore.Scene.entities.count(); i++) {
        // check if the item is within the selection rect
        if (DesignCore.Scene.entities.get(i).within(selectionRect)) {
          this.addToSelectionSet(i);
        }

        if (crossingSelect) {
          // check if the item is touched / crossed by the selection rect
          if (DesignCore.Scene.entities.get(i).touched(selectionRect)) {
            this.addToSelectionSet(i);
          }
        }
      }

      this.selectionSetChanged();
    }
    DesignCore.Core.canvas.requestPaint();
  }

  /**
   * Get the rectangle points formed between mouseDown and current mouse location
   * @return {Object} selectionRect - {min: Point, max: Point}
   */
  getSelectionRect() {
    const p1 = DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint);
    const p2 = DesignCore.Mouse.pointOnScene();

    return {
      min: new Point(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y)),
      max: new Point(Math.max(p1.x, p2.x), Math.max(p1.y, p2.y)),
    };
  }


  /**
   * Select the item closest to the mouse and add it to the selection set
   * @param {Point} point
   * @return {SingleSelection} - return single selection
   */
  singleSelect(point) {
    const closestItemIndex = this.findClosestItem(point);
    if (closestItemIndex !== undefined) {
      this.addToSelectionSet(closestItemIndex);
      this.selectionSetChanged();
      const selection = new SingleSelection(closestItemIndex, point);
      return selection;
    }

    this.reset();
    return new SingleSelection();
  }

  /**
   * Find closest item to point
   * @param  {Point} point
   * @return {number} - return index of closest item or undefined
   */
  findClosestItem(point) {
    return DesignCore.Scene.entities.findClosest(point);
  }

  /**
  * Remove the item at index from the selectionSet and selectedItems
  * @param  {number} index - index of the item
  */
  removeFromSelectionSet(index) {
    const itemIndex = this.selectionSet.selectionSet.indexOf(index);
    if (itemIndex !== -1) {
      this.selectionSet.selectionSet.splice(itemIndex, 1);
      this.selectedItems.splice(itemIndex, 1);
    }
  }

  /**
  * Add the item at index to the selectionSet and selectedItems
  * @param  {number} index
  */
  addToSelectionSet(index) {
    if (index === undefined) {
      return;
    }
    // only store selections once
    if (this.selectionSet.selectionSet.indexOf(index) === -1) {
      this.selectionSet.selectionSet.push(index);
      this.addToSelectedItems(index);
    }
  }

  /**
   * Duplicate the item at index and add to selectedItems
   * @param  {number} index
   */
  addToSelectedItems(index) {
    const copyofitem = Utils.cloneObject(DesignCore.Scene.entities.get(index));
    this.selectedItems.push(copyofitem);
  }

  /**
   * Reload the selectedItems
   * This is required following changes to selected item properties
   */
  reloadSelectedItems() {
    this.selectedItems = [];

    for (let i = 0; i < this.selectionSet.selectionSet.length; i++) {
      this.addToSelectedItems(this.selectionSet.selectionSet[i]);
    }

    DesignCore.Core.canvas.requestPaint();
  }

  /**
   * Select all items on the canvas
   */
  selectAll() {
    // Clear current selection
    this.reset();

    // Add all selectable items to the selection
    for (let i = 0; i < DesignCore.Scene.entities.count(); i++) {
      const layer = DesignCore.LayerManager.getItemByName(DesignCore.Scene.entities.get(i).layer);

      // Only select items on selectable layers
      if (layer?.isSelectable) {
        this.addToSelectionSet(i);
      }
    }

    this.selectionSetChanged();
    DesignCore.Core.canvas.requestPaint();
  }
}
