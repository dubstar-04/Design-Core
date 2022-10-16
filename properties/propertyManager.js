
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

getItemTypes() {

    //Loop through the items and get a list of item types.
    var itemTypes = [];

    if (this.core.scene.selectionSet.length > 0) {
        for (var i = 0; i < this.core.scene.selectionSet.length; i++) {

            var itemType = this.core.scene.items[this.core.scene.selectionSet[i]].type;
            //console.log(this.core.scene.items[this.core.scene.selectionSet[i]].type);

            if (itemTypes.indexOf(itemType, 0) === -1) {
                itemTypes.push(itemType)
                //console.log("ItemTypes: " + itemTypes.length)
            }
        }

        if (itemTypes.length > 1) {
            itemTypes.unshift("All")
        }
    }

    return itemTypes
}

getItemProperties(itemType) {

    //Loop through the items and get a list of common properties.
    console.log("Properties Manage - getItemProperties Item Type: " + itemType)
    var propertiesList = [];

    if (this.core.scene.selectionSet.length > 0) {
        for (var i = 0; i < this.core.scene.selectionSet.length; i++) {
            //console.log("[propertiesManager.js - getItemProperties()] type:", items[selectionSet[i]].type)
            if (this.core.scene.items[this.core.scene.selectionSet[i]].type === itemType) {
                var properties = this.core.scene.items[this.core.scene.selectionSet[i]]
                for (var prop in properties) {
                    //console.log("Property: " + prop)
                    if (propertiesList.indexOf(prop, 0) === -1) {
                        if (typeof properties[prop] !== "function") {
                            var excludeProps = ["type", "family", "minPoints", "limitPoints", "helper_geometry", "points", "alpha"];
                            if (excludeProps.indexOf(prop) === -1) {
                                propertiesList.push(prop)
                            }
                        }
                    }
                }
            }
        }

        return propertiesList;
    }
}


getItemPropertyValue(itemType, property) {
    //Loop through the items and get a list the property values
    var propertiesValueList = [];
    var propertyValue = ""
    if (this.core.scene.selectionSet.length > 0) {
        for (var i = 0; i < this.core.scene.selectionSet.length; i++) {
            if (this.core.scene.items[this.core.scene.selectionSet[i]].type === itemType) {
                var prop = this.core.scene.items[this.core.scene.selectionSet[i]][property]
                propertiesValueList.push(prop)
            }
        }
    }

    console.log("[propertiesManager.getItemProperyValue()]", propertiesValueList)
    if (propertiesValueList.every(function (prop) {
        return prop === propertiesValueList[0]
    })) {
        return propertiesValueList[0]
    } else {
        return "varies"
    }
}



}