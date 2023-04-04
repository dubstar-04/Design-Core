import {Utils} from './utils.js';

// TODO: Refactor class.
export class Selection {
  constructor(core) {
    this.core = core;
    this.selectionSet = []; // store a list of selected items indices
    this.selectionAccepted = false; // Store a bool so we know when the selectionSet has been accepted
    this.selectedItems = []; // store a copy of selected items
  }

  /**
   * Reset the selection state
   */
  reset() {
    this.selectedItems = [];
    this.selectionSet = [];
    this.selectionSetChanged();
    this.selectionAccepted = false;
  }

  /**
   * Handle selection set changes
   */
  selectionSetChanged() {
    // signal to the properties manager that the selection set is changed
    this.core.propertyManager.selectionSetChanged();
  }

  /**
   * Find items within a selection window
   */
  windowSelect() {
    const selectionRect = this.getSelectionRect();
    const crossingSelect = this.core.mouse.pointOnScene().y > this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y;

    if (selectionRect !== undefined) {
    // Loop through all the entities and see if it should be selected
      for (let i = 0; i < this.core.scene.items.length; i++) {
      // check if the item is within the selection rect
        if (this.core.scene.items[i].within(selectionRect, this.core)) {
          this.addToSelectionSet(i);
        }

        if (crossingSelect) {
        // check if the item is touched / crossed by the selection rect
          if (this.core.scene.items[i].touched(selectionRect, this.core)) {
            this.addToSelectionSet(i);
          }
        }
      }

      // this.core.canvas.requestPaint();
      this.selectionSetChanged();
    }
  }

  /**
   * Get the rectangle points formed between mouseDown and current mouse location
   * @return {array} selectionRect - [x1, x2, y1, y2]
   */
  getSelectionRect() {
    // TODO: It would be nice if this returned an object {xmin: xmin, ymin:ymin ...}
    const xmin = Math.min(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).x, this.core.mouse.pointOnScene().x);
    const xmax = Math.max(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).x, this.core.mouse.pointOnScene().x);
    const ymin = Math.min(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y, this.core.mouse.pointOnScene().y);
    const ymax = Math.max(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y, this.core.mouse.pointOnScene().y);

    const selectionRect = [xmin, xmax, ymin, ymax];

    return selectionRect;
  }


  /**
   * Select the item closest to the mouse and add it to the selection set
   */
  singleSelect() {
    const closestItemIndex = this.findClosestItem();

    if (closestItemIndex !== undefined) {
      this.addToSelectionSet(closestItemIndex);
      this.selectionSetChanged();
    } else {
      this.reset();
    }
  }

  /**
   * Find closest item to mouse press
   * @returns {Integer} - return index of closest item or undefined
   */
  findClosestItem() {
    let delta = 1.65 / this.core.canvas.getScale(); // find a more suitable starting value
    let closestItemIndex;

    for (let i = 0; i < this.core.scene.items.length; i++) {
      const distance = this.core.scene.items[i].closestPoint(this.core.mouse.pointOnScene())[1]; // ClosestPoint()[1] returns a distance to the closest point

      if (distance < delta) {
        delta = distance;
        closestItemIndex = i;
      }
    }

    return closestItemIndex;
  }

  /**
  * Remove the item at index from the selectionSet and selectedItems
  * @param  {Integer} index - index of the item in scene.items
  */
  removeFromSelectionSet(index) {
    const itemIndex = this.selectionSet.indexOf(index);
    if (itemIndex !== -1) {
      this.selectionSet.splice(itemIndex, 1);
      this.selectedItems.splice(itemIndex, 1);
    }
  }

  /**
  * Add the item at index to the selectionSet and selectedItems
  * @param  {Integer} index
  */
  addToSelectionSet(index) {
    // only store selections once
    if (this.selectionSet.indexOf(index) === -1) {
      this.selectionSet.push(index);
      this.addToSelectedItems(index);
    }
  }

  /**
   * Duplicate the item at index and add to selectedItems
   * @param  {Integer} index
   */
  addToSelectedItems(index) {
    const copyofitem = Utils.cloneObject(this.core, this.core.scene.items[index]);
    copyofitem.colour = this.core.settings.selecteditemscolour.toString();
    copyofitem.lineWidth = copyofitem.lineWidth * 2;
    this.selectedItems.push(copyofitem);
  }

  /**
   * Reload the selectedItems
   * This is required following changes to selected item properties
   */
  reloadSelectedItems() {
    this.selectedItems = [];

    for (let i = 0; i < this.selectionSet.length; i++) {
      this.addToSelectedItems(this.selectionSet[i]);
    }

    this.core.canvas.requestPaint();
  }
}