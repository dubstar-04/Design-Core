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
    return Number(number.toFixed(5));
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
      clone[key] = value instanceof Object && typeof value !== 'function' ? this.cloneObject(value) : value;
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
            m[i-1][j-1] + 1,
            m[i][j-1] + 1,
            m[i-1][j] + 1,
        );
      }
    }
    return m[b.length][a.length];
  };
}
