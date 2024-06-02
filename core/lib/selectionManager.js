import {Utils} from './utils.js';
import {SelectionWindow} from './selectionWindow.js';
import {DesignCore} from '../designCore.js';

/** SingleSelection Class */
export class SingleSelection {
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
  /** Create SelectionSet */
  constructor() {
    this.accepted = false;
    this.selectionSet = [];
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

    DesignCore.Scene.addToAuxiliaryItems(new SelectionWindow(data));
  }

  /**
   * Find items within a selection window
   */
  windowSelect() {
    const selectionRect = this.getSelectionRect();
    const crossingSelect = DesignCore.Mouse.pointOnScene().y >DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint).y;

    if (selectionRect !== undefined) {
    // Loop through all the entities and see if it should be selected
      for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      // check if the item is within the selection rect
        if (DesignCore.Scene.items[i].within(selectionRect)) {
          this.addToSelectionSet(i);
        }

        if (crossingSelect) {
        // check if the item is touched / crossed by the selection rect
          if (DesignCore.Scene.items[i].touched(selectionRect)) {
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
   * @return {Array} selectionRect - [x1, x2, y1, y2]
   */
  getSelectionRect() {
    // TODO: It would be nice if this returned an object {xmin: xmin, ymin:ymin ...}
    const xmin = Math.min(DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint).x, DesignCore.Mouse.pointOnScene().x);
    const xmax = Math.max(DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint).x, DesignCore.Mouse.pointOnScene().x);
    const ymin = Math.min(DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint).y, DesignCore.Mouse.pointOnScene().y);
    const ymax = Math.max(DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint).y, DesignCore.Mouse.pointOnScene().y);

    const selectionRect = [xmin, xmax, ymin, ymax];

    return selectionRect;
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
    let delta = 1.65 /DesignCore.Core.canvas.getScale(); // find a more suitable starting value
    let closestItemIndex;

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      // check the items layer is selectable - i.e. on, thawed, etc...
      const layer = DesignCore.LayerManager.getItemByName(DesignCore.Scene.items[i].layer);

      if (!layer.isSelectable) {
        continue;
      }

      const distance = DesignCore.Scene.items[i].closestPoint(point)[1]; // ClosestPoint()[1] returns a distance to the closest point

      if (distance < delta) {
        delta = distance;
        closestItemIndex = i;
      }
    }

    return closestItemIndex;
  }

  /**
  * Remove the item at index from the selectionSet and selectedItems
  * @param  {number} index - index of the item in scene.items
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
    const copyofitem = Utils.cloneObject(DesignCore.Scene.items[index]);
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
}
