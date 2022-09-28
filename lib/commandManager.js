import { Line } from "../entities/line.js"
import { Polyline } from "../entities/polyline.js"
import { Circle } from "../entities/circle.js"
import { Arc } from "../entities/arc.js"
import { Rectangle } from "../entities/rectangle.js"
import { FilledRectangle } from "../entities/filledRectangle.js"
import { Ellipse } from "../entities/ellipse.js"
import { Spline } from "../entities/spline.js"
import { Text } from "../entities/text.js"
import { Dimension } from "../entities/dimension.js"
import { Block } from "../entities/block.js"
import { Insert } from "../entities/insert.js"

//import { Point } from "../entities/point.js"

import { Move } from "../tools/move.js"
import { Copy } from "../tools/copy.js"

import { Rotate } from "../tools/rotate.js"
import { Erase } from "../tools/erase.js"

import { Distance } from "../tools/distance.js"
import { Identify } from "../tools/identify.js"

import { Extend } from "../tools/extend.js"
import { Trim } from "../tools/trim.js"


const classes = {
    Line,
	Polyline,
	Circle,
	Arc, 
	Rectangle,
	FilledRectangle,
	Ellipse,
	Spline,
	Text,
	Dimension,
	Block, 
	Insert,
	Move, 
	Copy,
	Rotate,
	Erase,
	Distance,
	Identify, 
	Extend, 
	Trim

};

export class CommandManager { 
    constructor(){
    // store a list of the available commands
    this.commands = []

	for(var index in classes) { 
		//call static register method from each class
		this.registerCommand(classes[index].register());
	}
}

registerCommand(command) {
    this.commands.push(command);
};

createNew = function(type, data){

	if(this.isCommand(type)){
		return new classes[type](data);
	}else{
		console.log("commandManager.js - createNew: Command Not Recognised")
	}
}

isCommand(command) {
	if(typeof command !== "undefined"){
		for (var i = 0; i < this.commands.length; i++) {
			if (this.commands[i].command.toUpperCase() === command.toUpperCase()) {
				return true;
			}
		}
	}	
	return false;
}

getCommandFromShortcut(shortcut) {

	var commandFromShortcut = shortcut
	if(typeof shortcut !== "undefined"){
		for (var i = 0; i < this.commands.length; i++) {

			if (typeof this.commands[i].shortcut !== "undefined"){
				if (this.commands[i].shortcut.toUpperCase() === shortcut.toUpperCase()) {
					commandFromShortcut = this.commands[i].command;
				}
			}
		}
	}
	return commandFromShortcut
}
}