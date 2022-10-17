export class Settings {
    constructor() {

        this.canvasBackgroundColour = "#1e1e1e"; //"#000000";
        this.selectedItemsColour = "#00FF00";
        this.snapColour = "#FF0000";
        this.gridColour = "#77767b";
        this.helperGeometryColour = "#00BFFF";
        this.polarSnapColour = "#38B44A";
        //fontSettings
        this.font = "Arial";
        this.fontupsidedown = false;
        this.fontbackwards = false;
        //snapSettings
        this.endSnap = true;
        this.midSnap = true;
        this.centreSnap = true;
        this.nearestSnap = false;
        this.quadrantSnap = false;
        this.polarAngle = 45;
        this.polar = true;
        this.ortho = false;
        this.drawGrid = true
    }


    setSetting(setting, value) {
        this[setting] = value;
    }

    getSetting(setting) {
        //TODO: Validate setting exists
        return this[setting];
    }

}
