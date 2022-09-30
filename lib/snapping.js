
import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

export class Snapping {

    static getSnapPoint(scene) {
        ////////// Object Snapping //////////
        //var snaps = new Array();

        var snapPoint;

        var delta = 25 / scene.core.canvas.scale; // find a more suitable starting value

        for (var i = 0; i < scene.items.length; i++) {

            var itemSnaps = scene.items[i].snaps(scene.core.mouse.currentPoint(), delta) // get an array of snap point from the item

            if (itemSnaps) {
                for (var j = 0; j < itemSnaps.length; j++) {

                    var length = Utils.distBetweenPoints(itemSnaps[j].x, itemSnaps[j].y, scene.core.mouse.getX(), scene.core.mouse.getY())

                    if (length < delta) {
                        delta = length;
                        snapPoint = itemSnaps[j];
                    }
                }
            }
        }

        return snapPoint;
    }

    static polarSnap(previousPoint, core) {

        var snapPoint;
        var angleDelta = 3;
        var diff = Utils.radians2degrees(previousPoint.angle(core.mouse.currentPoint())) - (settings.polarAngle * Math.round(Utils.radians2degrees(previousPoint.angle(core.mouse.currentPoint())) / settings.polarAngle))

        if (Math.abs(diff) < angleDelta) {

            var snapPoint = core.mouse.currentPoint().rotate(previousPoint, Utils.degrees2radians(-diff))
            return snapPoint;
        }

        return snapPoint;

    }

    static orthoSnap(previousPoint) {

        var snapPoint;
        var x = core.mouse.getX() - previousPoint.x
        var y = core.mouse.getY() - previousPoint.y

        if (Math.abs(x) > Math.abs(y)) {
            snapPoint = new Point( core.mouse.getX(), previousPoint.y)
        } else {
            snapPoint = new Point( previousPoint.x, core.mouse.getY())
            core.mouse.setX(previousPoint.x)
        }

        return snapPoint;

    }
}