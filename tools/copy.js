import { Utils } from '../lib/utils.js'

export class Copy { 
    constructor(){

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
    var command = {command: "Copy", shortcut: "CO"};
    return command
}

prompt(inputArray) {
    var num = inputArray.length;
    var expectedType = [];
    var reset = false;
    var action = false;
    var prompt = [];

    expectedType[0] = ["undefined"];
    prompt[0] = "Select Items To " + this.type;
 
    expectedType[1] = ["object"];   
    prompt[1] = scene.selectionSet.length + " Item(s) selected: Add more or press Enter to accept";
 
    expectedType[2] = ["boolean"];    
    prompt[2] = "Select Base Point:";
 
    expectedType[3] = ["object"];    
    prompt[3] = "Select Destination or Enter Distance:";
 
    expectedType[4] = ["object"];   
    prompt[4] = "";
            
    var validInput = expectedType[num].includes(typeof inputArray[num-1])
            
    if(!validInput){
        scene.inputArray.pop()
    }else if (scene.inputArray.length === 4){
        action = true;
        reset = true
    }
    
    return [prompt[scene.inputArray.length], reset, action, validInput]
}

action = function(points, items){

    //console.log("Copy Stuff")

    var xDelta =  points[1].x - points[0].x
    var yDelta =  points[1].y - points[0].y

    for (var i = 0; i < scene.selectionSet.length; i++){
        //console.log("selectionset.type: " + selectionSet[i].type);

        var copyofitem = Utils.cloneObject(scene.items[scene.selectionSet[i]]);

        for (var j = 0; j < copyofitem.points.length; j++){
            copyofitem.points[j].x = scene.items[scene.selectionSet[i]].points[j].x + xDelta;
            copyofitem.points[j].y = scene.items[scene.selectionSet[i]].points[j].y + yDelta;
        }

          scene.items.push(copyofitem);
    }

}

preview = function(points, selectedItems, items){

    //console.log("Copy Stuff")

    var xDelta =  points[1].x - points[0].x
    var yDelta =  points[1].y - points[0].y

    for (var i = 0; i < scene.selectionSet.length; i++){
        //console.log("selectionset.type: " + selectionSet[i].type);
        for (var j = 0; j < selectedItems[i].points.length; j++){
            scene.selectedItems[i].points[j].x = scene.items[scene.selectionSet[i]].points[j].x + xDelta;
            scene.selectedItems[i].points[j].y = scene.items[scene.selectionSet[i]].points[j].y + yDelta;
        }
    }
}
}

