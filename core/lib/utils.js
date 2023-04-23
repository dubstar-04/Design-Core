export class Utils {
  static degrees2radians(degrees) {
    return Utils.round(degrees * Math.PI / 180);
  };

  static radians2degrees(radians) {
    return Utils.round(radians * 180 / Math.PI);
  };

  /**
   * Round to 5 decimal places
   * @param {number} number
   * @returns rounded number
   */
  static round(number) {
    return Math.round(number * 100000) / 100000;
  }


  static cloneObject(core, obj) {
    // deep clone obj and all its attributes
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    const desc = Object.getOwnPropertyDescriptors(obj);
    const clone = Object.create(Object.getPrototypeOf(obj), desc);

    for (const key of Reflect.ownKeys(obj)) {
      const value = obj[key];
      clone[key] = value instanceof Object && typeof value !== 'function' ? this.cloneObject(core, value) : value;
    }

    return clone;
  }


  /**
   * Returns a levenshtein edit distance to the input strings
   * The distance represents the minimum number of character edits required to change one string into the other.
   * a lower number suggests the strings are more similar and value of 0 means they are the same.
   * @param {string} a
   * @param {string} b
   * @returns {integer} levenshtein edit distance
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
