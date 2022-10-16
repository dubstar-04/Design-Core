
export class PropertyManager {
    constructor(core) {
        this.core = core;
        this.updateCallbackFunction; //set to external callback function
}

setPropertyCallbackFunction(callback){
    // set the call
    this.updateCallbackFunction = callback;
}


selectionSetChanged(){

    console.log("Property Manager - Selection Set Changed")

    // If a callback is set - signal that a change has been made
    if(this.updateCallbackFunction){
        this.updateCallbackFunction()
    }
}

}