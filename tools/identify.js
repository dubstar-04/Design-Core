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

prompt(scene) {
  var num = scene.inputArray.length;
  var expectedType = [];
  var reset = false;
  var action = false;
  var prompt = [];

  expectedType[0] = ["undefined"];
  prompt[0] = "Select Point:";

  expectedType[1] = ["object"];    
  prompt[1] = "";

  var validInput = expectedType[num].includes(typeof scene.inputArray[num-1])
            
  if(!validInput){
      scene.inputArray.pop()
  }else if (scene.inputArray.length === this.minPoints){
      action = true;
      reset = true
  }
  
  return [prompt[scene.inputArray.length], reset, action, validInput]
}

preview() {
//no preview required
return;

}

action(scene){
	
  var id = (" X: " + scene.points[0].x.toFixed(1) + " Y:" + scene.points[0].y.toFixed(1));		
	notify(id)
}
}
