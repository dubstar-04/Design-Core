
import {Point} from '../entities/point.js';
import {Colours} from './colours.js';
import {Utils} from './utils.js';

import {Core} from '../core.js';

class SnapPoint {
  constructor(snapPoint) {
    this.snapPoint = snapPoint;
  }

  draw(ctx, scale) {
    const snapColour = Core.Settings.snapcolour.toString();
    const radius = 4;

    try { // HTML Canvas
      ctx.strokeStyle = snapColour;
      ctx.beginPath();
    } catch { // Cairo
      const rgbColour = Colours.hexToScaledRGB(snapColour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
    }

    ctx.arc(this.snapPoint.x, this.snapPoint.y, radius / scale, 0, 6.283);
    ctx.fill();
  }
}

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
    // show the snap point
    scene.addToAuxiliaryItems(new SnapPoint(snapPoint));

    // Move the mouse to the closest snap point so if the mouse if clicked the snap point is used.
    Core.Mouse.setPosFromScenePoint(snapPoint);
  }

  /**
   * Get the closest snap point
   * @param {scene} scene
   * @returns Point or undefined
   */
  getSnapPoint(scene) {
    let snapPoint;
    let delta = 25 / Core.Canvas.getScale(); // find a more suitable starting value

    for (let i = 0; i < scene.items.length; i++) {
      const layer = Core.LayerManager.getLayerByName(scene.items[i].layer);

      if (!layer.isVisible) {
        continue;
      }

      const itemSnaps = scene.items[i].snaps(Core.Mouse.pointOnScene(), delta); // get an array of snap point from the item
      if (itemSnaps) {
        for (let j = 0; j < itemSnaps.length; j++) {
          const length = itemSnaps[j].distance(Core.Mouse.pointOnScene());
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
   * @returns Point or undefined
   */
  polarSnap(previousPoint) {
    let snapPoint;
    const angleTolerance = 4;
    // get the angle to the mouse position
    const mouseAngle = previousPoint.angle(Core.Mouse.pointOnScene());
    // get the closest polar angle
    const closestPolarAngle = Core.Settings.polarangle * Math.round(Utils.radians2degrees(mouseAngle) / Core.Settings.polarangle);
    // get the angle to the closest polar angle from the mouse position
    const diff = Utils.radians2degrees(mouseAngle) - closestPolarAngle;

    // check if the angle between the mouseAngle and the closestPolarAngle is within tolerance
    if (Math.abs(diff) < angleTolerance) {
      snapPoint = Core.Mouse.pointOnScene().rotate(previousPoint, Utils.degrees2radians(-diff));
      return snapPoint;
    }
    return snapPoint;
  }

  /**
   * Get the ortho snap point from the current mouse position
   * @param {Point} previousPoint
   * @returns Point or undefined
   */
  orthoSnap(previousPoint) {
    let snapPoint;
    const x = Core.Mouse.pointOnScene().x - previousPoint.x;
    const y = Core.Mouse.pointOnScene().y - previousPoint.y;

    if (Math.abs(x) > Math.abs(y)) {
      snapPoint = new Point(Core.Mouse.pointOnScene().x, previousPoint.y);
    } else {
      snapPoint = new Point(previousPoint.x, Core.Mouse.pointOnScene().y);
    }
    return snapPoint;
  }
}
