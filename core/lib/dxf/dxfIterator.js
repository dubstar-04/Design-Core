
export class DxfIterator {
  constructor() {
    this.currentIndex = 0;
    this.lines = [];

    // store a reference index
    this.referenceIndex = 0;
  }

  loadFile(file) {
    this.lines = file.split('\n');
  }

  odd() {
    const indexDelta = this.currentIndex - this.referenceIndex;
    return Boolean( indexDelta % 2 === 1);
  }

  setReferenceIndex() {
    this.referenceIndex = this.currentIndex;
  }

  getReferenceIndex() {
    return this.referenceIndex;
  }

  next() {
    if (this.currentIndex < this.lines.length - 1) {
      this.currentIndex = this.currentIndex + 1;
      return this.current();
    }

    return undefined;
  }

  current() {
    const current = this.formatted(this.lines[this.currentIndex]);
    return current;
  }

  formatted(value) {
    return value.replace(/(\r\n|\n|\r)/gm, '');
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex = this.currentIndex - 1;
      return this.current();
    }

    return undefined;
  }

  nextValue() {
    if (this.currentIndex < this.lines.length - 1) {
      const next = this.formatted(this.lines[this.currentIndex + 1]);
      return next;
    }
  }

  prevValue() {
    if (this.currentIndex > 0) {
      const previous = this.formatted(this.lines[this.currentIndex - 1]);
      return previous;
    }
  }
}
