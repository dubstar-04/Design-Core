export class Move { 
    constructor(){
    //Define Properties
    this.type = "Move";
    this.family = "Tools";
    this.movement = "Linear";
    this.minPoints = 2;
    this.selectionRequired = true;
    this.helper_geometry = true;
    this.showPreview = true;
}

static register() {
    var command = {command: "Move", shortcut: "M"};
    return command
}

prompt(inputArray) {
    var num = inputArray.length;
    var expectedType = [];
    var reset = false;
    var action = false;
    var prompt = [];

    console.log("inputArray: ", inputArray)

    expectedType[0] = ["undefined"];
    prompt[0] = "Select Items To " + this.type;

    expectedType[1] = ["object"];
    prompt[1] = scene.selectionSet.length + " Item(s) selected: Add more or press Enter to accept";

    expectedType[2] = ["boolean"];
    prompt[2] = "Select Base Point:";

    expectedType[3] = ["object"];
    prompt[3] = "Select Destination or Enter Distance:";

    expectedType[4] = ["object", "number"];
    prompt[4] = "";

    var validInput = expectedType[num].includes(typeof inputArray[num - 1])

    if (!validInput) {
        inputArray.pop()
    } else if (inputArray.length === 4) {
        action = true;
        reset = true
    }

    return [prompt[inputArray.length], reset, action, validInput]
}

action(points, items) {

    console.log("move.js: action")
    console.log("move.js: points length: " + points.length)
    console.log("move.js: items length: " + items.length)

    var xDelta = points[1].x - points[0].x
    var yDelta = points[1].y - points[0].y

    console.log("move.js: X: " + xDelta + " Y: " + yDelta)

    for (var i = 0; i < scene.selectionSet.length; i++) {
        //console.log("scene.selectionSet.type: " + scene.selectionSet[i].type);
        for (var j = 0; j < scene.selectedItems[i].points.length; j++) {
            items[scene.selectionSet[i]].points[j].x = items[scene.selectionSet[i]].points[j].x + xDelta;
            items[scene.selectionSet[i]].points[j].y = items[scene.selectionSet[i]].points[j].y + yDelta;
        }
    }

}

preview(points, selectedItems, items) {

    //console.log("move.js: preview")
    //console.log("move.js: points length: " + points.length)
    //console.log("move.js: selectedItems length: " + selectedItems.length)
    //console.log("move.js: items length: " + items.length)

    var xDelta = points[1].x - points[0].x
    var yDelta = points[1].y - points[0].y

    for (var i = 0; i < scene.selectionSet.length; i++) {
        //console.log("scene.selectionSet.type: " + selectedItems[i].type);
        for (var j = 0; j < selectedItems[i].points.length; j++) {
            selectedItems[i].points[j].x = items[scene.selectionSet[i]].points[j].x + xDelta;
            selectedItems[i].points[j].y = items[scene.selectionSet[i]].points[j].y + yDelta;
        }
    }
  }
}