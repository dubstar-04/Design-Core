export class Identify { 
  constructor(){

    //Define Properties
    this.type = "Identify";
    this.family = "Tools";
    this.movement = "None";
    this.minPoints = 1;
	  this.selectionRequired = false;
    this.helper_geometry = false;
    this.showPreview = false;
}

static register() {
  var command = {command: "Identify", shortcut: "ID"};
  return command
}

prompt(core) {
  var num = core.scene.inputArray.length;
  var expectedType = [];
  var reset = false;
  var action = false;
  var prompt = [];

  expectedType[0] = ["undefined"];
  prompt[0] = "Select Point:";

  expectedType[1] = ["object"];    
  prompt[1] = "";

  var validInput = expectedType[num].includes(typeof core.scene.inputArray[num-1])
            
  if(!validInput){
      core.scene.inputArray.pop()
  }else if (core.scene.inputArray.length === this.minPoints){
      action = true;
      reset = true
  }
  
  return [prompt[core.scene.inputArray.length], reset, action, validInput]
}

preview() {
//no preview required
return;

}

action(core){
	
  var id = (" X: " + core.scene.points[0].x.toFixed(1) + " Y:" + core.scene.points[0].y.toFixed(1));		
	notify(id)
}
}
