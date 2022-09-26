commandManager.registerCommand({
    command: "Erase",
    shortcut: "E"
});

function Erase() {
    //Define Properties
    this.type = "Erase";
    this.family = "Tools";
    this.movement = "None";
    this.minPoints = 0;
    this.selectionRequired = true;
    this.helper_geometry = false;
    this.showPreview = false;
}

Erase.prototype.prompt = function (inputArray) {
    var num = inputArray.length;
    var expectedType = [];
    var reset = false;
    var action = false;
    var prompt = [];

    expectedType[0] = ["undefined"];
    prompt[0] = "Select Items To " + this.type;
 
    expectedType[1] = ["object"];   
    prompt[1] = scene.selectionSet.length + " Item(s) selected: Add more or press Enter to Erase";
 
    expectedType[2] = ["boolean"];    
    prompt[2] = "";

    var validInput = expectedType[num].includes(typeof inputArray[num-1])
            
    if(!validInput){
        inputArray.pop()
    }else if (inputArray.length === 2){
        action = true;
        reset = true
    }
    
    return [prompt[inputArray.length], reset, action, validInput]
}

Erase.prototype.action = function (points, items) {

    scene.selectionSet.sort();

    console.log("erase.js - scene.selectionSet: " + scene.selectionSet);

    for (var i = 0; i < scene.selectionSet.length; i++) {
        //console.log("Erase: " + scene.selectionSet[i]);
        items.splice((scene.selectionSet[i] - i), 1)
    }
}
