
import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

export class Snapping {

    static getSnapPoint(scene) {
        var snapPoint;
        var delta = 25 / scene.core.canvas.getScale(); // find a more suitable starting value

        for (var i = 0; i < scene.items.length; i++) {
            var itemSnaps = scene.items[i].snaps(scene.core.mouse.pointOnScene(), delta, scene.core) // get an array of snap point from the item
            if (itemSnaps) {
                for (var j = 0; j < itemSnaps.length; j++) {
                    var length = Utils.distBetweenPoints(itemSnaps[j].x, itemSnaps[j].y, scene.core.mouse.pointOnScene().x, scene.core.mouse.pointOnScene().y)
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
        var angleTolerance = 3;
        // get the angle to the mouse position
        var mouseAngle = previousPoint.angle(core.mouse.pointOnScene());
        // get the closest polar angle
        var closestPolarAngle = core.settings.polarAngle * Math.round(Utils.radians2degrees(mouseAngle) / core.settings.polarAngle);
        // get the angle to the closest polar angle from the mouse position
        var diff = Utils.radians2degrees(mouseAngle) - closestPolarAngle

        // check if the angle between the mouseAngle and the closestPolarAngle is within tolerance
        if (Math.abs(diff) < angleTolerance) {
            var snapPoint = core.mouse.pointOnScene().rotate(previousPoint, Utils.degrees2radians(-diff))
            return snapPoint;
        }
        return snapPoint;
    }

    static orthoSnap(previousPoint, core) {

        var snapPoint;
        var x = core.mouse.pointOnScene().x - previousPoint.x
        var y = core.mouse.pointOnScene().y - previousPoint.y

        if (Math.abs(x) > Math.abs(y)) {
            snapPoint = new Point( core.mouse.pointOnScene().x, previousPoint.y)
        } else {
            snapPoint = new Point( previousPoint.x, core.mouse.pointOnScene().y)
        }
        return snapPoint;
    }
}
