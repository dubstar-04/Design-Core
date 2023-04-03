import {Utils} from './utils.js';

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
   * Find closest item to mouse press
   */
    let delta = 1.65 / this.core.canvas.getScale(); // find a more suitable starting value
    let closestItem;
  windowSelect() {

    for (let i = 0; i < this.core.scene.items.length; i++) {
      const distance = this.core.scene.items[i].closestPoint(this.core.mouse.pointOnScene())[1]; // ClosestPoint()[1] returns a distance to the closest point

      if (distance < delta) {
        delta = distance;
        closestItem = i;
      }
    }

    return closestItem;
  }

  /**
   * Find items within a selection window
   */
    // Clear tempItems - This is here to remove the crossing window
    this.core.scene.tempItems = [];

    this.core.mouse.mouseDownCanvasPoint;
    this.core.mouse.pointOnScene();

    const xmin = Math.min(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).x, this.core.mouse.pointOnScene().x);
    const xmax = Math.max(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).x, this.core.mouse.pointOnScene().x);
    const ymin = Math.min(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y, this.core.mouse.pointOnScene().y);
    const ymax = Math.max(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y, this.core.mouse.pointOnScene().y);

    const selectionExtremes = [xmin, xmax, ymin, ymax];

    // Loop through all the entities and see if it should be selected
    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (this.core.mouse.pointOnScene().y > this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y) {
        if (this.core.scene.items[i].touched(selectionExtremes, this.core) || this.core.scene.items[i].within(selectionExtremes, this.core)) {
          this.addToSelectionSet(i);
        }
      } else {
        if (this.core.scene.items[i].within(selectionExtremes, this.core)) {
          this.addToSelectionSet(i);
        }
      }
    }

    this.core.canvas.requestPaint();
    this.core.scene.selection.selectionSetChanged();
  }


  /**
   * Select the closest item and add it to the selection set
   * @param  {Object} data
   */
  selectClosestItem(data) {
    const closestItem = this.findClosestItem();

    if (data) {
      this.selectedItems = [];
      this.selectionSet = [];
  singleSelect() {
    }

    if (closestItem !== undefined) {
      if (this.selectionSet.indexOf(closestItem) === -1) { // only store selections once
        const copyofitem = Utils.cloneObject(this.core, this.core.scene.items[closestItem]);
        copyofitem.colour = this.core.settings.selecteditemscolour.toString();
        copyofitem.lineWidth = copyofitem.lineWidth * 2;
        this.selectedItems.push(copyofitem);
        this.selectionSet.push(closestItem);
      } else {
        const index = this.selectionSet.indexOf(closestItem);
        this.selectionSet.splice(index, 1); // if the command is already in the array, Erase it
        this.selectedItems.splice(index, 1);
      }
    }
    this.selectionSetChanged();
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
