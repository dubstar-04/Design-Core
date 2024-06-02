
import {Point} from '../entities/point.js';
import {Colours} from './colours.js';
import {Utils} from './utils.js';

import {DesignCore} from '../designCore.js';

/** SnapPoint Class */
class SnapPoint {
  /**
   * Create SnapPoint
   * @param {Point} snapPoint
   */
  constructor(snapPoint) {
    this.snapPoint = snapPoint;
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    const snapColour = DesignCore.Settings.snapcolour;
    const radius = 4;

    try { // HTML Canvas
      ctx.fillStyle = Colours.rgbToString(snapColour);
      ctx.beginPath();
    } catch { // Cairo
      const rgbColour = Colours.rgbToScaledRGB(snapColour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
    }

    ctx.arc(this.snapPoint.x, this.snapPoint.y, radius / scale, 0, 6.283);
    ctx.fill();
  }
}

/** Snapping Class */
export class Snapping {
  /** Create snapping */
  constructor() {
    this.active = false;
  }

  /**
   * Get snap point and draw to the scene
   * @return {Point} or undefined
   */
  snap() {
    if (this.active) {
      const snapPoint = this.getSnapPoint();
      if (snapPoint) {
        this.addSnapPoint(snapPoint);
        return snapPoint;
      }
    }

    return;
  }

  /**
   * Draw the snap point
   * @param {Point} snapPoint
   */
  addSnapPoint(snapPoint) {
    // show the snap point
    DesignCore.Scene.addToAuxiliaryItems(new SnapPoint(snapPoint));

    // Move the mouse to the closest snap point so if the mouse if clicked the snap point is used.
    DesignCore.Mouse.setPosFromScenePoint(snapPoint);
  }

  /**
   * Get the closest snap point
   * @return {Point} or undefined
   */
  getSnapPoint() {
    let snapPoint;
    let delta = 25 / DesignCore.Canvas.getScale(); // find a more suitable starting value

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      const layer = DesignCore.LayerManager.getItemByName(DesignCore.Scene.items[i].layer);

      if (!layer.isVisible) {
        continue;
      }

      const itemSnaps = DesignCore.Scene.items[i].snaps(DesignCore.Mouse.pointOnScene(), delta); // get an array of snap point from the item
      if (itemSnaps) {
        for (let j = 0; j < itemSnaps.length; j++) {
          const length = itemSnaps[j].distance(DesignCore.Mouse.pointOnScene());
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
   * @return {Point} or undefined
   */
  polarSnap(previousPoint) {
    if (!this.active) {
      return;
    }

    let snapPoint;
    const angleTolerance = 4;
    // get the angle to the mouse position
    const mouseAngle = previousPoint.angle(DesignCore.Mouse.pointOnScene());
    // get the closest polar angle
    const closestPolarAngle = DesignCore.Settings.polarangle * Math.round(Utils.radians2degrees(mouseAngle) / DesignCore.Settings.polarangle);
    // get the angle to the closest polar angle from the mouse position
    const diff = Utils.radians2degrees(mouseAngle) - closestPolarAngle;

    // check if the angle between the mouseAngle and the closestPolarAngle is within tolerance
    if (Math.abs(diff) < angleTolerance) {
      snapPoint = DesignCore.Mouse.pointOnScene().rotate(previousPoint, Utils.degrees2radians(-diff));
      return snapPoint;
    }
    return snapPoint;
  }

  /**
   * Get the ortho snap point from the current mouse position
   * @param {Point} previousPoint
   * @return {Point} or undefined
   */
  orthoSnap(previousPoint) {
    if (!this.active) {
      return;
    }

    let snapPoint;
    const x = DesignCore.Mouse.pointOnScene().x - previousPoint.x;
    const y = DesignCore.Mouse.pointOnScene().y - previousPoint.y;

    if (Math.abs(x) > Math.abs(y)) {
      snapPoint = new Point(DesignCore.Mouse.pointOnScene().x, previousPoint.y);
    } else {
      snapPoint = new Point(previousPoint.x, DesignCore.Mouse.pointOnScene().y);
    }
    return snapPoint;
  }
}
