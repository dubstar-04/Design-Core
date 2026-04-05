
import { Point } from '../entities/point.js';
import { Colours } from './colours.js';
import { Utils } from './utils.js';

import { DesignCore } from '../designCore.js';

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

/** TrackingLine Class - dotted tracking line for polar/ortho snap */
class TrackingLine {
  /**
   * Create TrackingLine
   * @param {Point} inputPoint - the previous input point (line passes through this)
   * @param {Point} snapPoint - the current snapped mouse point (direction reference)
   */
  constructor(inputPoint, snapPoint) {
    this.inputPoint = inputPoint;
    this.snapPoint = snapPoint;
  }

  /**
   * Draw the tracking line, extended to the visible canvas edges
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    const from = this.inputPoint;
    const dir = this.snapPoint.subtract(from);

    if (dir.x === 0 && dir.y === 0) {
      return;
    }

    // Compute visible canvas bounds in scene space
    const w = DesignCore.Canvas.width;
    const h = DesignCore.Canvas.height;
    const corner0 = DesignCore.Mouse.transformToScene(new Point(0, 0));
    const corner1 = DesignCore.Mouse.transformToScene(new Point(w, h));
    const boundsMin = corner0.min(corner1);
    const boundsMax = corner0.max(corner1);

    // Clip the infinite line (through 'from' in direction dir) to canvas bounds
    let tMin = -Infinity;
    let tMax = Infinity;

    if (dir.x !== 0) {
      const tx1 = (boundsMin.x - from.x) / dir.x;
      const tx2 = (boundsMax.x - from.x) / dir.x;
      tMin = Math.max(tMin, Math.min(tx1, tx2));
      tMax = Math.min(tMax, Math.max(tx1, tx2));
    } else if (from.x < boundsMin.x || from.x > boundsMax.x) {
      return;
    }

    if (dir.y !== 0) {
      const ty1 = (boundsMin.y - from.y) / dir.y;
      const ty2 = (boundsMax.y - from.y) / dir.y;
      tMin = Math.max(tMin, Math.min(ty1, ty2));
      tMax = Math.min(tMax, Math.max(ty1, ty2));
    } else if (from.y < boundsMin.y || from.y > boundsMax.y) {
      return;
    }

    if (tMax < tMin) {
      return;
    }

    const start = from.add(dir.scale(tMin));
    const end = from.add(dir.scale(tMax));

    const lineColour = DesignCore.Settings.snapcolour;
    const dashSize = 4 / scale;

    ctx.save();

    try { // HTML Canvas
      ctx.beginPath();
      ctx.strokeStyle = Colours.rgbToString(lineColour);
      ctx.lineWidth = 1 / scale;
      ctx.setLineDash([dashSize, dashSize]);
    } catch { // Cairo
      const rgbColour = Colours.rgbToScaledRGB(lineColour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      ctx.setLineWidth(1 / scale);
      ctx.setDash([dashSize, dashSize], 0);
    }

    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.restore();
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
    DesignCore.Scene.auxiliaryEntities.add(new SnapPoint(snapPoint));

    // Move the mouse to the closest snap point so if the mouse if clicked the snap point is used.
    DesignCore.Mouse.setPosFromScenePoint(snapPoint);
  }

  /**
   * Add a tracking line for polar/ortho snap to the scene
   * @param {Point} inputPoint - previous input point the line passes through
   * @param {Point} snapPoint - current snapped mouse position (defines direction)
   */
  addTrackingLine(inputPoint, snapPoint) {
    DesignCore.Scene.auxiliaryEntities.add(new TrackingLine(inputPoint, snapPoint));
  }

  /**
   * Get the closest snap point
   * @return {Point} or undefined
   */
  getSnapPoint() {
    let snapPoint;
    let delta = 25 / DesignCore.Canvas.getScale(); // find a more suitable starting value

    for (let i = 0; i < DesignCore.Scene.entities.count(); i++) {
      const layer = DesignCore.LayerManager.getItemByName(DesignCore.Scene.entities.get(i).layer);

      if (!layer?.isVisible) {
        continue;
      }

      const itemSnaps = DesignCore.Scene.entities.get(i).snaps(DesignCore.Mouse.pointOnScene(), delta); // get an array of snap point from the item
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
    const mousePoint = DesignCore.Mouse.pointOnScene();
    const delta = mousePoint.subtract(previousPoint);

    if (Math.abs(delta.x) > Math.abs(delta.y)) {
      snapPoint = new Point(mousePoint.x, previousPoint.y);
    } else {
      snapPoint = new Point(previousPoint.x, mousePoint.y);
    }
    return snapPoint;
  }
}
