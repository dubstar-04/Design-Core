import { Point } from './point.js'
import { Utils } from '../lib/utils.js'
import { Intersection } from '../lib/intersect.js'
import { Colours } from '../lib/colours.js'

export class Arc {
    constructor(data) {
        //Define Properties         //Associated DXF Value
        this.type = "Arc";
        this.family = "Geometry";
        this.minPoints = 3; //Should match number of cases in prompt
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
                this.radius = this.points[0].distance(this.points[1])
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
        var command = { command: "Arc", shortcut: "A" };
        return command
    }

    startAngle() {
        return this.points[0].angle(this.points[1])
    }

    endAngle() {
        return this.points[0].angle(this.points[2])
    }


    direction() {

        var start = this.startAngle();
        var end = this.endAngle();
        //var direction;

        console.log("Start angle: ", start, " end angle: ", end)
        end = end - start;
        start = start - start;
        console.log("Start angle adjusted to zero: ", start, " end angle: ", end)
        /* if(end < 0){
            end = end + 2 * Math.PI
            console.log("Start angle corrected for minus: ", start, " end angle: ", end)
        }
        */

        return end < start; // < end;

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
        prompt[1] = "Pick start point:";

        expectedType[2] = ["object"];
        prompt[2] = "Pick end point:";

        expectedType[3] = ["object"];
        prompt[3] = "";

        var validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1])

        if (!validInput) {
            core.scene.inputArray.pop()
        }

        if (core.scene.inputArray.length === this.minPoints) {
            action = true;
            reset = true;
            this.helper_geometry = false;
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


        try{ // HTML Canvas
            ctx.strokeStyle = colour;
            ctx.lineWidth = this.lineWidth / scale;
            ctx.beginPath()
          }catch{ // Cairo
            ctx.setLineWidth(this.lineWidth / scale);
            var rgbColour = Colours.hexToScaledRGB(colour)
            ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
          }

        ctx.arc(this.points[0].x, this.points[0].y, this.radius, this.startAngle(), this.endAngle())

        ctx.stroke()
    }

    properties() {

        return { //type: this.type,
            colour: this.colour,
            layer: this.layer,
            lineWidth: this.lineWidth
        }


    }

    dxf() {
        var dxfitem = ""
        var data = dxfitem.concat(
            "0",
            "\n", "ARC",
            "\n", "8", //LAYERNAME
            "\n", this.layer,
            "\n", "10", //X
            "\n", this.points[0].x,
            "\n", "20", //Y
            "\n", this.points[0].y,
            "\n", "30", //Z
            "\n", "0.0",
            "\n", "40",
            "\n", this.radius, //Radius
            "\n", "50", //START ANGLE
            "\n", Utils.radians2degrees(this.startAngle()), //Radians
            "\n", "51", //END ANGLE
            "\n", Utils.radians2degrees(this.endAngle()) //Radians
        )
        console.log(" arc.js - DXF Data:" + data)
        return data
    }

    trim(points, core) {
        console.log("arc.js - Points:", points.length)
    }

    intersectPoints() {

        return {
            centre: this.points[0],
            radius: this.radius,
            startAngle: this.startAngle(),
            endAngle: this.endAngle()
        }

    }

    snaps(mousePoint, delta, core) {

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var snaps = [];

        if (core.settings.endSnap) {
            //Speed this up by generating the proper start and end points when the arc is initialised
            var start_point = new Point(this.points[0].x + (this.radius * Math.cos(this.startAngle())),
                this.points[0].y + (this.radius * Math.sin(this.startAngle())));
            var end_point = new Point(this.points[0].x + (this.radius * Math.cos(this.endAngle())),
                this.points[0].y + (this.radius * Math.sin(this.endAngle())));

            snaps.push(start_point, end_point);
        }

        if (core.settings.centreSnap) {
            var centre = this.points[0];
            snaps.push(centre)
        }

        if (core.settings.nearestSnap) {
            var closest = this.closestPoint(mousePoint)
            //var snaps = [center, start_point, end_point];

            // Crude way to snap to the closest point or a node
            if (closest[2] === true && closest[1] < delta / 10) {
                snaps.push(closest[0])
            }
        }


        return snaps;
    }

    closestPoint(P) {
        //find the closest point on the Arc
        var length = this.points[0].distance(P); //distBetweenPoints(this.points[0].x, this.points[0].y, P.x, P.y)
        var Cx = this.points[0].x + this.radius * (P.x - this.points[0].x) / length
        var Cy = this.points[0].y + this.radius * (P.y - this.points[0].y) / length
        var closest = new Point(Cx, Cy);
        var distance = closest.distance(P); //distBetweenPoints(closest.x, closest.y, P.x, P.y)

        //var A_end = this.points[0].x - closest.x;
        //var O_end = this.points[0].y - closest.y;
        var snap_angle = this.points[0].angle(P) //Math.atan2(O_end,A_end) + Math.PI;

        if (snap_angle > this.startAngle() && snap_angle < this.endAngle()) {
            return [closest, distance, true];
        } else {
            return [closest, distance, false];
        }


    }

    diameter() {
        var diameter = 2 * this.radius
        return diameter
    }


    area() {
        var area = Math.pow((Math.PI * this.radius), 2); //not valid for an arc
        return area
    }

    extremes() {

        var x_values = [];
        var y_values = [];

        //var midAngle = (this.endAngle() - this.startAngle()) / 2 + this.startAngle();

        //console.log(" arc.js - [info] (extremes) radius: " + this.radius + " startAngle: " + this.startAngle() + " endAngle: " + this.endAngle())// + " midAngle: " + midAngle);

        x_values.push(this.radius * Math.cos(this.startAngle()) + this.points[0].x);
        y_values.push(this.radius * Math.sin(this.startAngle()) + this.points[0].y);
        //x_values.push( this.radius * Math.cos(midAngle) + this.points[0].x);
        //y_values.push( this.radius * Math.sin(midAngle) + this.points[0].y);
        x_values.push(this.radius * Math.cos(this.endAngle()) + this.points[0].x);
        y_values.push(this.radius * Math.sin(this.endAngle()) + this.points[0].y);

        x_values.push((x_values[0] + x_values[1]) / 2)
        y_values.push((y_values[0] + y_values[1]) / 2)

        var xmin = Math.min.apply(Math, x_values)
        var xmax = Math.max.apply(Math, x_values)
        var ymin = Math.min.apply(Math, y_values)
        var ymax = Math.max.apply(Math, y_values)

        //console.log(" arc.js - (Arc Extremes)" + xmin, xmax, ymin, ymax)
        return [xmin, xmax, ymin, ymax]

    }

    within(selection_extremes, core) {

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

    touched(selection_extremes, core) {

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var rP1 = new Point(selection_extremes[0], selection_extremes[2]);
        var rP2 = new Point(selection_extremes[1], selection_extremes[3]);

        var rectPoints = {
            start: rP1,
            end: rP2
        }
        var output = Intersection.intersectArcRectangle(this.intersectPoints(), rectPoints);
        //console.log(output.status)

        if (output.status === "Intersection") {
            return true
        } else {
            return false
        }
    }
}
