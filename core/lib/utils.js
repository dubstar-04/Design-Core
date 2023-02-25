export class Utils {
  static degrees2radians(degrees) {
    return degrees * Math.PI / 180;
  };

  static radians2degrees(radians) {
    return radians * 180 / Math.PI;
  };

  static distBetweenPoints(firstPointx, firstPointy, secondPointx, secondPointy) {
    const A = (firstPointx - secondPointx);
    const B = (firstPointy - secondPointy);
    const ASQ = Math.pow(A, 2);
    const BSQ = Math.pow(B, 2);
    const dist = Math.sqrt(ASQ + BSQ);
    return dist;
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
