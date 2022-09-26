function sceneControl(action, data) {

	var input = data[0];
	var inputData = undefined;
	var expectedInputType = undefined;
	//Create Point to hold any new position
	//var point = new Point()

	//console.log("sceneControl - InputAction:" + action);
	//console.log("sceneControl - InputData:" + data);
	//console.log("sceneControl - Var Input:" + input);

	var isNumber = /^-?\d+\.\d+$/.test(input) || /^-?\d+$/.test(input);
	var isLetters = /^[A-Za-z]+$/.test(input);
	var isPoint = /^\d+,\d+$/.test(input) || /^@-?\d+,-?\d+$/.test(input) || /^#-?\d+,-?\d+$/.test(input);
	var isUndefined = (input === undefined)

	//console.log("sceneControl - only Numbers " + isNumber)
	//console.log("sceneControl - only Letters " + isLetters)
	//console.log("sceneControl - is Point " + isPoint)
	//console.log("sceneControl - is Undefined " + isUndefined)

	if (action === "RightClick") {
		scene.reset()
		return
	}

	if (action === "Enter" && isUndefined) {
		if (scene.activeCommand !== undefined && scene.activeCommand.family === "Tools" && scene.selectionSet.length) {
			scene.selectionAccepted = true;
			inputData = true;
		} else if (scene.activeCommand !== undefined) {
			scene.reset()
			return
		} else if (scene.activeCommand == undefined) {
			initialiseItem(scene.lastCommand[0]);
		}
	}

	if (isPoint) {
		console.log("design engine - comma seperated point - create new point ")

		var isRelative = input.includes('@')
		var isAbsolute = input.includes('#')

		if (isAbsolute || isRelative){
			input = input.replace('@', '').replace('#', '')
		}

		var xyData = input.split(',');
		var point = new Point()
		point.x = parseFloat(xyData[0]);
		point.y = parseFloat(xyData[1]);

		if (isRelative && points.length){
			point.x = parseFloat(points[points.length - 1].x + point.x);
			point.y = parseFloat(points[points.length - 1].y + point.y);
		}

		inputData = point;
		scene.points.push(point);
	}

	if (action === "LeftClick") {
		console.log("design engine - left click- create new point ")

		if (scene.activeCommand === undefined) {
			scene.selectClosestItem(data)
		} else {
			var point = new Point()
			point.x = mouse.x; //data[0];
			point.y = mouse.y; //data[1];
			inputData = point;

			if (scene.activeCommand.family === "Geometry" || scene.selectionAccepted) {
				scene.points.push(inputData);
			}

			if (scene.activeCommand.family === "Tools" && !scene.selectionAccepted) {
				var closestItem = scene.selectClosestItem(data);
			}
		}
	}

	if (isNumber) {
		console.log("design engine - Numbers Recieved")
		//inputData = Number(input);
		point = convertInputToPoint(Number(input))
		inputData = Number(input);
		scene.points.push(point);
		console.log("Number Input Data: ", inputData)
	}

	if (isLetters && !isUndefined) {
		console.log("designEngine - Letters Recieved")
		inputData = String(input);
	}

	///////////////////////////////////////////////////////////////////////
	////////////////////// handle the new inputData //////////////////////
	/////////////////////////////////////////////////////////////////////

	if (typeof scene.activeCommand !== "undefined") {
		scene.inputArray.push(inputData)
		actionInput();
	} else if (commandManager.isCommand(commandManager.getCommandFromShortcut(input))) {
		initialiseItem(commandManager.getCommandFromShortcut(input));
		if (scene.activeCommand.family === "Tools" && scene.selectionSet.length || scene.activeCommand.selectionRequired === false) {
			if (scene.activeCommand.selectionRequired) {

				scene.inputArray.push(scene.selectionSet)
				scene.inputArray.push(true)
			}
			scene.selectionAccepted = true;
		}
		actionInput();
	} else {
		console.log("End of designEngine")
	}

	///////////////////////////////////////////////////////////////////////
	////////////////////// handle the new inputData //////////////////////
	/////////////////////////////////////////////////////////////////////

}

function actionInput() {

	[prompt, resetBool, actionBool, validInput] = scene.activeCommand.prompt(scene.inputArray);
	console.log("prompt: ", prompt, " reset: ", resetBool, " action: " + actionBool)
	commandLine.setPrompt(prompt);

	if (!validInput){
		notify("Invalid Input")
	}

	if (actionBool) {
		if (scene.activeCommand.family === "Tools") {
			scene.activeCommand.action(scene.points, scene.items);
		} else {
			scene.addToScene(null, null, resetBool)
		}
	}

	if (resetBool) {
		scene.reset();
	}
}

function initialiseItem(item) {
	console.log(" designEngine - Item To Process: " + item)
	scene.saveRequired();

	if (scene.lastCommand.indexOf(item) !== -1) { // only store command once
		scene.lastCommand.splice(scene.lastCommand.indexOf(item), 1); // if the command is already in the array, Erase it
	}
	scene.lastCommand.unshift(item); // add the command to the Array
	while (scene.lastCommand.length > 10) { //check if we have more than 10 command in history
		scene.lastCommand.pop()
	}

	if (typeof window[item] !== "function") {
		//if the string is an unknown command error gracefully
		notify("Unknown Command")
		commandLine.resetPrompt();
		return;
	}

	//TODO: Replace window with a method to create the new object
	scene.activeCommand = new window[item]; // Convert the 'item' string in to a new object, Line, Circle...

};

function convertInputToPoint(input) {
	var point = new Point()
	var x = input * Math.cos(degrees2radians(angle));
	var y = input * Math.sin(degrees2radians(angle));
	// generate data from the prevous point and the radius
	point.x = scene.points[scene.points.length - 1].x + x;
	point.y = scene.points[scene.points.length - 1].y + y;

	return point
}