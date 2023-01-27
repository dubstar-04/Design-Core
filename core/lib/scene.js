import {Point} from '../entities/point.js';
import {Utils} from './utils.js';
import {Snapping} from './snapping.js';

export class Scene {
  constructor(core) {
    // initialise the scene variables
    this.core = core;
    this.items = []; // Main array that stores all the geometry
    this.points = []; // Temporary Array to store the input points
    this.tempItems = []; // Temporary Array to store items while input is being gathered
    this.tempPoints = []; // Temporary Array to store points while input is being gathered
    this.selectedItems = []; // store a copy of selected items
    this.selectionSet = []; // store a list of selected items indices
    this.selectionAccepted = false; // Store a bool so we know when the selectionSet has been accepted
    this.activeCommand = undefined; // Store the name of the active command
    this.inputArray = []; // Temporary Array to store input values.
    this.saved = false;
  }

  reset() {
    // console.log(' scene.js - Reset: In Reset');
    this.points = []; // clear array
    this.minPoints = 0; // reset minimum required points
    this.activeCommand = undefined; // reset the active command
    this.tempItems = [];
    this.selectedItems = [];
    this.selectionSet = [];
    this.selectionSetChanged();
    this.selectionAccepted = false;
    this.core.commandLine.resetPrompt();
    this.inputArray = [];
    this.core.canvas.requestPaint();
  }

  selectionSetChanged() {
    // signal to the properties manager that the selection set is changed
    this.core.propertyManager.selectionSetChanged();
  }

  /*
    centreVPORT(centre, width, height) {
        // console.log(centre.x, centre.y, width, height)
        if (height !== 0 && width !== 0) {
            var xmin = centre.x - width / 2
            var xmax = centre.x + width / 2
            var ymin = centre.y - height / 2
            var ymax = centre.y + height / 2

            this.core.canvas.centreInScene(xmin, xmax, ymin, ymax)
        }
    }
    */

  getExtents() {
    if (this.items.length === 0) {
      return undefined;
    }

    let xmin; let xmax; let ymin; let ymax;

    for (let i = 0; i < this.items.length; i++) {
      const extremes = this.items[i].extremes();
      xmin = (xmin === undefined) ? extremes[0] : (extremes[0] < xmin) ? extremes[0] : xmin;
      xmax = (xmax === undefined) ? extremes[1] : (extremes[1] > xmax) ? extremes[1] : xmax;
      ymin = (ymin === undefined) ? extremes[2] : (extremes[2] < ymin) ? extremes[2] : ymin;
      ymax = (ymax === undefined) ? extremes[3] : (extremes[3] > ymax) ? extremes[3] : ymax;
    }

    return {
      xmin: xmin,
      xmax: xmax,
      ymin: ymin,
      ymax: ymax,
    };
  }


  saveRequired() {
    this.saved = false; // Changes have occured. A save may be required.
  }

  // add item to block
  // TODO: fix this mess
  addItemToBlock(type, data, name) {
    // console.log('block name:', name);

    if (this.items[this.items.length - 1].name === name) {
      // console.log('Add Item to Block:', type, name);
      // TODO: This is a bad hack
      if (type === 'Insert') {
        this.items[this.items.length - 1].addInsert(data);
        this.items[this.items.length - 1].colour = data.colour;
        // console.log('Set Block colour:', data.colour);
      } else {
        const item = this.core.commandManager.createNew(type, data);
        this.items[this.items.length - 1].addItem(item);
      }
    }
  }

  linkBlockData() {
    // link elements to blocks and blocks to dimensions

    // console.log("linking blocks:")

    const blocks = this.items.filter((item) => item.type === 'Block');
    // console.log("blocks filter:", blocks)

    // const dBlocks = blocks.filter((item) => item.name.includes('*D'));
    // console.log("dblocks filter:", dBlocks)

    const uBlocks = blocks.filter((item) => item.name.includes('*U'));
    // console.log("text blocks filter:", uBlocks)

    const blocksNamesToDelete = [];
    let blockIndex = 0; // used to track and link blocks. Dimension > *D blocks > *U blocks

    // copy the block data to the correct dimension
    for (let idx = 0; idx < this.items.length; idx++) {
      // console.log("linking blocks:", (idx / items.length).toFixed(1) * 100, "%")

      if (this.items[idx].type === 'Dimension') {
        // console.log("found Dimension:", idx, "blockname:", items[idx].blockName)
        const block = blocks.filter((item) => item.name === this.items[idx].blockName);
        if (block) {
          // console.log("matching block", block[0], "dblock:", dBlocks[blockIndex].name, "ublock:", uBlocks[blockIndex].name)
          // copy block data to dimension
          this.items[idx].block = block[0];
          // copy text data to dimension
          this.items[idx].text = uBlocks[blockIndex].this.items[0];
          // console.log("Text:", uBlocks[blockIndex].this.items[0])
          blocksNamesToDelete.push(this.items[idx].blockName);
          blocksNamesToDelete.push(uBlocks[blockIndex].name);
          blockIndex++;
        }
      }
    }

    // delete any blocks that have been merged with the parent dimension
    for (let idx = this.items.length - 1; idx > 0; idx--) {
      if (blocksNamesToDelete.includes(this.items[idx].name)) {
        // console.log("found name at:", idx)
        this.items.splice(idx, 1);
      }
    }
  }

  addToScene(type, data, end, index) {
    if (!data) {
      const colour = 'BYLAYER';
      data = {
        points: this.points,
        colour: colour,
        layer: this.core.layerManager.getCLayer(),
        input: this.inputArray,
      };
    }

    let item;
    if (this.activeCommand && this.activeCommand.family === 'Geometry' && !type) {
      // TODO: find a way to create a new type without window
      item = this.core.commandManager.createNew(this.activeCommand.type, data);
      // item = new window[this.activeCommand.type](data); // Create a new item, send it the points array
    } else {
      item = this.core.commandManager.createNew(type, data); // Create a new item, send it the points array
    }

    if (typeof index === 'undefined') {
      // add to end of array
      this.items.push(item); // add item to the scene
    } else {
      // replace item at index
      this.items.splice(index, 1, item);
    }
    if (end) {
      this.reset();
    }
  }

  findClosestItem() {
    let delta = 1.65; // find a more suitable starting value
    let closestItem;

    for (let i = 0; i < this.items.length; i++) {
      const distance = this.items[i].closestPoint(this.core.mouse.pointOnScene())[1]; // ClosestPoint()[1] returns a distance to the closest point

      if (distance < delta) {
        delta = distance;
        closestItem = i;
        // console.log(' scene.js - Distance: ' + distance);
      }
    }

    return closestItem;
  }

  selectClosestItem(data) {
    const closestItem = this.findClosestItem();

    if (data) {
      this.selectedItems = [];
      this.selectionSet = [];
    }

    if (closestItem !== undefined) {
      if (this.selectionSet.indexOf(closestItem) === -1) { // only store selections once
        const copyofitem = Utils.cloneObject(this.core, this.items[closestItem]);
        copyofitem.colour = this.core.settings.selectedItemsColour.toString();
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


  selecting() {
    this.tempItems = [];

    // console.log('selecting');

    if (this.core.mouse.buttonOneDown) {
      const selectionPoints = [];
      selectionPoints.push(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint));
      selectionPoints.push(this.core.mouse.pointOnScene());

      let selectColour;

      if (this.core.mouse.pointOnScene().y > this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y) {
        // Draw a rectangle on screen
        selectColour = '#FF0000';
      } else if (this.core.mouse.pointOnScene().y < this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y) {
        // Draw a rectangle on screen
        selectColour = '#0000FF';
      }

      const data = {
        points: selectionPoints,
        colour: selectColour,
      };

      const tempItem = this.core.commandManager.createNew('FilledRectangle', data); // Create a new item, send it the tempPoints array
      this.tempItems.push(tempItem); // Add it to the this.tempItems Array
    } else {
      // TODO: Move this repaint to one of the mouse up functions
      this.core.canvas.requestPaint();

      this.core.mouse.mouseDownCanvasPoint;
      this.core.mouse.pointOnScene();

      const xmin = Math.min(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).x, this.core.mouse.pointOnScene().x);
      const xmax = Math.max(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).x, this.core.mouse.pointOnScene().x);
      const ymin = Math.min(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y, this.core.mouse.pointOnScene().y);
      const ymax = Math.max(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y, this.core.mouse.pointOnScene().y);

      const selectionExtremes = [xmin, xmax, ymin, ymax];

      // Loop through all the entities and see if it should be selected
      for (let i = 0; i < this.items.length; i++) {
        if (this.core.mouse.pointOnScene().y > this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y) {
          // console.log(" scene.js - scene.js: selecting() - Select all touched by selection window")
          if (this.items[i].touched(selectionExtremes, this.core) || this.items[i].within(selectionExtremes, this.core)) {
            // console.log(this.items[i].type + " at index: " + i + " is within the selection")
            if (this.selectionSet.indexOf(i) === -1) { // only store selections once
              const copyofitem = Utils.cloneObject(this.core, this.items[i]);
              copyofitem.colour = this.core.settings.selectedItemsColour.toString();
              copyofitem.lineWidth = copyofitem.lineWidth * 2;

              this.selectedItems.push(copyofitem);
              this.selectionSet.push(i);
              this.selectionSetChanged();
            }
          } else if (this.selectionSet.indexOf(i) !== -1) {
            // TODO: What is supposed to happen here?
            // var index = this.selectionSet.indexOf(i);
            // this.selectionSet.splice(index,1);    // if the command is already in the array, Erase it
            // this.selectedItems.splice(index,1);
          }
        } else {
          // console.log(" scene.js - scene.js: selecting() - Select all within the selection window")
          if (this.items[i].within(selectionExtremes, this.core)) {
            // console.log(items[i].type + " at index: " + i + " is within the selection")
            if (this.selectionSet.indexOf(i) === -1) { // only store selections once
              const copyofitem = Utils.cloneObject(this.core, this.items[i]);
              copyofitem.colour = this.core.settings.selectedItemsColour.toString();
              copyofitem.lineWidth = copyofitem.lineWidth * 2;

              this.selectedItems.push(copyofitem);
              this.selectionSet.push(i);
              this.selectionSetChanged();
            }
          } else if (this.selectionSet.indexOf(i) !== -1) {
            // TODO: What is supposed to happen here?
            // var index = this.selectionSet.indexOf(i);
            // this.selectionSet.splice(index,1);    // if the command is already in the array, Erase it
            // this.selectedItems.splice(index,1);
          }
        }
      }
    }

    this.core.canvas.requestPaint();
  }

  addHelperGeometry(type, points, colour) {
    const data = {
      points: points,
      colour: colour, // "#00BFFF"
    };

    const helper = this.core.commandManager.createNew(type, data);
    this.tempItems.push(helper); // Add it to the tempItems Array
  }

  lastSelectedPoint() {
    if (this.points.length !== 0) {
      const previousPoint = new Point();
      previousPoint.x = this.points[this.points.length - 1].x;
      previousPoint.y = this.points[this.points.length - 1].y;
      return previousPoint;
    }

    return undefined;
  }

  addSnapPoint(snapPoint) {
    // Draw a circle to highlight the snap.
    const CentrePoint = new Point(snapPoint.x, snapPoint.y);
    const radiusPoint = new Point(snapPoint.x, snapPoint.y + (5 / this.core.canvas.getScale()));
    const snapCirclePoints = [CentrePoint, radiusPoint];

    const data = {
      points: snapCirclePoints,
      colour: this.core.settings.snapColour.toString(),
    };
    const item = this.core.commandManager.createNew('Circle', data);
    this.tempItems.push(item);

    // Move the mouse to the closest snap point so if the mouse if clicked the snap point is used.
    this.core.mouse.setPosFromScenePoint(snapPoint);
  }

  mouseDown(button) {
    switch (button) {
      case 0: // left button
        // TODO: Janky way to initiate commands - fix it
        this.core.designEngine.sceneControl('LeftClick', []);
        break;
      case 1: // middle button
        break;
      case 2: // right button
        break;
    }
  };

  mouseUp(button) {
    switch (button) {
      case 0: // left button
        this.selecting();
        break;
      case 1: // middle button
        break;
      case 2: // right button
        break;
    }
  };

  mouseMoved() {
    this.tempItems = [];
    this.tempPoints = [];

    if (this.core.mouse.buttonOneDown) {
      this.selecting();
    }

    if (this.activeCommand !== undefined && this.activeCommand.family === 'Geometry' || this.selectionAccepted === true && this.activeCommand.movement !== 'Modify') {
      const snapPoint = Snapping.getSnapPoint(this);
      if (snapPoint) {
        this.addSnapPoint(snapPoint);
      }
      this.core.canvas.requestPaint();
    }

    // TODO: sort this mess out. This logic would be best in the design engine or at least tidied.
    // If there is an activecommand and the start point exists, draw the item on screen with every mouse move
    if (this.points.length !== 0) {
      this.tempPoints = this.points.slice(0); // copy points to tempPoints

      if (this.core.settings.polar) {
        // if polar is enabled - get the closest points
        const polarSnap = Snapping.polarSnap(this.lastSelectedPoint(), this.core);
        if (polarSnap) {
          this.core.mouse.setPosFromScenePoint(polarSnap);
        }
      } else if (this.core.settings.ortho) {
        // if ortho is enabled - get the nearest ortho point
        const orthoSnap = Snapping.orthoSnap(this.lastSelectedPoint(), this.core);
        if (orthoSnap) {
          this.core.mouse.setPosFromScenePoint(orthoSnap);
        }
      }

      // add the mouse position to temp points
      this.tempPoints.push(this.core.mouse.pointOnScene());

      if (this.activeCommand !== undefined && this.activeCommand.helper_geometry) {
        // Make a new array of points with the base point and the current mouse position.
        const helperPoints = [];
        helperPoints.push(this.tempPoints[0]);
        helperPoints.push(this.core.mouse.pointOnScene());

        this.addHelperGeometry('Line', helperPoints, this.core.settings.helperGeometryColour.toString());
      }

      if (this.activeCommand !== undefined && this.activeCommand.showPreview && this.activeCommand.family === 'Geometry' && this.tempPoints.length >= this.activeCommand.minPoints) {
        this.addHelperGeometry(this.activeCommand.type, this.tempPoints, this.core.settings.helperGeometryColour.toString());
        this.core.canvas.requestPaint(); // TODO: Improve requests to paint as it is called too often.
      }

      if (this.activeCommand !== undefined && this.activeCommand.showPreview && this.activeCommand.family === 'Tools' && this.selectionAccepted) {
        // console.log("preview")
        this.activeCommand.preview(this.core);
        this.core.canvas.requestPaint();
      }
    }
  }
}
