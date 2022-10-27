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
}
