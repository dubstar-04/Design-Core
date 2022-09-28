import { Intersection } from '../lib/intersect.js'

export class Extend { 
    constructor(){

    //Define Properties
    this.type = "Extend";
    this.family = "Tools";
    this.movement = "Modify";
    this.minPoints = 2;
	this.selectionRequired = true;
    this.helper_geometry = false;
    this.showPreview = false;
}

static register() {
    var command = {command: "Extend", shortcut: "EX"};
    return command
}

prompt(scene) {
    var num = scene.inputArray.length;
    var expectedType = [];
    var reset = false;
    var action = false;
    var prompt = [];

    expectedType[0] = ["undefined"];
    prompt[0] = "Select boundary edges:";

    expectedType[1] = ["object"];   
    prompt[1] = scene.selectionSet.length + " Item(s) selected: Add more or press Enter to accept";
 
    expectedType[2] = ["boolean"];   
    prompt[2] = "Select object to extend:";

    expectedType[3] = ["object"];    
    prompt[3] = "Select another object to Extend or press ESC to quit:";

    expectedType[4] = expectedType[3];    
    prompt[4] = prompt[3];
 
    var validInput = expectedType[num].includes(typeof scene.inputArray[num-1])
            
    if(!validInput || num > 3){
        scene.inputArray.pop()
    }
    
    if (scene.inputArray.length === 3){
        action = true;
        //reset = true
    }
    
    return [prompt[scene.inputArray.length], reset, action, validInput]
}

action(scene){

    console.log("Extend.js: action")

    console.log("Extend.js: scene.selectionSet length:", scene.selectionSet.length)

    var item = scene.findClosestItem();

    if (item !== undefined){

        var intersectPoints = [];

        for (var i = 0; i < scene.selectionSet.length; i++){
            if (scene.selectionSet[i] !== item){
                var boundaryItem = scene.items[scene.selectionSet[i]];
                var extendItem = scene.items[item];

                console.log("boundary.type:", boundaryItem.type, "extend.type:", extendItem.type)

                var functionName = "intersect" + boundaryItem.type + extendItem.type;
                console.log("extend.js - call function:", functionName)
                var intersect = Intersection[functionName](boundaryItem.intersectPoints(), extendItem.intersectPoints(), true);

                console.log(intersect.status)
                if(intersect.points.length){
                    console.log("intersect points:", intersect.points.length)
                    for(var point = 0; point < intersect.points.length; point++){
                        intersectPoints.push(intersect.points[point]);
                    }
                }
            }   
        }

        if(intersectPoints)
        extendItem.extend(intersectPoints)
    }

}

preview(){
   // console.log("extend.js - preview")
}
}

