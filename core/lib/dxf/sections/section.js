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
    let returnValue = value;
    switch (true) {
      // 0-9: String
      case (code <= 9):
        returnValue = value;
        break;
      // 10-39: Double precision 3D point value
      // 40-59: Double precision floating-point value
      case (code >= 10 && code <= 59):
        returnValue = parseFloat(value);
        break;
      // 60-79: 16-bit integer value
      // 90-99: 32-bit integer value
      case (code >= 60 && code <= 99):
        returnValue = parseInt(value);
        break;
      // 100: String (255-character maximum; less for Unicode strings)
      // 102: String (255-character maximum; less for Unicode strings)
      // 105: String representing hexadecimal (hex) handle value
      case (code >= 100 && code <= 109):
        returnValue = value;
        break;
      // 110-119: Double precision floating-point value
      // 120-129: Double precision floating-point value
      // 130-139: Double precision floating-point value
      // 140-149: Double precision scalar floating-point value
      case (code >= 110 && code <= 149):
        returnValue = parseFloat(value);
        break;
      // 160-169: 64-bit integer value
      // 170-179: 16-bit integer value
      case (code >= 160 && code <= 179):
        returnValue = parseInt(value);
        break;
      // 210-239: Double-precision floating-point value
      case (code >= 210 && code <= 239):
        returnValue = parseFloat(value);
        break;
      // 270-279: 16-bit integer value
      // 280-289: 16-bit integer value
      case (code >= 270 && code <= 289):
        returnValue = parseInt(value);
        break;
      // 290-299: Boolean flag value
      case (code >= 290 && code <= 299):
        returnValue = this.parseBoolean(value);
        break;
      // 300-309: Arbitrary text string
      // 330-369: String representing hex object IDs
      case (code >= 300 && code <= 369):
        returnValue = value;
        break;
      // 370-379: 16-bit integer value
      // 380-389: 16-bit integer value
      case (code >= 370 && code <= 389):
        returnValue = parseInt(value);
        break;
      // 390-399: String representing hex handle value
      case (code >= 390 && code <= 399):
        returnValue = value;
        break;
      // 400-409: 16-bit integer value
      case (code >= 400 && code <= 409):
        returnValue = parseInt(value);
        break;
      // 410-419: String
      case (code >= 410 && code <= 419):
        returnValue = value;
        break;
      // 420-429: 32-bit integer value
      case (code >= 420 && code <= 429):
        returnValue = parseInt(value);
        break;
      // 430-439: String
      case (code >= 430 && code <= 439):
        returnValue = value;
        break;
      // 440-449: 32-bit integer value
      // 450-459: Long
      case (code >= 440 && code <= 459):
        returnValue = parseInt(value);
        break;
      // 460-469: Double-precision floating-point value
      case (code >= 460 && code <= 469):
        returnValue = parseFloat(value);
        break;
      // 470-479: String
      // 480-481: String representing hex handle value
      case (code >= 470 && code <= 481):
        returnValue = value;
        break;
      // 999: Comment (string)
      case (code === 999):
        returnValue = value;
        break;
      // 1000-1009: String (same limits as indicated with 0-9 code range)
      case (code >= 1000 && code <= 1009):
        returnValue = value;
        break;
      // 1010-1059: Double-precision floating-point value
      case (code >= 1010 && code <= 1059):
        returnValue = parseFloat(value);
        break;
      // 1060-1070: 16-bit integer value
      // 1071: 32-bit: integer value
      case (code >= 1060 && code <= 1071):
        returnValue = parseInt(value);
        break;
      default:
      // unknown group code
        break;
    }

    return returnValue;
  }
}
