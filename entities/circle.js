import { Point } from './point.js'
import { Utils } from '../lib/utils.js'
import { Intersection } from '../lib/intersect.js'

export class Circle {
    constructor(data) {
        //Define Properties         //Associated DXF Value
        this.type = "Circle";
        this.family = "Geometry";
        this.minPoints = 2;
        this.showPreview = true; //show preview of item as its being created
        //this.limitPoints = true;
        //this.allowMultiple = false;
        this.helper_geometry = true; // If true a line will be drawn between points when defining geometry

        this.points = [];
        this.radius = 0;

        this.lineWidth = 2; //Thickness
        this.colour = "BYLAYER";
        this.layer = "0";
        this.alpha = 1.0 //Transparancy
        //this.lineType
        //this.LinetypeScale
        //this.PlotStyle
        //this.LineWeight


        if (data) {

            if (data.points) {
                this.points = data.points
                this.calculateRadius();
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
        var command = { command: "Circle", shortcut: "C" };
        return command
    }

    calculateRadius() {
        this.radius = Utils.distBetweenPoints(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y);
    }

    prompt(core) {
        var num = core.scene.inputArray.length;
        var expectedType = [];
        var reset = false;
        var action = false;
        var prompt = [];

        expectedType[0] = ["undefined"];
        prompt[0] = "Pick the centre point:";

        expectedType[1] = ["object"];
        prompt[1] = "Pick another point or Enter radius:";

        expectedType[2] = ["object", "number"];
        prompt[2] = prompt[1];

        var validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1])

        if (!validInput) {
            core.scene.inputArray.pop()
        } else if (core.scene.inputArray.length === this.minPoints) {
            action = true;
            reset = true
        }

        return [prompt[core.scene.inputArray.length], reset, action, validInput]
    }

    draw(ctx, scale, core) {

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var colour = this.colour;

        if (this.colour === "BYLAYER") {
            colour = core.LM.getLayerByName(this.layer).colour
        }

        this.calculateRadius(); //is this the most efficient way to update the radius?

        ctx.strokeStyle = colour;
        ctx.lineWidth = this.lineWidth / scale;
        ctx.beginPath()

        //ctx.moveTo(this.points[0].x , this.points[0].y);
        ctx.arc(this.points[0].x, this.points[0].y, this.radius, Utils.radians2degrees(0), Utils.radians2degrees(360), false);

        ctx.stroke()
    }

    /*properties(){
    
        return {  //type: this.type,
            colour: this.colour,
            layer: this.layer,
            lineWidth: this.lineWidth
        }
    }
    */

    dxf() {
        var dxfitem = ""
        var data = dxfitem.concat(
            "0",
            "\n", "CIRCLE",
            //"\n", "5", //HANDLE
            //"\n", "DA",
            "\n", "8", //LAYERNAME
            "\n", this.layer,
            "\n", "10", //X
            "\n", this.points[0].x,
            "\n", "20", //Y
            "\n", this.points[0].y,
            "\n", "30", //Z
            "\n", "0.0",
            "\n", "40",
            "\n", this.radius //DIAMETER
        )
        console.log(" circle.js - DXF Data:" + data)
        return data
    }

    trim(points, core) {
        console.log("circle.js - Points:", points.length)

        if (points.length > 1) {

            var start = points[0];
            var cen = core.mouse.currentPoint();
            var end = points[1];

            //console.log("Angle:", a-a, " Angle2: ", b, " centre: ", c)

            var arcPoints = [this.points[0]];

            var dir = (start.x - cen.x) * (end.y - cen.y) - (start.y - cen.y) * (end.x - cen.x)
            if (dir > 0) {
                console.log("Clockwise")
                arcPoints.push(points[0], points[1])
            } else if (dir < 0) {
                console.log("Counterclockwise")
                arcPoints.push(points[1], points[0])
            }


            var data = {
                points: arcPoints,
                colour: this.colour,
                layer: this.layer,
                lineWidth: this.lineWidth
            }

            //TODO: Can't call scene from here
            core.scene.addToScene("Arc", data, false, core.scene.items.indexOf(this))

        }
    }

    intersectPoints() {
        return {
            centre: this.points[0],
            radius: this.radius
        }
    }

    snaps(mousePoint, delta) {

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var snaps = [];

        if (settings.centreSnap) {
            var centre = new Point(this.points[0].x, this.points[0].y);
            snaps.push(centre)
        }

        if (settings.quadrantSnap) {
            var angle0 = new Point(this.points[0].x + this.radius, this.points[0].y);
            var angle90 = new Point(this.points[0].x, this.points[0].y + this.radius);
            var angle180 = new Point(this.points[0].x - this.radius, this.points[0].y);
            var angle270 = new Point(this.points[0].x, this.points[0].y - this.radius);

            snaps.push(angle0, angle90, angle180, angle270)

        }

        if (settings.nearestSnap) {
            var closest = this.closestPoint(mousePoint)

            // Crude way to snap to the closest point or a node
            if (closest[1] < delta / 10) {
                snaps.push(closest[0])
            }
        }

        return snaps;
    }

    closestPoint(P) {
        //find the closest point on the circle
        var length = Utils.distBetweenPoints(this.points[0].x, this.points[0].y, P.x, P.y)
        var Cx = this.points[0].x + this.radius * (P.x - this.points[0].x) / length
        var Cy = this.points[0].y + this.radius * (P.y - this.points[0].y) / length
        var closest = new Point(Cx, Cy);
        var distance = Utils.distBetweenPoints(closest.x, closest.y, P.x, P.y)

        return [closest, distance]
    }

    diameter() {
        var diameter = 2 * this.radius
        return diameter
    }

    circumference() {
        var circumference = Math.PI * 2 * this.radius;
        return circumference
    }

    area() {
        var area = Math.pow((Math.PI * this.radius), 2);
        return area
    }

    extremes() {

        var xmin = this.points[0].x - this.radius;
        var xmax = this.points[0].x + this.radius;
        var ymin = this.points[0].y - this.radius;
        var ymax = this.points[0].y + this.radius;

        return [xmin, xmax, ymin, ymax]

    }

    within(selection_extremes) {

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        // determin if this entities is within a the window specified by selection_extremes
        var extremePoints = this.extremes()
        if (extremePoints[0] > selection_extremes[0] &&
            extremePoints[1] < selection_extremes[1] &&
            extremePoints[2] > selection_extremes[2] &&
            extremePoints[3] < selection_extremes[3]
        ) {

            return true
        } else {
            return false
        }

    }

    touched(selection_extremes) {

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var rP1 = new Point(selection_extremes[0], selection_extremes[2]);
        var rP2 = new Point(selection_extremes[1], selection_extremes[3]);

        var rectPoints = {
            start: rP1,
            end: rP2
        }
        var output = Intersection.intersectCircleRectangle(this.intersectPoints(), rectPoints);
        console.log(output.status)

        if (output.status === "Intersection") {
            return true
        } else {
            return false
        }
    }
}
