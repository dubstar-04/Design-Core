
import { Logging } from './logging.js';
import { Arc } from '../entities/arc.js';

/** Utils Class */
export class Utils {
  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @return {number} angle in radians
   */
  static degrees2radians(degrees) {
    return degrees * Math.PI / 180;
  };

  /**
   * Convert radians to degrees
   * @param {number} radians
   * @return {number} angle in degrees
   */
  static radians2degrees(radians) {
    return radians * 180 / Math.PI;
  };

  /**
   * Round to 5 decimal places
   * @param {number} number
   * @return {number} rounded number
   */
  static round(number) {
    return Number(Number(number).toFixed(5));
  }

  /**
   * Sort points by distance to reference point
   * note this mutates the points array
   * @param {Array} points
   * @param {Point} refPoint
   */
  static sortPointsByDistance(points, refPoint) {
    points.sort((a, b) => {
      const da = (a.x - refPoint.x) ** 2 + (a.y - refPoint.y) ** 2;
      const db = (b.x - refPoint.x) ** 2 + (b.y - refPoint.y) ** 2;
      return da - db; // nearest first
    });
  }

  /**
   * Sort points around an arc center by angular position.
   * Mutates the points array.
   *
   * @param {Array} points - array of points
   * @param {Arc} arc - arc
   *
   */
  static sortPointsOnArc(points, arc) {
    if (!Array.isArray(points)) return;

    if (!(arc instanceof Arc)) {
      Logging.instance.warn('Utils.sortPointsOnArc - arc parameter is not an Arc instance');
      return;
    }

    const center = arc.points[0];
    const startAngle = arc.direction > 0 ? arc.startAngle() : arc.endAngle();
    const twoPi = Math.PI * 2;
    const normalize = (ang) => ((ang % twoPi) + twoPi) % twoPi;

    // map points to angles
    const mapped = points.map((point) => {
      const angle = Math.atan2(point.y - center.y, point.x - center.x);
      const normalizedAngle = normalize(angle - startAngle);
      return { point, normalizedAngle };
    });

    // sort by angle
    mapped.sort((u, v) => u.normalizedAngle - v.normalizedAngle);

    // direction: - ccw > 0, cw <= 0
    if (arc.direction <= 0) mapped.reverse();

    // write back into original array (preserve Point instances)
    for (let i = 0; i < mapped.length; i++) {
      points[i] = mapped[i].point;
    }
  }

  /**
   * Deep clone object
   * @param {Object} obj - object to clone
   * @return {Object} - new cloned object
   */
  static cloneObject(obj) {
    // deep clone obj and all its attributes

    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    const desc = Object.getOwnPropertyDescriptors(obj);
    const clone = Object.create(Object.getPrototypeOf(obj), desc);

    for (const key of Reflect.ownKeys(obj)) {
      const value = obj[key];
      try {
        if (Array.isArray(value)) {
          clone[key] = value.map((v) => this.cloneObject(v));
        } else if (value && typeof value === 'object' && typeof value !== 'function') {
          clone[key] = this.cloneObject(value);
        } else {
          clone[key] = value;
        }
      } catch (e) {
        const err = 'Utils.cloneObject - Could not clone property';
        Logging.instance.warn(`${err}:${key} - ${e}`);
      }
    }

    return clone;
  }

  /**
   * Returns a levenshtein edit distance to the input strings
   * The distance represents the minimum number of character edits required to change one string into the other.
   * a lower number suggests the strings are more similar and value of 0 means they are the same.
   * @param {string} a
   * @param {string} b
   * @return {number} levenshtein edit distance
   * inspired by https://gist.github.com/andrei-m/982927
   */
  static getLevenshteinDistance(a, b) {
    if (!a || !b) return (a || b).length;
    const m = [];
    for (let i = 0; i <= b.length; i++) {
      m[i] = [i];
      if (i === 0) continue;
      for (let j = 0; j <= a.length; j++) {
        m[0][j] = j;
        if (j === 0) continue;
        m[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? m[i - 1][j - 1] : Math.min(
            m[i - 1][j - 1] + 1,
            m[i][j - 1] + 1,
            m[i - 1][j] + 1,
        );
      }
    }
    return m[b.length][a.length];
  };
}
