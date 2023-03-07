export class Section {
  constructor() {

  }

  parseBoolean(value) {
    const _value = value.trim();

    if (_value === '0') {
      return false;
    }
    if (_value === '1') {
      return true;
    }

    throw Error(`${value} not a valid Boolean`);
  }

  getGroupValue(_code, value) {
    const code = parseInt(_code);
    // 0-9: String
    if (code <= 9) return value;
    // 10-39: Double precision 3D point value
    // 40-59: Double precision floating-point value
    if (code >= 10 && code <= 59) return parseFloat(value);
    // 60-79: 16-bit integer value
    // 90-99: 32-bit integer value
    if (code >= 60 && code <= 99) return parseInt(value);
    // 100: String (255-character maximum; less for Unicode strings)
    // 102: String (255-character maximum; less for Unicode strings)
    // 105: String representing hexadecimal (hex) handle value
    if (code >= 100 && code <= 109) return value;
    // 110-119: Double precision floating-point value
    // 120-129: Double precision floating-point value
    // 130-139: Double precision floating-point value
    // 140-149: Double precision scalar floating-point value
    if (code >= 110 && code <= 149) return parseFloat(value);
    // 160-169: 64-bit integer value
    // 170-179: 16-bit integer value
    if (code >= 160 && code <= 179) return parseInt(value);
    // 210-239: Double-precision floating-point value
    if (code >= 210 && code <= 239) return parseFloat(value);
    // 270-279: 16-bit integer value
    // 280-289: 16-bit integer value
    if (code >= 270 && code <= 289) return parseInt(value);
    // 290-299: Boolean flag value
    if (code >= 290 && code <= 299) return this.parseBoolean(value);
    // 300-309: Arbitrary text string
    // 330-369: String representing hex object IDs
    if (code >= 300 && code <= 369) return value;
    // 370-379: 16-bit integer value
    // 380-389: 16-bit integer value
    if (code >= 370 && code <= 389) return parseInt(value);
    // 390-399: String representing hex handle value
    if (code >= 390 && code <= 399) return value;
    // 400-409: 16-bit integer value
    if (code >= 400 && code <= 409) return parseInt(value);
    // 410-419: String
    if (code >= 410 && code <= 419) return value;
    // 420-429: 32-bit integer value
    if (code >= 420 && code <= 429) return parseInt(value);
    // 430-439: String
    if (code >= 430 && code <= 439) return value;
    // 440-449: 32-bit integer value
    // 450-459: Long
    if (code >= 440 && code <= 459) return parseInt(value);
    // 460-469: Double-precision floating-point value
    if (code >= 460 && code <= 469) return parseFloat(value);
    // 470-479: String
    // 480-481: String representing hex handle value
    if (code >= 470 && code <= 481) return value;
    // 999: Comment (string)
    if (code === 999) return value;
    // 1000-1009: String (same limits as indicated with 0-9 code range)
    if (code >= 1000 && code <= 1009) return value;
    // 1010-1059: Double-precision floating-point value
    if (code >= 1010 && code <= 1059) return parseFloat(value);
    // 1060-1070: 16-bit integer value
    // 1071: 32-bit: integer value
    if (code >= 1060 && code <= 1071) return parseInt(value);

    // Unknown Group code
    return value;
  }
}
