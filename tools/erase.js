export class Erase { 
    constructor(){
    //Define Properties
    this.type = "Erase";
    this.family = "Tools";
    this.movement = "None";
    this.minPoints = 0;
    this.selectionRequired = true;
    this.helper_geometry = false;
    this.showPreview = false;
}

static register() {
    var command = {command: "Erase", shortcut: "E"};
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
    prompt[1] = core.scene.selectionSet.length + " Item(s) selected: Add more or press Enter to Erase";
 
    expectedType[2] = ["boolean"];    
    prompt[2] = "";

    var validInput = expectedType[num].includes(typeof core.scene.inputArray[num-1])
            
    if(!validInput){
        core.scene.inputArray.pop()
    }else if (core.scene.inputArray.length === 2){
        action = true;
        reset = true
    }
    
    return [prompt[core.scene.inputArray.length], reset, action, validInput]
}

action(core) {

    core.scene.selectionSet.sort();

    console.log("erase.js - core.scene.selectionSet: " + core.scene.selectionSet);

    for (var i = 0; i < core.scene.selectionSet.length; i++) {
        //console.log("Erase: " + core.scene.selectionSet[i]);
        core.scene.items.splice((core.scene.selectionSet[i] - i), 1)
    }
}
}
