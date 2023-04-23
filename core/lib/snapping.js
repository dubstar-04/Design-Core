
import {Point} from '../entities/point.js';
import {Utils} from './utils.js';

export class Snapping {
  constructor() {
    this.active = false;
  }

  /**
   * Get snap point and draw to the scene
   * @param {scene} scene object //TODO: passing scene is hacky. Find a cleaner way
   */
  snap(scene) {
    const snapPoint = this.getSnapPoint(scene);
    if (snapPoint) {
      this.addSnapPoint(snapPoint, scene);
    }
  }

  /**
   * Draw the snap point
   * @param {Point} snapPoint
   * @param {scene} scene
   */
  addSnapPoint(snapPoint, scene) {
    // Draw a circle to highlight the snap.
    const CentrePoint = new Point(snapPoint.x, snapPoint.y);
    const radiusPoint = new Point(snapPoint.x, snapPoint.y + (5 / scene.core.canvas.getScale()));
    const snapCirclePoints = [CentrePoint, radiusPoint];

    const data = {
      points: snapCirclePoints,
      colour: scene.core.settings.snapcolour.toString(),
    };

    const item = scene.core.commandManager.createNew('Circle', data);
    scene.tempItems.push(item);

    // Move the mouse to the closest snap point so if the mouse if clicked the snap point is used.
    scene.core.mouse.setPosFromScenePoint(snapPoint);
  }

  /**
   * Get the closest snap point
   * @param {scene} scene
   * @returns Point or undefined
   */
  getSnapPoint(scene) {
    let snapPoint;
    let delta = 25 / scene.core.canvas.getScale(); // find a more suitable starting value

    for (let i = 0; i < scene.items.length; i++) {
      const layer = scene.core.layerManager.getLayerByName(scene.items[i].layer);

      if (!layer.isVisible) {
        continue;
      }

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

  /**
   * Get the polar snap point from the current mouse position
   * @param {Point} previousPoint
   * @param {core} core
   * @returns Point or undefined
   */
  polarSnap(previousPoint, core) {
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

  /**
   * Get the ortho snap point from the current mouse position
   * @param {Point} previousPoint
   * @param {core} core
   * @returns Point or undefined
   */
  orthoSnap(previousPoint, core) {
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
