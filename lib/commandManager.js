function CommandManager() {

    // store a list of the available commands
    this.commands = []
}

CommandManager.prototype.registerCommand = function (command) {
    this.commands.push(command);
};

CommandManager.prototype.isCommand = function (command) {
	if(typeof command !== "undefined"){
		for (var i = 0; i < this.commands.length; i++) {
			if (this.commands[i].command.toUpperCase() === command.toUpperCase()) {
				return true;
			}
		}
	}	
	return false;
}

CommandManager.prototype.getCommandFromShortcut = function (shortcut) {

	var commandFromShortcut = shortcut
	if(typeof shortcut !== "undefined"){
		for (var i = 0; i < this.commands.length; i++) {
			if (this.commands[i].shortcut.toUpperCase() === shortcut.toUpperCase()) {
				commandFromShortcut = this.commands[i].command;
			}
		}
	}
	return commandFromShortcut
}