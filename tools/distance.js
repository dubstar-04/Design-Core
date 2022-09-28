import { Utils } from '../lib/utils.js'

export class Distance { 
    constructor(){

    //Define Properties
    this.type = "Distance";
    this.family = "Tools";
    this.movement = "None";
    this.minPoints = 2;
	this.selectionRequired = false;
    this.helper_geometry = false;
    this.showPreview = false;
}

static register() {
    var command = {command: "Distance", shortcut: "DI"};
    return command
}

prompt(scene) {
  var num = scene.inputArray.length;
  var expectedType = [];
  var reset = false;
  var action = false;
  var prompt = [];

  expectedType[0] = ["undefined"];
  prompt[0] = "Select Start Point:";

  expectedType[1] = ["object"];   
  prompt[1] = "Select End Point:";

  expectedType[2] = ["object"];    
  prompt[2] = "";

  var validInput = expectedType[num].includes(typeof scene.inputArray[num-1])
            
  if(!validInput){
      scene.inputArray.pop()
  }else if (scene.inputArray.length === this.minPoints){
      action = true;
      reset = true
  }
  
  return [prompt[scene.inputArray.length], reset, action, validInput]
}

preview(num) {

console.log("TO DO: Draw a preview of the measurement")

}

action(scene){

    //var point1 = new Point(points[0].x, points[0].y)
    //var point2 = new Point(points[1].x, points[1].y)

    var di = (" Length: " + Utils.distBetweenPoints(scene.points[0].x, scene.points[0].y, scene.points[1].x, scene.points[1].y).toFixed(1)
                + " X: " + (scene.points[1].x - scene.points[0].x).toFixed(1) + " Y:" + (scene.points[1].y - scene.points[0].y).toFixed(1));
				
	notify(di)
}
}
