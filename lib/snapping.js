
import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

export class Snapping {

    static getSnapPoint(scene) {
        ////////// Object Snapping //////////
        //var snaps = new Array();

        var snapPoint;

        var delta = 25 / scene.core.canvas.scale; // find a more suitable starting value

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
        var angleDelta = 3;
        var diff = Utils.radians2degrees(previousPoint.angle(core.mouse.pointOnScene())) - (core.settings.polarAngle * Math.round(Utils.radians2degrees(previousPoint.angle(core.mouse.pointOnScene())) / core.settings.polarAngle))

        if (Math.abs(diff) < angleDelta) {

            var snapPoint = core.mouse.pointOnScene().rotate(previousPoint, Utils.degrees2radians(-diff))
            return snapPoint;
        }

        return snapPoint;

    }

    static orthoSnap(previousPoint) {

        var snapPoint;
        var x = scene.core.mouse.pointOnScene().x - previousPoint.x
        var y = scene.core.mouse.pointOnScene().y - previousPoint.y

        if (Math.abs(x) > Math.abs(y)) {
            snapPoint = new Point( scene.core.mouse.pointOnScene().x, previousPoint.y)
        } else {
            snapPoint = new Point( previousPoint.x, scene.core.mouse.pointOnScene().y)
            core.mouse.setX(previousPoint.x)
        }

        return snapPoint;

    }
}