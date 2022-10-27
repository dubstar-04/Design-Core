import {Point} from '../entities/point.js';

export class Matrix {
  constructor() {
    this.a = 1; // x scale
    this.b = 0; // x skew
    this.c = 0; // y skew
    this.d = -1; // y scale - inverted for y axis
    this.e = 0; // x translate
    this.f = 0; // y translate
  }

  getScale() {
    // return the x scale
    return this.a;
  }

  invert() {
    const d = 1 / (this.a * this.d - this.b * this.c);
    const invertedMatrix = new Matrix();
    invertedMatrix.a = this.d * d;
    invertedMatrix.b = -this.b * d;
    invertedMatrix.c = -this.c * d;
    invertedMatrix.d = this.a * d;
    invertedMatrix.e = d * (this.c * this.f - this.d * this.e);
    invertedMatrix.f = d * (this.b * this.e - this.a * this.f);
    return invertedMatrix;
  };

  translate(x, y) {
    this.e += this.a * x + this.c * y;
    this.f += this.b * x + this.d * y;
  };

  scale(sx, sy) {
    this.a *= sx;
    this.b *= sx;
    this.c *= sy;
    this.d *= sy;
  };

  transformPoint(px, py) {
    const tpx = px * this.a + py * this.c + this.e;
    const tpy = px * this.b + py * this.d + this.f;

    return new Point(tpx, tpy);
  }
}
