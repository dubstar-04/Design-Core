export class Move {
    constructor() {
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
        var command = { command: "Move", shortcut: "M" };
        return command
    }

    prompt(core) {
        var num = core.scene.inputArray.length;
        var expectedType = [];
        var reset = false;
        var action = false;
        var prompt = [];

        console.log("inputArray: ", core.scene.inputArray)

        expectedType[0] = ["undefined"];
        prompt[0] = "Select Items To " + this.type;

        expectedType[1] = ["object"];
        prompt[1] = core.scene.selectionSet.length + " Item(s) selected: Add more or press Enter to accept";

        expectedType[2] = ["boolean"];
        prompt[2] = "Select Base Point:";

        expectedType[3] = ["object"];
        prompt[3] = "Select Destination or Enter Distance:";

        expectedType[4] = ["object", "number"];
        prompt[4] = "";

        var validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1])

        if (!validInput) {
            core.scene.inputArray.pop()
        } else if (core.scene.inputArray.length === 4) {
            action = true;
            reset = true
        }

        return [prompt[core.scene.inputArray.length], reset, action, validInput]
    }

    action(core) {

        console.log("move.js: action")
        console.log("move.js: points length: " + core.scene.points.length)
        console.log("move.js: items length: " + core.scene.items.length)

        var xDelta = core.scene.points[1].x - core.scene.points[0].x
        var yDelta = core.scene.points[1].y - core.scene.points[0].y

        console.log("move.js: X: " + xDelta + " Y: " + yDelta)

        for (var i = 0; i < core.scene.selectionSet.length; i++) {
            //console.log("core.scene.selectionSet.type: " + core.scene.selectionSet[i].type);
            for (var j = 0; j < core.scene.selectedItems[i].points.length; j++) {
                core.scene.items[core.scene.selectionSet[i]].points[j].x = core.scene.items[core.scene.selectionSet[i]].points[j].x + xDelta;
                core.scene.items[core.scene.selectionSet[i]].points[j].y = core.scene.items[core.scene.selectionSet[i]].points[j].y + yDelta;
            }
        }

    }

    preview(core) {

        //console.log("move.js: preview")
        //console.log("move.js: points length: " + points.length)
        //console.log("move.js: selectedItems length: " + selectedItems.length)
        //console.log("move.js: items length: " + items.length)

        var xDelta = core.scene.tempPoints[1].x - core.scene.tempPoints[0].x
        var yDelta = core.scene.tempPoints[1].y - core.scene.tempPoints[0].y

        console.log("delta", xDelta, yDelta);
        console.log(core.scene.tempPoints[0].x, core.scene.tempPoints[0].y)
        console.log(core.scene.tempPoints[1].x, core.scene.tempPoints[1].y)
        console.log(core.scene.items[core.scene.selectionSet[0]].points[0].x, core.scene.items[core.scene.selectionSet[0]].points[0].y)

        for (var i = 0; i < core.scene.selectionSet.length; i++) {
            //console.log("core.scene.selectionSet.type: " + selectedItems[i].type);
            for (var j = 0; j < core.scene.selectedItems[i].points.length; j++) {

                core.scene.selectedItems[i].points[j].x = core.scene.items[core.scene.selectionSet[i]].points[j].x + xDelta;
                core.scene.selectedItems[i].points[j].y = core.scene.items[core.scene.selectionSet[i]].points[j].y + yDelta;
            }
        }
    }
}