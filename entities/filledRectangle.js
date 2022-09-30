import { Point } from './point.js'
import { Utils } from '../lib/utils.js'
import { Intersection } from '../lib/intersect.js'

export class FilledRectangle {
    constructor(data) {
        //Define Properties         //Associated DXF Value
        this.type = "FilledRectangle";
        this.family = "Geometry";
        this.minPoints = 2;
        this.showPreview = true; //show preview of item as its being created
        //this.limitPoints = true;
        //this.allowMultiple = false;
        this.helper_geometry = false; // If true a Line will be drawn between points when defining geometry
        this.points = [];
        this.lineWidth = 2; //Thickness
        this.colour = "BYLAYER";
        this.layer = "0";
        this.alpha = 1.0 //Transparancy
        this.width = 0.0
        this.height = 0.0
        //this.RectangleType
        //this.RectangletypeScale
        //this.PlotStyle
        //this.RectangleWeight


        if (data) {

            if (data.points) {
                var point1 = new Point(data.points[0].x, data.points[0].y);
                var point2 = new Point(data.points[1].x, data.points[0].y);
                var point3 = new Point(data.points[1].x, data.points[1].y);
                var point4 = new Point(data.points[0].x, data.points[1].y);
                var point5 = new Point(data.points[0].x, data.points[0].y);

                this.points.push(point1);
                this.points.push(point2);
                this.points.push(point3);
                this.points.push(point4);
                this.points.push(point5);

                this.width = data.points[1].x - data.points[0].x
                this.height = data.points[1].y - data.points[0].y
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
        var command = { command: "FilledRectangle", shortcut: "FR" };
        return command
    }

    prompt(core) {
        var num = core.scene.inputArray.length;
        var expectedType = [];
        var reset = false;
        var action = false;
        var prompt = [];

        expectedType[0] = ["undefined"];
        prompt[0] = "Pick the start point:";

        expectedType[1] = ["object"];
        prompt[1] = "Pick opposite corner:";

        expectedType[2] = ["object"];
        prompt[2] = prompt[1];

        var validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1])

        if (!validInput || num > this.minPoints) {
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

        var alpha = ctx.globalAlpha

        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(this.points[0].x, this.points[0].y, this.width, this.height);

        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = colour;
        ctx.lineWidth = this.lineWidth / scale;
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.lineTo(this.points[1].x, this.points[1].y);
        ctx.lineTo(this.points[2].x, this.points[2].y);
        ctx.lineTo(this.points[3].x, this.points[3].y);
        ctx.lineTo(this.points[4].x, this.points[4].y);
        ctx.stroke()
    }

    dxf() {

        //Save the rectangle as a polyline as there is no rectangle DXF code
        var closed = (this.points[0].x === this.points[this.points.length - 1].x && this.points[0].y === this.points[this.points.length - 1].y);
        var vertices = this.vertices();
        var dxfitem = ""
        var data = dxfitem.concat(
            "0",
            "\n", "POLYLINE",
            //"\n", "5", //HANDLE
            //"\n", "DA",
            "\n", "8", //LAYERNAME
            "\n", this.layer,
            "\n", "10", //X
            "\n", "0",
            "\n", "20", //Y
            "\n", "0",
            "\n", "30", //Z
            "\n", "0",
            "\n", "39", //Line Width
            "\n", this.lineWidth,
            "\n", "70", //Flags
            "\n", closed ? "1" : "0",
            "\n", "100", //Subclass marker
            "\n", "AcDb2dPolyline",
            vertices, //Dont use a new line here as the vertix data will start with a new line.
            "\n", "0"
        )
        console.log(" rectangle.js - DXF Data:" + data)
        return data
    }

    vertices() {

        //var rectangle_points = [];

        // var point1 = new Point(this.points[0].x, this.points[0].y);
        // var point2 = new Point(this.points[1].x, this.points[0].y);
        // var point3 = new Point(this.points[1].x, this.points[1].y);
        // var point4 = new Point(this.points[0].x, this.points[1].y);
        // var point5 = new Point(this.points[0].x, this.points[0].y);

        // rectangle_points.push(point1);
        // rectangle_points.push(point2);
        //  rectangle_points.push(point3);
        //  rectangle_points.push(point4);
        //  rectangle_points.push(point5);

        var vertices_data = "";
        for (var i = 0; i < this.points.length; i++) {

            vertices_data = vertices_data.concat(
                "\n", "0",
                "\n", "VERTEX",
                //"\n", "5", //HANDLE
                //"\n", "DA",
                "\n", "8", //LAYERNAME
                "\n", "0",
                "\n", "100",
                "\n", "AcDbVertex",
                "\n", "100",
                "\n", "AcDb2dVertex",
                "\n", "10", //X
                "\n", this.points[i].x,
                "\n", "20", //Y
                "\n", this.points[i].y,
                "\n", "30", //Z
                //"\n", "0",
                "\n", "0"
            )
        }

        return vertices_data;
    }

    intersectPoints() {

        return {
            start: this.points[0],
            end: this.points[2]
        }

    }


    midPoint(x, x1, y, y1) {

        var midX = (x + x1) / 2
        var midY = (y + y1) / 2

        var midPoint = new Point(midX, midY);

        return midPoint;

    }


    snaps(mousePoint, delta) {

        if (!core.LM.layerVisible(this.layer)) {
            return
        }

        var snaps = [];

        if (settings.endSnap) {
            // End points for each segment
            for (var i = 0; i < this.points.length; i++) {
                snaps.push(this.points[i]);
            }
        }

        if (settings.midSnap) {
            for (var i = 1; i < this.points.length; i++) {

                var start = this.points[i - 1];
                var end = this.points[i]

                snaps.push(this.midPoint(start.x, end.x, start.y, end.y));
            }
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

        var closest = new Point();
        var distance = 1.65;

        for (var i = 1; i < this.points.length; i++) {

            var A = this.points[i - 1];
            var B = this.points[i];

            //find the closest point on the straight line
            var APx = P.x - A.x;
            var APy = P.y - A.y;
            var ABx = B.x - A.x;
            var ABy = B.y - A.y;

            var magAB2 = ABx * ABx + ABy * ABy;
            var ABdotAP = ABx * APx + ABy * APy;
            var t = ABdotAP / magAB2;


            // check if the point is < start or > end
            if (t > 0 && t < 1) {
                closest.x = A.x + ABx * t
                closest.y = A.y + ABy * t

                var dist = Utils.distBetweenPoints(P.x, P.y, closest.x, closest.y);
                //console.log(" rectangle.js - Dist: " + dist);
                if (dist < distance) {
                    distance = dist;
                }
            }
        }

        return [closest, distance]

    }

    extremes() {

        var x_values = [];
        var y_values = [];

        for (var i = 0; i < this.points.length; i++) {
            x_values.push(this.points[i].x);
            y_values.push(this.points[i].y);
        }

        var xmin = Math.min.apply(Math, x_values)
        var xmax = Math.max.apply(Math, x_values)
        var ymin = Math.min.apply(Math, y_values)
        var ymax = Math.max.apply(Math, y_values)

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

        /* var lP1 = new Point();
         var lP2 = new Point();
    
         var linePoints = {};
    
         var rP1 = new Point(selection_extremes[0], selection_extremes[2]);
         var rP2 = new Point(selection_extremes[1], selection_extremes[3]);
    
         var rectPoints = {start: rP1, end: rP2};
    
         var output = "";
    
         for(var i = 1; i < this.points.length; i++) {
    
             linePoints = {start: this.points[i-1], end: this.points[i]};
    
             output = Intersection.intersectLineRectangle(linePoints, rectPoints);
             console.log(output.status)
    
             if (  output.status === "Intersection"  ){
                 return true
             }
    
         }
         */

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
