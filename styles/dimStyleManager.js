import { DimStyle } from "./dimStyle.js"

export class DimStyleManager {
    constructor(core) {
        //TODO: Can dimstylemanager and style manager be merged?

        this.styles = new Array();
        this.currentstyle = "STANDARD";
        this.core = core;
        this.addStandardStyles()
    }

    getStyles() {
        return this.styles;
    }

    styleCount() {
        return this.styles.length;
    }

    newStyle() {

        this.addStyle({
            "name": this.getUniqueName("NEW_STYLE")
        });
    }

    getUniqueName(name) {

        var count = 0;
        var styStr = name.replace(/ /g, "_").toUpperCase();
        console.log("New style Name:" + styStr)
        for (var i = 0; i < this.styleCount(); i++) {
            if (this.styles[i].name.includes(styStr)) {
                count = count + 1;
            }
        }
        if (count > 0) {
            styStr = styStr + "_" + count;
        }

        return styStr;
    }

    addStyle(style) {
        console.log(" DimStyleManager.js - addstyle() - New style Added:" + style.name)
        var newstyle = new DimStyle(style);
        if (!this.styleExists(style)) {
            this.styles.push(newstyle);
            this.core.scene.saveRequired();
        }
    }

    deleteStyle(styleIndex) {

        var styleToDelete = this.getStyleByIndex(styleIndex).name;

        if (styleToDelete.toUpperCase() === "STANDARD") {
            console.log("Warning: STANDARD style cannot be deleted")
            return;
        }

        var selectionSet = [];

        for (var i = 0; i < items.length; i++) {
            if (items[i].style === styleToDelete) {
                selectionSet.push(i)
            }
        }

        console.log(selectionSet.length, " Item(s) to be deleted from ", styleToDelete);

        selectionSet.sort();
        for (var j = 0; j < selectionSet.length; j++) {
            items.splice((selectionSet[j] - j), 1)
        }

        //Delete The style
        this.styles.splice(styleIndex, 1);
    }

    getCstyle() {
        return this.currentstyle;
    }

    setCstyle(cstyle) {
        this.currentstyle = cstyle;
    }

    styleExists(style) {
        var i = this.styleCount();
        while (i--) {
            //console.log("styleExists:", this.styles[i].name)
            if (this.styles[i].name === style.name) {
                //console.log("DimStyleManager.js styleExist: " + style.name)
                return true;
            }
        }
        //console.log("style Doesn't Exist: " + style.name)
        return false;
    }

    checkStyles() {

        if (!this.styleCount()) {
            console.log("DimStyleManager.js - Check styles -> Add Standard styles")
            this.addStandardStyles();
        }

        for (var i = 0; i < items.length; i++) {
            var style = (items[i].style)
            this.addstyle({
                "name": style
            })
        }
    }

    addStandardStyles() {
        this.addStyle({
            "name": "STANDARD"
        });
        this.core.scene.saveRequired();
    }

    getStyleByName(styleName) {

        for (var i = 0; i < this.styleCount(); i++) {
            if (this.styles[i].name === styleName) {

                return this.styles[i];
            }
        }
    }

    getStyleByIndex(styleIndex) {

        return this.styles[styleIndex];
    }


    renameStyle(styleIndex, newName) {

        var newName = this.getUniqueName(newName)

        if (this.getStyleByIndex(styleIndex).name.toUpperCase() !== "STANDARD") {

            if (this.getStyleByIndex(styleIndex).name === this.getCStyle()) {
                this.setCStyle(newName);
                console.log("[DimStyleManager.renamestyle] - set new Cstyle name")
            }

            this.styles[styleIndex].name = newName;
        }
    }
}