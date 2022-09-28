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

prompt(inputArray) {
  var num = inputArray.length;
  var expectedType = [];
  var reset = false;
  var action = false;
  var prompt = [];

  expectedType[0] = ["undefined"];
  prompt[0] = "Select Point:";

  expectedType[1] = ["object"];    
  prompt[1] = "";

  var validInput = expectedType[num].includes(typeof inputArray[num-1])
            
  if(!validInput){
      inputArray.pop()
  }else if (inputArray.length === this.minPoints){
      action = true;
      reset = true
  }
  
  return [prompt[inputArray.length], reset, action, validInput]
}

preview(num) {
//no preview required
return;

}

action(points, items){
	
  var id = (" X: " + points[0].x.toFixed(1) + " Y:" + points[0].y.toFixed(1));		
	notify(id)
}
}
