
import { Point } from '../entities/point.js';
import { Utils } from './utils.js';

import { SnapPoint } from './auxiliary/snapPoint.js';
import { TrackingLine } from './auxiliary/trackingLine.js';
import { DesignCore } from '../designCore.js';
import { Property } from '../properties/property.js';

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
      const layer = DesignCore.LayerManager.getItemByName(DesignCore.Scene.entities.get(i).getProperty(Property.Names.LAYER));

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
