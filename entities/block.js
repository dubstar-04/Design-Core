import { Point } from './point.js'
//import { Utils } from '../lib/utils.js'
import { Intersection } from '../lib/intersect.js'

export class Block {
    constructor(data) {
        //Define Properties
        this.type = "Block";
        this.name = "";
        this.points = [new Point()]; // insert location
        this.location = new Point(); // block reference location
        this.flags = 1;
        this.colour = "BYLAYER";
        this.layer = "0";
        this.showPreview = true; //show preview of item as its being created
        //this.helper_geometry = true; // If true a line will be drawn between points when defining geometry
        this.items = []; //list of items in the block

        if (data) {

            this.name = data.name;

            if (data.points) {
                this.location = data.points[0]
                console.log("Block Point Data:", data.points)
            }

            if (data.flags) {
                this.flags = data.flags;
            }

            if (data.colour) {
                this.colour = data.colour;
            }

            if (data.layer) {
                this.layer = data.layer;
            }
        }
    }

    static register() {
        var command = { command: "Block" };
        return command
    }

    setStandardFlags() {

        //Standard flags (bit-coded values):
        //1 = This is an anonymous Block generated by hatching, associative dimensioning, other internal operations, or an application 
        //2 = This Block has Attributes 
        //4 = This Block is an external reference (Xref) 
        //8 = not used 
        //16 = This Block is externally dependent 
        //32 = This is a resolved external reference, or dependent of an external reference 
        //64 = This definition is referenced 

        this.flags = 1;
    }


    dxf() {
        var dxfitem = ""
        var data = dxfitem.concat(
            "0",
            "\n", "BLOCK",
            "\n", "8",
            "\n", 0,
            "\n", "2", //name
            "\n", this.name,
            "\n", "70", //Flags
            "\n", this.flags,
            "\n", "10", //X
            "\n", this.points[0].x,
            "\n", "20", //Y
            "\n", this.points[0].y,
            "\n", "30", //Z
            "\n", "0.0",
            "\n", "3", //name again
            "\n", this.name
        )
        console.log(" Block.js - DXF Data:" + data)
        return data
    }

    clearItems() {
        this.items = [];
    }

    addItem(item) {
        this.items.push(item);
    }

    addInsert(data) {

        var point = new Point(data.points[0].x, data.points[0].y);
        this.points[0] = point;
    }

    draw(ctx, scale, core) {

        if (!this.items.length) {
            // nothing to draw
            return
        }

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var colour = this.colour;

        if (this.colour === "BYLAYER") {
            colour = core.LM.getLayerByName(this.layer).colour
        }

        ctx.save();
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1 / scale;

        //if (this.points[1]) {
        // blocks are associated with an insert point.
        // translate ctx by the insert location
        // this allows the items to be draw without knowing the insert location of the parent block
        ctx.translate(this.points[0].x, this.points[0].y);
        //}

        for (var item = 0; item < this.items.length; item++) {
            // console.log("block draw - Item:", this.items[item])
            if (typeof this.items[item].draw == 'function') {

                // handle item colour
                var itemColour = this.items[item].colour;
                if (itemColour === "BYBLOCK") {
                    tempColour = this.items[item].colour
                    this.items[item].colour = this.colour;
                }
                this.items[item].draw(ctx, scale, core);
                // reset item colour
                this.items[item].colour = itemColour;
            } else {
                console.log("block.js - [draw] [INFO]:Item has no draw function - Item:", this.items[item])
            }

        }

        ctx.restore();

        /*
        //////////////////////////////////////////
        // draw test point for location
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1 / scale;
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.arc(this.points[0].x, this.points[0].y, 5 / scale, radians2degrees(0), radians2degrees(360), false);
        ctx.stroke();
        //////////////////////////////////////////
        */
    }

    snaps(mousePoint, delta) {

        var snaps = [];

        if (!this.items.length) {
            // nothing to draw
            return snaps;
        }

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        snaps = [this.points[0]];

        for (var item = 0; item < this.items.length; item++) {
            // collect the child item snaps
            itemSnaps = this.items[item].snaps(mousePoint, delta);

            for (snap = 0; snap < itemSnaps.length; snap++) {
                //offset the item snap point by the block insert location
                snapPoint = itemSnaps[snap]
                //if (this.points[1]) {
                snapPoint = snapPoint.add(this.points[0])
                //}
                //console.log("Snap Point:", snapPoint)
                snaps.push(snapPoint);
            }

        }

        return snaps;
    }

    within(selection_extremes) {

        if (!this.items.length) {
            // nothing to draw
            return false
        }

        // determin if this entities is within a the window specified by selection_extremes
        var extremePoints = this.extremes()

        // console.log("block extremes:", extremePoints)
        if (extremePoints[0] > selection_extremes[0] &&
            extremePoints[1] < selection_extremes[1] &&
            extremePoints[2] > selection_extremes[2] &&
            extremePoints[3] < selection_extremes[3]
        ) {
            return true
        }

        return false
    }

    intersectPoints() {

        return {
            start: this.points[0],
            end: this.points[0]
        }
    }

    closestPoint(P) {

        var distance = Infinity;
        var minPnt = P;

        if (!this.items.length) {
            // nothing to draw
            return [minPnt, distance]
        }

        // adjust the selection point to offset by the block insert position
        var adjustedPoint = P.subtract(this.points[0])

        for (var idx = 0; idx < this.items.length; idx++) {
            var itemClosestPoint = this.items[idx].closestPoint(adjustedPoint)
            itemPnt = itemClosestPoint[0].add(this.points[0]); //adjust by the block insert position
            itemDist = itemClosestPoint[1];

            if (itemDist < distance) {
                distance = itemDist;
                minPnt = itemPnt;
            }
        }

        return [minPnt, distance]
    }

    extremes() {

        var xmin = Infinity
        var xmax = -Infinity
        var ymin = Infinity
        var ymax = -Infinity

        for (var idx = 0; idx < this.items.length; idx++) {
            var itemExtremes = this.items[idx].extremes()

            xmin = Math.min(xmin, itemExtremes[0]);
            xmax = Math.max(xmax, itemExtremes[1]);
            ymin = Math.min(ymin, itemExtremes[2]);
            ymax = Math.max(ymax, itemExtremes[3]);
        }

        return [xmin, xmax, ymin, ymax]
    }

    touched(selection_extremes) {

        if (!this.items.length) {
            // nothing to draw
            return false
        }

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var rP1 = new Point(selection_extremes[0], selection_extremes[2]);
        var rP2 = new Point(selection_extremes[1], selection_extremes[3]);

        var rectPoints = {
            start: rP1,
            end: rP2
        };

        var output = Intersection.intersectRectangleRectangle(this.intersectPoints(), rectPoints);
        console.log(output.status)

        if (output.status === "Intersection") {
            return true
        }
        //no intersection found. return false
        return false
    }
}