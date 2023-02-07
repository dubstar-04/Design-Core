
import {Point} from '../entities/point.js';
import {Utils} from './utils.js';

export class Snapping {
  static getSnapPoint(scene) {
    let snapPoint;
    let delta = 25 / scene.core.canvas.getScale(); // find a more suitable starting value

    for (let i = 0; i < scene.items.length; i++) {
      const itemSnaps = scene.items[i].snaps(scene.core.mouse.pointOnScene(), delta, scene.core); // get an array of snap point from the item
      if (itemSnaps) {
        for (let j = 0; j < itemSnaps.length; j++) {
          const length = Utils.distBetweenPoints(itemSnaps[j].x, itemSnaps[j].y, scene.core.mouse.pointOnScene().x, scene.core.mouse.pointOnScene().y);
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
    let snapPoint;
    const angleTolerance = 4;
    // get the angle to the mouse position
    const mouseAngle = previousPoint.angle(core.mouse.pointOnScene());
    // get the closest polar angle
    const closestPolarAngle = core.settings.polarangle * Math.round(Utils.radians2degrees(mouseAngle) / core.settings.polarangle);
    // get the angle to the closest polar angle from the mouse position
    const diff = Utils.radians2degrees(mouseAngle) - closestPolarAngle;

    // check if the angle between the mouseAngle and the closestPolarAngle is within tolerance
    if (Math.abs(diff) < angleTolerance) {
      snapPoint = core.mouse.pointOnScene().rotate(previousPoint, Utils.degrees2radians(-diff));
      return snapPoint;
    }
    return snapPoint;
  }

  static orthoSnap(previousPoint, core) {
    let snapPoint;
    const x = core.mouse.pointOnScene().x - previousPoint.x;
    const y = core.mouse.pointOnScene().y - previousPoint.y;

    if (Math.abs(x) > Math.abs(y)) {
      snapPoint = new Point( core.mouse.pointOnScene().x, previousPoint.y);
    } else {
      snapPoint = new Point( previousPoint.x, core.mouse.pointOnScene().y);
    }
    return snapPoint;
  }
}
