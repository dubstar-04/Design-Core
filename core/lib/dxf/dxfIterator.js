
export class DxfIterator {
  constructor() {
    this.currentIndex = 0;
    this.lines = [];
  }

  loadFile(file) {
    this.lines = file.split('\n');
  }

  current() {
    const current = this.formatted(this.lines[this.currentIndex]);
    return current;
  }

  formatted(value) {
    return value.replace(/(\r\n|\n|\r)/gm, '');
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

  prevPair() {
    if (this.currentIndex > 2) {
      this.currentIndex = this.currentIndex - 2;
      return this.currentPair();
    }

    return;
  }

  currentPair() {
    return {code: this.current().trim(), value: this.nextValue()};
  }

  nextPair() {
    if (this.currentIndex < this.lines.length - 2) {
      this.currentIndex = this.currentIndex + 2;
      return this.currentPair();
    }

    return;
  }
}
