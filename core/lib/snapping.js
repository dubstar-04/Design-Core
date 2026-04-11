
import { Point } from '../entities/point.js';
import { Colours } from './colours.js';
import { Utils } from './utils.js';

import { SnapPoint } from './snapPoint.js';
import { DesignCore } from '../designCore.js';

/** TrackingLine Class - dotted tracking line for polar/ortho snap */
class TrackingLine {
  /**
   * Create TrackingLine
   * @param {Point} inputPoint - the previous input point (defines direction)
   * @param {Point} snapPoint - the current snapped mouse point (line starts here)
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
    const from = this.snapPoint;
    const dir = this.snapPoint.subtract(this.inputPoint);
    const lineWidth = 2 / scale;

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

    // Clip the ray (from snapPoint outward, away from inputPoint) to canvas bounds
    let tMin = 0;
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

    const lineColour = DesignCore.Settings.accentcolour;
    const dashSize = 4 / scale;

    ctx.save();

    try { // HTML Canvas
      ctx.beginPath();
      ctx.strokeStyle = Colours.rgbToString(lineColour);
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([dashSize, dashSize]);
    } catch { // Cairo
      const rgbColour = Colours.rgbToScaledRGB(lineColour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      ctx.setLineWidth(lineWidth);
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
    // active is true when snapping is active (e.g. during a command)
    this.active = false;
    // snapOverride: null = use settings; SnapPoint.Type.NONE = suppress all snaps; any other type = snap only to that type
    this.snapOverride = null;
  }

  /**
   * Reset snapping state
   */
  reset() {
    this.active = false;
    this.snapOverride = null;
  }

  /**
   * Set the snap override type
   * @param {string|null} type - a SnapPoint.Type value, or null to clear the override
   */
  setSnapOverride(type) {
    if (type !== null && !Object.values(SnapPoint.Type).includes(type)) {
      throw new Error(`Invalid snap override type: ${type}`);
    }
    this.snapOverride = type;
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
   * @param {SnapPoint} snapPoint
   */
  addSnapPoint(snapPoint) {
    // show the snap point
    DesignCore.Scene.auxiliaryEntities.add(snapPoint);

    // Move the mouse to the closest snap point so if the mouse if clicked the snap point is used.
    DesignCore.Mouse.setPosFromScenePoint(snapPoint.snapPoint);
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
    const snapAperture = 25; // capture radius in pixels (screen space)
    let delta = snapAperture / DesignCore.Canvas.getScale(); // convert to scene space

    for (let i = 0; i < DesignCore.Scene.entities.count(); i++) {
      const layer = DesignCore.LayerManager.getItemByName(DesignCore.Scene.entities.get(i).layer);

      if (!layer?.isVisible) {
        continue;
      }

      const itemSnaps = DesignCore.Scene.entities.get(i).snaps(DesignCore.Mouse.pointOnScene(), delta); // get an array of snap point from the item
      if (itemSnaps) {
        const filteredSnaps = this.snapOverride !== null ? itemSnaps.filter((s) => s.type === this.snapOverride) : itemSnaps.filter((s) => DesignCore.Settings[`${s.type}snap`]);
        for (let j = 0; j < filteredSnaps.length; j++) {
          const length = filteredSnaps[j].snapPoint.distance(DesignCore.Mouse.pointOnScene());
          if (length < delta) {
            delta = length;
            snapPoint = filteredSnaps[j];
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
