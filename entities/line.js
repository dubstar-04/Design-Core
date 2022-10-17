import { Point } from './point.js'
import { Utils } from '../lib/utils.js'
import { Intersection } from '../lib/intersect.js'
import { Colours } from '../lib/colours.js'

export class Line {
    constructor(data) {
        //Define Properties         //Associated DXF Value
        this.type = "Line";
        this.family = "Geometry";
        this.minPoints = 2;
        this.showPreview = true; //show preview of item as its being created
        //this.limitPoints = false;
        //this.allowMultiple = true;
        this.helper_geometry = false; // If true a line will be drawn between points when defining geometry
        this.points = [];
        this.lineWidth = 2; //Thickness
        this.colour = "BYLAYER";
        this.layer = "0";
        this.alpha = 1.0 //Transparancy
        //this.lineType
        //this.LinetypeScale
        //this.PlotStyle
        //this.LineWeight

        if (data) {

            //console.log(data.points, data.colour, data.layer)

            var startPoint = new Point(data.points[data.points.length - 2].x, data.points[data.points.length - 2].y);
            var endPoint = new Point(data.points[data.points.length - 1].x, data.points[data.points.length - 1].y);

            this.points.push(startPoint);
            this.points.push(endPoint);
            //this.points = [points[points.length-2], points[points.length-1]];

            if (data.colour) {
                this.colour = data.colour;
            }

            if (data.layer) {
                this.layer = data.layer;
            }
        }
    }


    static register() {
        var command = { command: "Line", shortcut: "L" };
        return command
    }

    prompt(core) {
        var num = core.scene.inputArray.length;
        var expectedType = [];
        var reset = false;
        var action = false;
        var validInput = true
        var prompt = [];

        //console.log("inputArray: ", inputArray)

        expectedType[0] = ["undefined"];
        prompt[0] = "Pick start point:";

        expectedType[1] = ["object"];
        prompt[1] = "Pick another point or press ESC to quit:";

        expectedType[2] = ["object", "number"];
        prompt[2] = prompt[1];

        expectedType[3] = ["object", "number"];
        prompt[3] = prompt[1];

        validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1])

        if (!validInput || num > this.minPoints) {
            core.scene.inputArray.pop()
        }

        if (core.scene.inputArray.length === this.minPoints) {
            action = true;
            //reset = true
        }

        return [prompt[core.scene.inputArray.length], reset, action, validInput]
    }

    draw(ctx, scale, core) {

        if (!core.layerManager.layerVisible(this.layer)) {
            return
        }

        var colour = this.colour;

        if (this.colour === "BYLAYER") {
            colour = core.layerManager.getLayerByName(this.layer).colour
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

        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.lineTo(this.points[1].x, this.points[1].y);
        ctx.stroke()
    }

    dxf() {
        var dxfitem = ""
        var data = dxfitem.concat(
            "0",
            "\n", "LINE",
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
            "\n", "11", //X
            "\n", this.points[1].x,
            "\n", "21", //Y
            "\n", this.points[1].y, //Y
            "\n", "31", //Z
            "\n", "0.0"
        )
        console.log(" line.js - DXF Data:" + data)
        return data
    }

    trim(points, core) {

        console.log("line.js - Points:", points.length)

        function trimOneEnd(intersectPnts, line) {
            console.log("line.js - trimOneEnd")

            var originPoint;
            var destinationPoint;
            var validPoints = []

            //Find which end is closer to the mouse
            // if(line.points[0].distance(mouse) < line.points[1].distance(mouse)){
            //     originPoint = 0;
            // }else{
            //     originPoint = 1;
            // }

            for (var i = 0; i < line.points.length; i++) {
                for (var j = 0; j < intersectPnts.length; j++) {
                    if (betweenPoints(core.mouse, [intersectPnts[j], line.points[i]], false)) {
                        //console.log("Trimmed Length:", Math.round(intersectPnts[j].distance(line.points[i]) * 100) / 100, "Line length: ", Math.round(line.points[0].distance(line.points[1]) * 100) / 100)
                        if (Math.round(intersectPnts[j].distance(line.points[i]) * 100) / 100 < Math.round(line.points[0].distance(line.points[1]) * 100) / 100) {
                            originPoint = i;
                            validPoints.push(j)
                        }
                    }
                }
            }

            if (typeof validPoints !== "undefined") {
                var dist = Number.POSITIVE_INFINITY;

                for (var j = 0; j < validPoints.length; j++) {
                    if (line.points[originPoint].distance(intersectPnts[validPoints[j]]) < dist) {
                        dist = line.points[originPoint].distance(intersectPnts[validPoints[j]]);
                        destinationPoint = validPoints[j]
                        console.log("line.js - trim - Valid Point:", validPoints[j], "distance:", dist)
                    }
                }
            }

            if (typeof destinationPoint !== "undefined") {
                console.log("destination point:", destinationPoint)
                line.points[originPoint] = intersectPnts[destinationPoint];
            }
        }

        function trimBetween(pnts, line) {
            console.log("line.js - trimBetween")

            var a = Math.round(line.points[0].distance(pnts[0]));
            var b = Math.round(line.points[0].distance(pnts[1]));
            var c = Math.round(line.points[1].distance(pnts[0]));
            var d = Math.round(line.points[1].distance(pnts[1]));

            if (a === 0 && d === 0 || b === 0 && c === 0) {

                console.log("line.js -  trim() - Line Already Trimmed")
            } else {

                var data = {
                    points: [pnts[a < b ? 1 : 0], line.points[1]],
                    colour: line.colour,
                    layer: line.layer,
                    lineWidth: line.lineWidth
                }

                core.scene.addToScene("Line", data, false)

                if (a < b) {
                    line.points[1] = pnts[0];
                } else {
                    line.points[1] = pnts[1];
                }
            }
        }

        function betweenPoints(mousePnt, pntsArray, returnPoints) {

            for (var i = 0; i < pntsArray.length - 1; i++) {
                var a = pntsArray[i].distance(mousePnt)
                var b = pntsArray[i + 1].distance(mousePnt)
                var c = pntsArray[i].distance(pntsArray[i + 1])

                if (Math.round(a + b) === Math.round(c)) {
                    console.log("line.js - trim() - mouse is between two other points")
                    if (returnPoints)
                        return [pntsArray[i], pntsArray[i + 1]];

                    return true;
                }
            }
        }

        if (points.length > 1) {
            //is the mouse between two points
            var pnts = betweenPoints(core.mouse, points, true)

            if (typeof pnts !== "undefined") {
                trimBetween(pnts, this);
            } else {
                console.log("line.js - trim() - multiple intersection & mouse is at one end")
                trimOneEnd(points, this)
            }


        } else {
            console.log("line.js - trim() - single intersection & mouse is at one end")
            trimOneEnd(points, this)
        }

    }

    extend(points) {

        var originPoint;
        var destinationPoint;

        //Find which end is closer to the mouse
        //ToDo: Pass the mouse location in rather than needing a ref to core.
        if (this.points[0].distance(core.mouse) < this.points[1].distance(core.mouse)) {
            originPoint = 0;
        } else {
            originPoint = 1;
        }

        // check if any of the points are valid
        var validPoints = [];

        for (var i = 0; i < points.length; i++) {

            console.log("line.js - extend - intersection point:", i)

            console.log("line.js - extend - origin to dest:", Math.round(this.points[originPoint].angle(points[i])))
            console.log("line.js - extend - origin angle:", Math.round(this.points[originPoint ? 0 : 1].angle(this.points[originPoint])))

            if (Math.round(this.points[originPoint].angle(points[i])) === Math.round(this.points[originPoint ? 0 : 1].angle(this.points[originPoint])))

                // if the destination point is different than the origin add it to the array of valid points
                if (Math.round(this.points[originPoint].distance(points[i])) !== 0) {
                    validPoints.push(i)
                }
        }

        console.log("line.js - extend - Valid Points:", validPoints.length);

        if (validPoints.length > 1) {
            var dist = Number.POSITIVE_INFINITY;

            for (var j = 0; j < validPoints.length; j++) {
                if (this.points[originPoint].distance(points[validPoints[j]]) < dist) {
                    dist = this.points[originPoint].distance(points[validPoints[j]]);
                    destinationPoint = validPoints[j]
                    console.log("line.js - extend - Valid Point:", validPoints[j], "distance:", dist)
                }
            }
        } else if (validPoints.length === 1) {
            //only one valid point
            destinationPoint = validPoints[0]
        }

        if (destinationPoint !== undefined) {
            console.log("destination point:", destinationPoint)
            this.points[originPoint] = points[destinationPoint];
        }

    }

    intersectPoints() {

        return {
            start: this.points[0],
            end: this.points[1]
        }

    }

    length() {
        var A = (this.points[0].x - this.points[1].x)
        var B = (this.points[0].y - this.points[1].y)
        var ASQ = Math.pow(A, 2)
        var BSQ = Math.pow(B, 2)
        var dist = Math.sqrt(ASQ + BSQ)

        return dist
    }

    midPoint() {
        //var midX = (this.points[0].x + this.points[1].x) / 2
        //var midY = (this.points[0].y + this.points[1].y) / 2

        var midPoint = this.points[0].midPoint(this.points[1]); //new Point(midX, midY);

        return midPoint;
    }

    angle() {
        var angle = 180;
        return angle
    }

    snaps(mousePoint, delta, core) {

        if (!core.layerManager.layerVisible(this.layer)) {
            return
        }

        var snaps = [];

        if (core.settings.endSnap) {
            var start = new Point(this.points[0].x, this.points[0].y);
            var end = new Point(this.points[1].x, this.points[1].y);
            snaps.push(start, end);
        }

        if (core.settings.midSnap) {
            snaps.push(this.midPoint())
        }

        if (core.settings.nearestSnap) {
            var closest = this.closestPoint(mousePoint, start, end)

            // Crude way to snap to the closest point or a node
            if (closest[1] < delta / 10) {
                snaps.push(closest[0])
            }
        }

        return snaps;
    }

    closestPoint(P) {

        //find the closest point on the straight line
        var A = new Point(this.points[0].x, this.points[0].y);
        var B = new Point(this.points[1].x, this.points[1].y);

        var pnt = P.perpendicular(A, B)
        if (pnt === null) {
            return [P, Infinity]
        }

        var distance = Utils.distBetweenPoints(P.x, P.y, pnt.x, pnt.y)
        // console.log(distance);
        return [pnt, distance]

    }

    extremes() {

        var xmin = Math.min(this.points[0].x, this.points[1].x);
        var xmax = Math.max(this.points[0].x, this.points[1].x);
        var ymin = Math.min(this.points[0].y, this.points[1].y);
        var ymax = Math.max(this.points[0].y, this.points[1].y);

        return [xmin, xmax, ymin, ymax]

    }

    within(selection_extremes, core) {

        if (!core.layerManager.layerVisible(this.layer)) {
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

        if (!core.layerManager.layerVisible(this.layer)) {
            return
        }

        var rP1 = new Point(selection_extremes[0], selection_extremes[2]);
        var rP2 = new Point(selection_extremes[1], selection_extremes[3]);

        var rectPoints = {
            start: rP1,
            end: rP2
        }

        //var lP1 = new Point(this.points[0].x, this.points[0].y);
        //var lP2 = new Point(this.points[1].x, this.points[1].y);

        var output = Intersection.intersectLineRectangle(this.intersectPoints(), rectPoints);
        console.log(output.status)

        if (output.status === "Intersection") {
            return true
        } else {
            return false
        }
    }
}
