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

prompt(scene) {
    var num = scene.inputArray.length;
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
            
    var validInput = expectedType[num].includes(typeof scene.inputArray[num-1])
            
    if(!validInput){
        scene.scene.inputArray.pop()
    }else if (scene.inputArray.length === 4){
        action = true;
        reset = true
    }
    
    return [prompt[scene.inputArray.length], reset, action, validInput]
}

action = function(scene){

    //console.log("Copy Stuff")

    var xDelta =  scene.points[1].x - scene.points[0].x
    var yDelta =  scene.points[1].y - scene.points[0].y

    for (var i = 0; i < scene.selectionSet.length; i++){
        //console.log("selectionset.type: " + selectionSet[i].type);

        var copyofitem = Utils.cloneObject(scene, scene.items[scene.selectionSet[i]]);

        for (var j = 0; j < copyofitem.points.length; j++){
            copyofitem.points[j].x = scene.items[scene.selectionSet[i]].points[j].x + xDelta;
            copyofitem.points[j].y = scene.items[scene.selectionSet[i]].points[j].y + yDelta;
        }

          scene.items.push(copyofitem);
    }

}

preview = function(scene){

    //console.log("Copy Stuff")

    var xDelta =  scene.tempPoints[1].x - scene.tempPoints[0].x
    var yDelta =  scene.tempPoints[1].y - scene.tempPoints[0].y

    for (var i = 0; i < scene.selectionSet.length; i++){
        //console.log("selectionset.type: " + selectionSet[i].type);
        for (var j = 0; j < scene.selectedItems[i].points.length; j++){
            scene.selectedItems[i].points[j].x = scene.items[scene.selectionSet[i]].points[j].x + xDelta;
            scene.selectedItems[i].points[j].y = scene.items[scene.selectionSet[i]].points[j].y + yDelta;
        }
    }
}
}

