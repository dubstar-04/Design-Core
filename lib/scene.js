import { Point } from '../entities/point.js'
import { Utils } from '../lib/utils.js'
import { FileIO } from '../lib/fileio.js'

export class Scene { 
    constructor(designEngine){
// initialise the scene variables
this.designEngine = designEngine;                                
this.items = new Array(); // Main array that stores all the geometry
this.points = new Array(); // Temporary Array to store the input points
this.tempItems = new Array(); // Temporary Array to store items while input is being gathered
this.tempPoints = new Array(); // Temporary Array to store points while input is being gathered
this.selectedItems = new Array(); // store a copy of selected items
this.selectionSet = new Array(); // store a list of selected items indices
this.selectionAccepted = false; // Store a bool so we know when the selectionSet has been accepted
this.activeCommand = undefined; // Store the name of the active command
//this.promptTracker = 0;         //TODO: Can this be removed?
this.inputArray = new Array(); //Temporary Array to store input values. 

//TODO: Move to commandLine object
this.lastCommand = new Array(); // Store the last command
this.lastCommandPosition = -1; // Store the current position on the command history

this.minPoints = 0; // Stores the minium number of points required for the active command //TODO: Can this be removed?
//this.canvas; // Canvas to which the items should be drawn
this.inputPromptBox; // inputPrompt to get user input //TODO: can this be removed?
//this.mouse = new Point();                            // store the mouse coordinates.
//this.mouse_delta = new Point(0,0);
this.closestItem;       //TODO: Can this be removed?
//this.angle = 0; // store the angle between the last point and the mouse cusor //TODO: Can this be removed?
this.selectingActive = false; // Are we selecting on screen components?
this.saved = false;

}

reset() {
    console.log(" scene.js - Reset: In Reset");
    this.points = []; // clear array
    this.minPoints = 0; // reset minimum required points
    this.activeCommand = undefined; // reset the active command
    this.tempItems = [];
    this.selectedItems = [];
    this.selectionSet = [];
    this.selectionSetChanged();
    this.selectionAccepted = false;
    this.lastCommandPosition = -1;
    //resetCommandPrompt();
    this.designEngine.commandLine.resetPrompt();
    //this.promptTracker = 0;
    this.inputArray = [];
    this.designEngine.canvas.requestPaint();
    //sceneQmlObject.selectionSetChange();
}

//function setPrompt(index){
//    //var position = previous ? points.length : points.length+2;
//    console.log("scene.js - setPrompt. Index: ", index)
//    commandLine.value = this.activeCommand.type + ": " + this.activeCommand.prompt(Number(index))
//}

selectionSetChanged() {
    getProperties()
}

openFile(file){
    FileIO.openFile(this, file)
}

saveFile(){
    return FileIO.saveDxf(this);
}

centreVPORT(centre, width, height) {
    console.log(centre.x, centre.y, width, height)
    if (height !== 0 && width !== 0) {
        var xmin = centre.x - width / 2
        var xmax = centre.x + width / 2
        var ymin = centre.y - height / 2
        var ymax = centre.y + height / 2

        this.designEngine.canvas.centreInScene(xmin, xmax, ymin, ymax)
    }
}

getSceneExtents() {

    var size = this.designEngine.canvas.canvasSize();
    var width = size.width / this.designEngine.canvas.scale;
    var height = size.height / this.designEngine.canvas.scale;

    var xmin = -this.designEngine.canvas.panX / this.designEngine.canvas.scale;
    var xmax = xmin + width;
    var ymax = -this.designEngine.canvas.panY / this.designEngine.canvas.scale;
    var ymin = ymax - height;

    return {
        xmin: xmin,
        xmax: xmax,
        ymin: ymin,
        ymax: ymax
    };
}

saveRequired() {
    this.saved = false; //Changes have occured. A save may be required.
}

// add item to block
//TODO: fix this mess
addItemToBlock(type, data, name) {

    console.log("block name:", name)

    if (this.items[this.items.length - 1].name === name) {
        console.log("Add Item to Block:", type, name)
            //TODO: This is a bad hack
        if (type === "Insert") {
            this.items[this.items.length - 1].addInsert(data)
            this.items[this.items.length - 1].colour = data.colour
            console.log("Set Block colour:", data.colour)
        } else {
            var item = this.designEngine.commandManager.createNew(type, data);
            this.items[this.items.length - 1].addItem(item)
        }
    }
}

sceneLinkBlockData() {
    // link elements to blocks and blocks to dimensions

    //console.log("linking blocks:")

    var blocks = this.items.filter(item => item.type === 'Block')
        //console.log("blocks filter:", blocks)

    var dBlocks = blocks.filter(item => item.name.includes('*D'))
        //console.log("dblocks filter:", dBlocks)

    var uBlocks = blocks.filter(item => item.name.includes('*U'))
        //console.log("text blocks filter:", uBlocks)

    var blocksNamesToDelete = [];
    var blockIndex = 0; // used to track and link blocks. Dimension > *D blocks > *U blocks

    // copy the block data to the correct dimension
    for (var idx = 0; idx < this.items.length; idx++) {

        //console.log("linking blocks:", (idx / items.length).toFixed(1) * 100, "%")

        if (this.items[idx].type === 'Dimension') {
            //console.log("found Dimension:", idx, "blockname:", items[idx].blockName)
            var block = blocks.filter(item => item.name === this.items[idx].blockName)
            if (block) {
                //console.log("matching block", block[0], "dblock:", dBlocks[blockIndex].name, "ublock:", uBlocks[blockIndex].name)
                // copy block data to dimension
                this.items[idx].block = block[0];
                // copy text data to dimension
                this.items[idx].text = uBlocks[blockIndex].this.items[0]
                    //console.log("Text:", uBlocks[blockIndex].this.items[0])
                blocksNamesToDelete.push(this.items[idx].blockName);
                blocksNamesToDelete.push(uBlocks[blockIndex].name);
                blockIndex++;
            }
        }
    }

    // delete any blocks that have been merged with the parent dimension
    for (idx = this.items.length - 1; idx > 0; idx--) {
        if (blocksNamesToDelete.includes(this.items[idx].name)) {
            //console.log("found name at:", idx)
            this.items.splice(idx, 1)
        }
    }
}

addToScene(type, data, end, index) {

    if (!data) {
        var colour = "BYLAYER";
        data = {
            points: this.points,
            colour: colour,
            layer: this.designEngine.LM.getCLayer(),
            input: this.inputArray
        };
    }

    var item;

    console.log("add to scene type:", type, !type)
    if (this.activeCommand && this.activeCommand.family === "Geometry" && !type) {

        //TODO: find a way to create a new type without window
        item = this.designEngine.commandManager.createNew(this.activeCommand.type, data);
        //item = new window[this.activeCommand.type](data); // Create a new item, send it the points array
    } else {
        item = this.designEngine.commandManager.createNew(type, data); // Create a new item, send it the points array
    }

    if (typeof index === "undefined") {
        //add to end of array
        this.items.push(item); // add item to the scene
    } else {
        //replace item at index
        this.items.splice(index, 1, item);

    }
    if (end) {
        this.reset();
    } // reset all the variables

    //canvas.requestPaint(); // paint the new item to the canvas

}

/*
writeStatusMessage(label, message) {
    label.statusText = message
}
*/

findClosestItem() {

    console.log("[scene.js] - findClosestItem- Selected Items:" + this.selectedItems.length)
        ////////// Object Snapping //////////
    var delta = 1.65; // find a more suitable starting value
    var mousePoint = new Point( this.designEngine.mouse.x,this.designEngine.mouse.y);
    var closestItem;

    for (var i = 0; i < this.items.length; i++) {
        var distance = this.items[i].closestPoint(mousePoint)[1]; //ClosestPoint()[1] returns a distance to the closest point

        if (distance < delta) {
            delta = distance;
            closestItem = i;
            console.log(" scene.js - Distance: " + distance);
        }
    }

    return closestItem;
}

selectClosestItem(data) {

    var closestItem = this.findClosestItem();

    console.log(" scene.js - Scene.js: selectClosestItem() - clearSelectedItems: " + data)

    if (data) {
        //console.log(" scene.js - Clear Selection Data");
        this.selectedItems = [];
        this.selectionSet = [];
    }

    if (closestItem !== undefined) {
        //console.log(" scene.js - Closest Item: " + closestItem)
        //console.log(items[closestItem].type);

        if (this.selectionSet.indexOf(closestItem) === -1) { // only store selections once

            var copyofitem = Utils.cloneObject(this, this.items[closestItem]);

            console.log(" scene.js - Scene.js: selectClosestItem() - Type:" + copyofitem.type)

            copyofitem.colour = settings.selectedItemsColour.toString();
            copyofitem.lineWidth = copyofitem.lineWidth * 2;

            this.selectedItems.push(copyofitem);
            this.selectionSet.push(closestItem);

        } else {

            var index = this.selectionSet.indexOf(closestItem);
            this.selectionSet.splice(index, 1); // if the command is already in the array, Erase it
            this.selectedItems.splice(index, 1);

        }

        console.log(" scene.js - Scene.js: selectClosestItem() - selected items length: " + this.selectedItems.length)
        console.log(" scene.js - Scene.js: selectClosestItem() - indices for selectionSet: " + this.selectionSet);
        this.selectionSetChanged();
    } else {
        if (data) {
            console.log(" scene.js - Nothing Selected");
            console.log(" scene.js - scene.js: selectClosestItem- Selected Items:" + this.selectedItems.length)
                // clear selection
            this.selectedItems = [];
            this.selectionSet = [];
            this.selectionSetChanged();
        }
    }

    //sceneQmlObject.selectionSetChange();
    console.log(" scene.js - scene.js: selectClosestItem- Selected Items:" + this.selectedItems.length)

}

snapping() {
    ////////// Object Snapping //////////
    var snaps = new Array();
    var delta = 25 / this.designEngine.canvas.scale; // find a more suitable starting value
    //var itemIndex = 0;
    var mousePoint = new Point( this.designEngine.mouse.x,this.designEngine.mouse.y);

    for (var i = 0; i < this.items.length; i++) {
        var itemSnaps = this.items[i].snaps(mousePoint, delta) // get an array of snap point from the item

        if (itemSnaps) {
            for (var j = 0; j < itemSnaps.length; j++) {
                var length = Utils.distBetweenPoints(itemSnaps[j].x, itemSnaps[j].y,this.designEngine.mouse.x,this.designEngine.mouse.y)
                if (length < delta) {
                    delta = length;
                    //var closestItem = i;

                    // Draw a circle to highlight the snap.
                    var CentrePoint = new Point(itemSnaps[j].x, itemSnaps[j].y);
                    var radiusPoint = new Point(itemSnaps[j].x, itemSnaps[j].y + (5 / this.designEngine.canvas.scale));
                    var snapCirclePoints = [CentrePoint, radiusPoint];

                    var data = {
                        points: snapCirclePoints,
                        colour: settings.snapColour.toString()
                    }
                    var item = this.designEngine.commandManager.createNew("Circle", data);
                    //var item = new Circle(data); //snaps[j].x, snaps[j].y, snaps[j].x, snaps[j].y + 5) // 5 is a radius for the snap circle
                   this.designEngine.mouse.x = itemSnaps[j].x;
                   this.designEngine.mouse.y = itemSnaps[j].y;
                    //console.log(snaps[j].x, snaps[j].y, delta);
                    this.tempItems.push(item)

                    ////////// Object Snapping //////////
                }
            }
        }
    }

    this.designEngine.canvas.requestPaint();
}

selecting(coordinates, SelectColour) {

    this.tempItems = [];

    if (this.selectingActive) {

        var selectionPoints = [];

        var startPoint = new Point();
        var endPoint = new Point()

        startPoint.x = coordinates[0]; //set the mouse coordinates
        startPoint.y = coordinates[1]; //set the mouse coordinates
        endPoint.x = coordinates[2]; //set the mouse coordinates
        endPoint.y = coordinates[3]; //set the mouse coordinates

        selectionPoints.push(startPoint);
        selectionPoints.push(endPoint);

        var data = {
            points: selectionPoints,
            colour: SelectColour
        }

        var tempItem = this.designEngine.commandManager.createNew("FilledRectangle", data); // Create a new item, send it the tempPoints array
        this.tempItems.push(tempItem) // Add it to the this.tempItems Array
    } else {

        this.designEngine.canvas.requestPaint();

        var xmin = Math.min(coordinates[0], coordinates[2]);
        var xmax = Math.max(coordinates[0], coordinates[2]);
        var ymin = Math.min(coordinates[1], coordinates[3]);
        var ymax = Math.max(coordinates[1], coordinates[3]);

        var selection_extremes = [xmin, xmax, ymin, ymax]

        //Loop through all the entities and see if it should be selected
        for (var i = 0; i < this.items.length; i++) {
            if (coordinates[3] > coordinates[1]) {
                //console.log(" scene.js - scene.js: selecting() - Select all touched by selection window")
                if (this.items[i].touched(selection_extremes) || this.items[i].within(selection_extremes)) {
                    //console.log(this.items[i].type + " at index: " + i + " is within the selection")
                    if (this.selectionSet.indexOf(i) === -1) { // only store selections once
                        var copyofitem = Utils.cloneObject(this, this.items[i]);
                        copyofitem.colour = settings.selectedItemsColour.toString();
                        copyofitem.lineWidth = copyofitem.lineWidth * 2;

                        //console.log("scene.js - item added")

                        this.selectedItems.push(copyofitem);
                        this.selectionSet.push(i);
                        this.selectionSetChanged();

                    }
                } else if (this.selectionSet.indexOf(i) !== -1) {
                    //var index = this.selectionSet.indexOf(i);
                    //this.selectionSet.splice(index,1);    // if the command is already in the array, Erase it
                    //this.selectedItems.splice(index,1);
                }
            } else {
                //console.log(" scene.js - scene.js: selecting() - Select all within the selection window")
                if (this.items[i].within(selection_extremes)) {
                    //console.log(items[i].type + " at index: " + i + " is within the selection")
                    if (this.selectionSet.indexOf(i) === -1) { // only store selections once
                        var copyofitem = Utils.cloneObject(this, this.items[i]);
                        copyofitem.colour = settings.selectedItemsColour.toString();
                        copyofitem.lineWidth = copyofitem.lineWidth * 2;

                        this.selectedItems.push(copyofitem);
                        this.selectionSet.push(i);
                        this.selectionSetChanged();
                    }
                } else if (this.selectionSet.indexOf(i) !== -1) {
                    //var index = this.selectionSet.indexOf(i);
                    //this.selectionSet.splice(index,1);    // if the command is already in the array, Erase it
                    //this.selectedItems.splice(index,1);
                }

            }
        }
    }

    this.designEngine.canvas.requestPaint();
    //sceneQmlObject.selectionSetChange();

}

addHelperGeometry(type, points, colour) {
    //Make a new array of points with the base point and the current mouse position.
    //var helperPoints = new Array();
    //helperPoints.push(points);
    //helperPoints.push(point);

    var data = {
        points: points,
        colour: colour //"#00BFFF"
    }
    //TODO: Clean up commented code below
    //var helper = new window[type](data); //new Rectangle(data);       // Create a templine to help define geometry
    //var helper('return new ' + type)(data) 
    
    var helper = this.designEngine.commandManager.createNew(type, data);
    
    this.tempItems.push(helper); // Add it to the tempItems Array
}

polarSnap(previousPoint) {

    var angleDelta = 3;
    var diff = Utils.radians2degrees(previousPoint.angle(this.designEngine.mouse)) - (settings.polarAngle * Math.round(Utils.radians2degrees(previousPoint.angle(this.designEngine.mouse)) / settings.polarAngle))

    if (Math.abs(diff) < angleDelta) {
        //console.log("scene.js - polarSnap - Diff:", diff, " canvas size", canvas.canvasSize)
        var mousept = new Point( this.designEngine.mouse.x,this.designEngine.mouse.y);
        //commandManager.createNew("Point", data);
        //new Point(mouse.x,this.designEngine.mouse.y);
        mousept = mousept.rotate(previousPoint, Utils.degrees2radians(-diff))

       this.designEngine.mouse.setX(mousept.x);
       this.designEngine.mouse.setY(mousept.y)

        var extents = this.getSceneExtents();
        var length = Math.max(extents.xmax - extents.xmin, extents.ymax - extents.ymin);
        var x = length * Math.cos(previousPoint.angle(mousept));
        var y = length * Math.sin(previousPoint.angle(mousept));
        var polarLinePoints = new Array();
        var lineEnd = new Point(mousept.x + x, mousept.y + y)

        polarLinePoints.push(previousPoint, lineEnd);
        this.addHelperGeometry("Line", polarLinePoints, settings.polarSnapColour.toString())
    }

}

orthoSnap(previousPoint) {

    var x =this.designEngine.mouse.x - previousPoint.x
    var y =this.designEngine.mouse.y - previousPoint.y

    if (Math.abs(x) > Math.abs(y)) {
       this.designEngine.mouse.setY(previousPoint.y)
    } else {
       this.designEngine.mouse.setX(previousPoint.x)
    }

}

lastSelectedPoint(){
    if (this.points.length !== 0) {

        var previousPoint = new Point()
        previousPoint.x = this.points[this.points.length - 1].x;
        previousPoint.y = this.points[this.points.length - 1].y;
        return previousPoint;
    }

    return undefined;
}

mouseMoved() {
    this.tempItems = [];
    this.tempPoints = [];

    if (this.activeCommand !== undefined && this.activeCommand.family === "Geometry" || this.selectionAccepted === true && this.activeCommand.movement !== "Modify") {
        this.snapping();
    }

    // If there is an activecommand and the start point exists, draw the item on screen with every mouse move
    if (this.points.length !== 0) {

        this.tempPoints = this.points.slice(0); // copy points to tempPoints
        
        // generate data from the prevous point and the radius
        // Polar snap if we are close
        if (settings.polar) {
            //if polar is enabled - get the closest points
            this.polarSnap(this.lastSelectedPoint());
        } else if (settings.ortho) {
            //if ortho is enabled - get the nearest ortho point
            this.orthoSnap(this.lastSelectedPoint())
        }

        // add the mouse position to temp points
        this.tempPoints.push(this.designEngine.mouse.currentPoint());

        if (this.activeCommand !== undefined && this.activeCommand.helper_geometry) {
            //Make a new array of points with the base point and the current mouse position.
            var helperPoints = new Array();
            helperPoints.push(this.tempPoints[0]);
            helperPoints.push(this.designEngine.mouse.currentPoint());

            this.addHelperGeometry("Line", helperPoints, settings.helperGeometryColour.toString())
        }

        if (this.activeCommand !== undefined && this.activeCommand.showPreview && this.activeCommand.family === "Geometry" && this.tempPoints.length >= this.activeCommand.minPoints) {

            this.addHelperGeometry(this.activeCommand.type, this.tempPoints, settings.helperGeometryColour.toString())
            this.designEngine.canvas.requestPaint(); //TODO: Improve requests to paint as it is called too often.
        }

        if (this.activeCommand !== undefined && this.activeCommand.showPreview && this.activeCommand.family === "Tools" && this.selectionAccepted) {
            //console.log("preview")
            this.activeCommand.preview(this);
            this.designEngine.canvas.requestPaint();
        }

    } 
}
}