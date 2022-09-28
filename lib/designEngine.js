import { CommandManager } from './commandManager.js'
import { Scene } from './scene.js'
import { Mouse } from './mouse.js'
import { Canvas } from './canvas.js'
import { CommandLine } from './commandLine.js'
import { LayerManager } from './layerManager.js'
import { StyleManager } from './styleManager.js'
import { DimStyleManager } from './dimStyleManager.js'

import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

//TODO: Add debugging class
//TODO: use inheritance for the tools & entities 
//TODO: Use better error checking: consider using try and throw
export class DesignEngine { 
    constructor(){
	// This is the main class for interaction with Design

	this.commandManager = new CommandManager();
	this.scene = new Scene(this);
	this.canvas = new Canvas(this);

	this.mouse = new Mouse(this);
	this.commandLine = new CommandLine(cmd_Line, this.scene);

	this.LM = new LayerManager(this.scene);
	this.SM = new StyleManager(this.scene);
	this.DSM = new DimStyleManager(this.scene);

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
		this.scene.reset()
		return
	}

	if (action === "Enter" && isUndefined) {
		if (this.scene.activeCommand !== undefined && this.scene.activeCommand.family === "Tools" && this.scene.selectionSet.length) {
			this.scene.selectionAccepted = true;
			inputData = true;
		} else if (this.scene.activeCommand !== undefined) {
			this.scene.reset()
			return
		} else if (this.scene.activeCommand == undefined) {
			this.initialiseItem(this.scene.lastCommand[0]);
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
		this.scene.points.push(point);
	}

	if (action === "LeftClick") {
		console.log("design engine - left click- create new point ")

		if (this.scene.activeCommand === undefined) {
			this.scene.selectClosestItem(data)
		} else {
			var point = new Point()
			point.x =  this.mouse.x; //data[0];
			point.y =  this.mouse.y; //data[1];
			inputData = point;

			if (this.scene.activeCommand.family === "Geometry" || this.scene.selectionAccepted) {
				this.scene.points.push(inputData);
			}

			if (this.scene.activeCommand.family === "Tools" && !this.scene.selectionAccepted) {
				var closestItem = this.scene.selectClosestItem(data);
			}
		}
	}

	if (isNumber) {
		console.log("design engine - Numbers Recieved")
		//inputData = Number(input);
		point = this.convertInputToPoint(Number(input))
		inputData = Number(input);
		this.scene.points.push(point);
		console.log("Number Input Data: ", inputData)
	}

	if (isLetters && !isUndefined) {
		console.log("designEngine - Letters Recieved")
		inputData = String(input);
	}

	///////////////////////////////////////////////////////////////////////
	////////////////////// handle the new inputData //////////////////////
	/////////////////////////////////////////////////////////////////////

	if (typeof this.scene.activeCommand !== "undefined") {
		this.scene.inputArray.push(inputData)
		this.actionInput();
	} else if (this.commandManager.isCommand(this.commandManager.getCommandFromShortcut(input))) {
		this.initialiseItem(this.commandManager.getCommandFromShortcut(input));
		if (this.scene.activeCommand.family === "Tools" && this.scene.selectionSet.length || this.scene.activeCommand.selectionRequired === false) {
			if (this.scene.activeCommand.selectionRequired) {

				this.scene.inputArray.push(this.scene.selectionSet)
				this.scene.inputArray.push(true)
			}
			this.scene.selectionAccepted = true;
		}
		this.actionInput();
	} else {
		console.log("End of designEngine")
	}

	///////////////////////////////////////////////////////////////////////
	////////////////////// handle the new inputData //////////////////////
	/////////////////////////////////////////////////////////////////////

}

actionInput() {

	var prompt, resetBool, actionBool, validInput;

	[prompt, resetBool, actionBool, validInput] = this.scene.activeCommand.prompt(this.scene);
	console.log("prompt: ", prompt, " reset: ", resetBool, " action: " + actionBool)
	this.commandLine.setPrompt(prompt);

	if (!validInput){
		notify("Invalid Input")
	}

	if (actionBool) {
		if (this.scene.activeCommand.family === "Tools") {
			this.scene.activeCommand.action(this.scene);
		} else {
			this.scene.addToScene(null, null, resetBool)
		}
	}

	if (resetBool) {
		this.scene.reset();
	}
}

initialiseItem(item) {
	console.log(" designEngine - Item To Process: " + item)
	this.scene.saveRequired();

	if (this.scene.lastCommand.indexOf(item) !== -1) { // only store command once
		this.scene.lastCommand.splice(this.scene.lastCommand.indexOf(item), 1); // if the command is already in the array, Erase it
	}
	this.scene.lastCommand.unshift(item); // add the command to the Array
	while (this.scene.lastCommand.length > 10) { //check if we have more than 10 command in history
		this.scene.lastCommand.pop()
	}

	if (!this.commandManager.isCommand(item)){
		notify("Unknown Command")
		this.commandLine.resetPrompt();
		return;
	}

	// if (typeof window[item] !== "function") {
	// 	//if the string is an unknown command error gracefully
	// 	notify("Unknown Command")
	// 	commandLine.resetPrompt();
	// 	return;
	// }

	this.scene.activeCommand = this.commandManager.createNew(item);

};

convertInputToPoint (input) {
	var point = new Point()
	var x = input * Math.cos(Utils.degrees2radians(this.mouse.inputAngle())); //TODO: Where is angle from?
	var y = input * Math.sin(Utils.degrees2radians(this.mouse.inputAngle()));
	// generate data from the prevous point and the radius
	point.x = this.scene.points[this.scene.points.length - 1].x + x;
	point.y = this.scene.points[this.scene.points.length - 1].y + y;

	return point
}
}