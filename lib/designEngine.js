import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

export class DesignEngine {
	constructor(core) {
		// this.core. is the main class for interaction with Design

		this.core = core;
	}

	sceneControl(action, data) {

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
			this.core.scene.reset()
			return
		}

		if (action === "Enter" && isUndefined) {
			if (this.core.scene.activeCommand !== undefined && this.core.scene.activeCommand.family === "Tools" && this.core.scene.selectionSet.length) {
				this.core.scene.selectionAccepted = true;
				inputData = true;
			} else if (this.core.scene.activeCommand !== undefined) {
				this.core.scene.reset()
				return
			} else if (this.core.scene.activeCommand == undefined) {
				this.initialiseItem(this.core.scene.lastCommand[0]);
			}
		}

		if (isPoint) {
			console.log("design engine - comma seperated point - create new point ")

			var isRelative = input.includes('@')
			var isAbsolute = input.includes('#')

			if (isAbsolute || isRelative) {
				input = input.replace('@', '').replace('#', '')
			}

			var xyData = input.split(',');
			var point = new Point()
			point.x = parseFloat(xyData[0]);
			point.y = parseFloat(xyData[1]);

			if (isRelative && points.length) {
				point.x = parseFloat(points[points.length - 1].x + point.x);
				point.y = parseFloat(points[points.length - 1].y + point.y);
			}

			inputData = point;
			this.core.scene.points.push(point);
		}

		if (action === "LeftClick") {
			console.log("design engine - left click- create new point ")

			if (this.core.scene.activeCommand === undefined) {
				this.core.scene.selectClosestItem(data)
			} else {
				var point = new Point()
				point.x = this.core.mouse.x; //data[0];
				point.y = this.core.mouse.y; //data[1];
				inputData = point;

				if (this.core.scene.activeCommand.family === "Geometry" || this.core.scene.selectionAccepted) {
					this.core.scene.points.push(inputData);
				}

				if (this.core.scene.activeCommand.family === "Tools" && !this.core.scene.selectionAccepted) {
					//TODO: should this.core. be linked to the closest item member in scene?
					var closestItem = this.core.scene.selectClosestItem(data);
				}
			}
		}

		if (isNumber) {
			console.log("design engine - Numbers Recieved")
			//inputData = Number(input);
			point = this.convertInputToPoint(Number(input))
			inputData = Number(input);
			this.core.scene.points.push(point);
			console.log("Number Input Data: ", inputData)
		}

		if (isLetters && !isUndefined) {
			console.log("core - Letters Recieved")
			inputData = String(input);
		}

		///////////////////////////////////////////////////////////////////////
		////////////////////// handle the new inputData //////////////////////
		/////////////////////////////////////////////////////////////////////

		if (typeof this.core.scene.activeCommand !== "undefined") {
			this.core.scene.inputArray.push(inputData)
			this.actionInput();
		} else if (this.core.commandManager.isCommand(this.core.commandManager.getCommandFromShortcut(input))) {
			this.initialiseItem(this.core.commandManager.getCommandFromShortcut(input));
			if (this.core.scene.activeCommand.family === "Tools" && this.core.scene.selectionSet.length || this.core.scene.activeCommand.selectionRequired === false) {
				if (this.core.scene.activeCommand.selectionRequired) {

					this.core.scene.inputArray.push(this.core.scene.selectionSet)
					this.core.scene.inputArray.push(true)
				}
				this.core.scene.selectionAccepted = true;
			}
			this.actionInput();
		} else {
			console.log("End of core")
		}

		///////////////////////////////////////////////////////////////////////
		////////////////////// handle the new inputData //////////////////////
		/////////////////////////////////////////////////////////////////////

	}

	actionInput() {

		var prompt, resetBool, actionBool, validInput;

		[prompt, resetBool, actionBool, validInput] = this.core.scene.activeCommand.prompt(this.core);
		console.log("prompt: ", prompt, " reset: ", resetBool, " action: " + actionBool)
		this.core.commandLine.setPrompt(prompt);

		if (!validInput) {
			notify("Invalid Input")
		}

		if (actionBool) {
			if (this.core.scene.activeCommand.family === "Tools") {
				this.core.scene.activeCommand.action(this.core);
			} else {
				this.core.scene.addToScene(null, null, resetBool)
			}
		}

		if (resetBool) {
			this.core.scene.reset();
		}
	}

	initialiseItem(item) {
		console.log(" core - Item To Process: " + item)
		this.core.scene.saveRequired();

		if (this.core.scene.lastCommand.indexOf(item) !== -1) { // only store command once
			this.core.scene.lastCommand.splice(this.core.scene.lastCommand.indexOf(item), 1); // if the command is already in the array, Erase it
		}
		this.core.scene.lastCommand.unshift(item); // add the command to the Array
		while (this.core.scene.lastCommand.length > 10) { //check if we have more than 10 command in history
			this.core.scene.lastCommand.pop()
		}

		if (!this.core.commandManager.isCommand(item)) {
			notify("Unknown Command")
			this.core.commandLine.resetPrompt();
			return;
		}

		// if (typeof window[item] !== "function") {
		// 	//if the string is an unknown command error gracefully
		// 	notify("Unknown Command")
		// 	commandLine.resetPrompt();
		// 	return;
		// }

		this.core.scene.activeCommand = this.core.commandManager.createNew(item);

	};

	convertInputToPoint(input) {
		var point = new Point()
		var x = input * Math.cos(Utils.degrees2radians(this.core.mouse.inputAngle())); //TODO: Where is angle from?
		var y = input * Math.sin(Utils.degrees2radians(this.core.mouse.inputAngle()));
		// generate data from the prevous point and the radius
		point.x = this.core.scene.points[this.core.scene.points.length - 1].x + x;
		point.y = this.core.scene.points[this.core.scene.points.length - 1].y + y;

		return point
	}
}