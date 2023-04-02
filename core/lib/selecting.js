import {Utils} from './utils.js';

export class Selecting {
  constructor(core) {
    this.core = core;
    this.selectionSet = []; // store a list of selected items indices
    this.selectionAccepted = false; // Store a bool so we know when the selectionSet has been accepted
    this.selectedItems = []; // store a copy of selected items
  }

  reset() {
    this.selectedItems = [];
    this.selectionSet = [];
    this.selectionSetChanged();
    this.selectionAccepted = false;
  }

  selectionSetChanged() {
    // signal to the properties manager that the selection set is changed
    this.core.propertyManager.selectionSetChanged();
  }

  // find closest items to mouse press
  findClosestItem() {
    let delta = 1.65 / this.core.canvas.getScale(); // find a more suitable starting value
    let closestItem;

    for (let i = 0; i < this.core.scene.items.length; i++) {
      const distance = this.core.scene.items[i].closestPoint(this.core.mouse.pointOnScene())[1]; // ClosestPoint()[1] returns a distance to the closest point

      if (distance < delta) {
        delta = distance;
        closestItem = i;
        // console.log(' scene.js - Distance: ' + distance);
      }
    }

    return closestItem;
  }

  // find items within a selection window
  selecting() {
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
          this.addToSelectedItems(i);
        }
      } else {
        if (this.core.scene.items[i].within(selectionExtremes, this.core)) {
          this.addToSelectedItems(i);
        }
      }
    }

    this.core.canvas.requestPaint();
    this.core.scene.selecting.selectionSetChanged();
  }

  selectClosestItem(data) {
    const closestItem = this.findClosestItem(this.core);

    if (data) {
      this.selectedItems = [];
      this.selectionSet = [];
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

  // Duplicate an item into the selected items array
  addToSelectedItems(index) {
    // only store selections once
    if (this.selectionSet.indexOf(index) === -1) {
      const copyofitem = Utils.cloneObject(this.core, this.core.scene.items[index]);
      copyofitem.colour = this.core.settings.selecteditemscolour.toString();
      copyofitem.lineWidth = copyofitem.lineWidth * 2;
      this.selectedItems.push(copyofitem);
      // Update selectionset
      this.selectionSet.push(index);
    }
  }
}
