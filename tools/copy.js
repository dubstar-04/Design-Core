import { Utils } from '../lib/utils.js'

export class Copy {
    constructor() {

        //Define Properties
        this.type = "Copy";
        this.family = "Tools";
        this.movement = "Linear";
        this.minPoints = 2;
        this.selectionRequired = true;
        this.limitPoints = true;
        this.showPreview = true;
    }

    static register() {
        var command = { command: "Copy", shortcut: "CO" };
        return command
    }

    prompt(core) {
        var num = core.scene.inputArray.length;
        var expectedType = [];
        var reset = false;
        var action = false;
        var prompt = [];

        expectedType[0] = ["undefined"];
        prompt[0] = "Select Items To " + this.type;

        expectedType[1] = ["object"];
        prompt[1] = core.scene.selectionSet.length + " Item(s) selected: Add more or press Enter to accept";

        expectedType[2] = ["boolean"];
        prompt[2] = "Select Base Point:";

        expectedType[3] = ["object"];
        prompt[3] = "Select Destination or Enter Distance:";

        expectedType[4] = ["object"];
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

    action = function (core) {

        //console.log("Copy Stuff")

        var xDelta = core.scene.points[1].x - core.scene.points[0].x
        var yDelta = core.scene.points[1].y - core.scene.points[0].y

        for (var i = 0; i < core.scene.selectionSet.length; i++) {
            //console.log("selectionset.type: " + selectionSet[i].type);

            var copyofitem = Utils.cloneObject(core, core.scene.items[core.scene.selectionSet[i]]);

            for (var j = 0; j < copyofitem.points.length; j++) {
                copyofitem.points[j].x = core.scene.items[core.scene.selectionSet[i]].points[j].x + xDelta;
                copyofitem.points[j].y = core.scene.items[core.scene.selectionSet[i]].points[j].y + yDelta;
            }

            core.scene.items.push(copyofitem);
        }

    }

    preview = function (core) {

        //console.log("Copy Stuff")

        var xDelta = core.scene.tempPoints[1].x - core.scene.tempPoints[0].x
        var yDelta = core.scene.tempPoints[1].y - core.scene.tempPoints[0].y

        for (var i = 0; i < core.scene.selectionSet.length; i++) {
            //console.log("selectionset.type: " + selectionSet[i].type);
            for (var j = 0; j < core.scene.selectedItems[i].points.length; j++) {
                core.scene.selectedItems[i].points[j].x = core.scene.items[core.scene.selectionSet[i]].points[j].x + xDelta;
                core.scene.selectedItems[i].points[j].y = core.scene.items[core.scene.selectionSet[i]].points[j].y + yDelta;
            }
        }
    }
}

