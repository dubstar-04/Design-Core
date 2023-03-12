
export class DxfIterator {
  constructor() {
    this.currentIndex = 0;
    this.lines = [];
  }

  loadFile(file) {
    this.lines = file.split('\n');
  }

  odd() {
    return Boolean( this.currentIndex % 2 === 1);
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
