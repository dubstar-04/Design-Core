
import { Logging } from './logging.js';

/**
 * Colours is a static class to support colour managements
 * All colours are stored as RGB {r:, g:, b:} objects
 * When importing dxf colour are converted to RGB
 * ACI (AutoCAD colour index) from groupcode 62
 * True Colour from groupcode 420
 *
 */
export class Colours {
  /**
   * Check rgb is a valid rgb object
   * @param {Object} rgb
   * @return {boolean} true if the object is an rgb colour, otherwise false.
   */
  static isRGB(rgb) {
    if (rgb) {
      if (rgb.hasOwnProperty('r') && rgb.r >= 0 && rgb.r <= 255) {
        if (rgb.hasOwnProperty('g') && rgb.g >= 0 && rgb.g <= 255) {
          if (rgb.hasOwnProperty('b') && rgb.b >= 0 && rgb.b <= 255) {
            return true;
          }
        }
      }
    }

    Logging.instance.error('Invalid RGB value');
    return false;
  }

  /**
   * Convert an AutoCAD colour index (ACI) to a rgb colour
   * @param  {number} aci
   * @return {number}
   */
  static aciToRGB(aci) {
    if ((typeof aci === 'number' || aci instanceof Number)) {
      if (aci >= 0 && aci <= 256) {
        return this.rgb_conversion_table[aci];
      }
    }

    Logging.instance.warn('Invalid ACI value');
    return;
  };

  /**
   * Convert a rgb colour to an AutoCAD colour index (ACI)
   * @param {Object} rgb
   * @return {number}
   */
  static rgbToACI(rgb) {
    if (!this.isRGB(rgb)) {
      // not an rgb colour
      return;
    }
    for (const aci in this.rgb_conversion_table) {
      if (this.rgb_conversion_table[aci].r === rgb.r) {
        if (this.rgb_conversion_table[aci].g === rgb.g) {
          if (this.rgb_conversion_table[aci].b === rgb.b) {
            // return matching aci
            return Number(aci);
          }
        }
      }
    }

    // no aci match
    return;
  }

  /**
   * Convert rgb colour to formatted string
   * @param {Object} rgb
   * @return {number}
   */
  static rgbToString(rgb) {
    if (this.isRGB(rgb)) {
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    return;
  }

  /**
   * Get RGB colour components scaled 0 - 1 from rgb colour
   * @param  {Object} rgb - object with r, g, and b values
   * @return {number} scaled rgb object or undefined
   */
  static rgbToScaledRGB(rgb) {
    if (this.isRGB(rgb)) {
      return {
        r: rgb.r / 255,
        g: rgb.g / 255,
        b: rgb.b / 255,
      };
    }

    return;
  }

  /**
   *  Get RGB colour components from true colour
   * @param  {string} trueColour
   * A 32-bit integer representing a 24-bit color value.
   * The high-order byte (8 bits) is 0, the low-order byte an unsigned char holding the Blue value (0-255),
   * then the Green value, and the next-to-high order byte is the Red Value.
   * Converting this integer value to hexadecimal yields the following bit mask: 0x00RRGGBB.
   * For example:
   * true color with Red==200, Green==100 and Blue==50 is 0x00C86432, and in DXF, in decimal, 13132850
   * @return {number}
   */
  static trueColourToRGB(trueColour) {
    if (trueColour) {
      return {
        r: (trueColour & 0xff0000) >> 16,
        g: (trueColour & 0x00ff00) >> 8,
        b: (trueColour & 0x0000ff),
      };
    }
    return;
  }

  /**
   * Get the trueColour value for rgb colour
   * @param {Object} rgb
   * @return {number} representing the rgb value as a trueColor
   */
  static rgbToTrueColour(rgb) {
    if (this.isRGB(rgb)) {
      const trueColour = ((rgb.r << 16) | ((rgb.g << 8) | (rgb.b)));
      return trueColour;
    }

    return;
  }

  /**
   * Map the 256 AutoCAD colours to the equivalent rgb colour
   */
  static rgb_conversion_table = {

    0: { r: 0, g: 0, b: 0 }, // ByBlock
    1: { r: 255, g: 0, b: 0 },
    2: { r: 255, g: 255, b: 0 },
    3: { r: 0, g: 255, b: 0 },
    4: { r: 0, g: 255, b: 255 },
    5: { r: 0, g: 0, b: 255 },
    6: { r: 255, g: 0, b: 255 },
    7: { r: 254, g: 254, b: 254 }, // changes colour based on background colour (use {254, 254, 254} to avoid duplicate with ACI 255)
    8: { r: 128, g: 128, b: 128 },
    9: { r: 192, g: 192, b: 129 },
    10: { r: 254, g: 0, b: 0 }, // {use {254, 0, 0} to avoid duplicate with ACI 1}
    11: { r: 255, g: 127, b: 127 },
    12: { r: 204, g: 0, b: 0 },
    13: { r: 204, g: 102, b: 102 },
    14: { r: 138, g: 0, b: 0 },
    15: { r: 138, g: 76, b: 76 },
    16: { r: 127, g: 0, b: 0 },
    17: { r: 127, g: 63, b: 63 },
    18: { r: 76, g: 0, b: 0 },
    19: { r: 76, g: 38, b: 38 },
    20: { r: 255, g: 63, b: 0 },
    21: { r: 255, g: 159, b: 127 },
    22: { r: 204, g: 51, b: 0 },
    23: { r: 204, g: 127, b: 102 },
    24: { r: 153, g: 38, b: 0 },
    25: { r: 153, g: 95, b: 76 },
    26: { r: 127, g: 31, b: 0 },
    27: { r: 127, g: 79, b: 63 },
    28: { r: 76, g: 19, b: 0 },
    29: { r: 76, g: 47, b: 38 },
    30: { r: 255, g: 127, b: 0 },
    31: { r: 255, g: 191, b: 127 },
    32: { r: 204, g: 94, b: 0 },
    33: { r: 204, g: 157, b: 102 },
    34: { r: 153, g: 76, b: 0 },
    35: { r: 153, g: 114, b: 76 },
    36: { r: 127, g: 63, b: 0 },
    37: { r: 127, g: 95, b: 63 },
    38: { r: 76, g: 38, b: 0 },
    39: { r: 76, g: 57, b: 38 },
    40: { r: 255, g: 191, b: 0 },
    41: { r: 255, g: 223, b: 127 },
    42: { r: 204, g: 127, b: 0 },
    43: { r: 204, g: 173, b: 102 },
    44: { r: 153, g: 114, b: 0 },
    45: { r: 153, g: 133, b: 76 },
    46: { r: 127, g: 95, b: 0 },
    47: { r: 127, g: 111, b: 63 },
    48: { r: 76, g: 57, b: 0 },
    49: { r: 76, g: 66, b: 38 },
    50: { r: 254, g: 254, b: 0 }, // {use {254, 254, 0} to avoid duplicate with ACI 2}
    51: { r: 255, g: 255, b: 127 },
    52: { r: 204, g: 204, b: 0 },
    53: { r: 204, g: 204, b: 102 },
    54: { r: 153, g: 153, b: 0 },
    55: { r: 153, g: 153, b: 76 },
    56: { r: 127, g: 127, b: 0 },
    57: { r: 127, g: 127, b: 63 },
    58: { r: 76, g: 76, b: 0 },
    59: { r: 76, g: 76, b: 38 },
    60: { r: 191, g: 255, b: 0 },
    61: { r: 223, g: 255, b: 127 },
    62: { r: 127, g: 204, b: 0 },
    63: { r: 173, g: 204, b: 102 },
    64: { r: 114, g: 153, b: 0 },
    65: { r: 133, g: 153, b: 76 },
    66: { r: 95, g: 127, b: 0 },
    67: { r: 111, g: 127, b: 63 },
    68: { r: 57, g: 76, b: 0 },
    69: { r: 66, g: 76, b: 38 },
    70: { r: 127, g: 255, b: 0 },
    71: { r: 191, g: 255, b: 127 },
    72: { r: 94, g: 204, b: 0 },
    73: { r: 157, g: 204, b: 102 },
    74: { r: 76, g: 153, b: 0 },
    75: { r: 114, g: 153, b: 76 },
    76: { r: 63, g: 127, b: 0 },
    77: { r: 95, g: 127, b: 63 },
    78: { r: 38, g: 76, b: 0 },
    79: { r: 57, g: 76, b: 38 },
    80: { r: 63, g: 255, b: 0 },
    81: { r: 159, g: 255, b: 127 },
    82: { r: 51, g: 204, b: 0 },
    83: { r: 127, g: 204, b: 102 },
    84: { r: 38, g: 153, b: 0 },
    85: { r: 95, g: 153, b: 76 },
    86: { r: 31, g: 127, b: 0 },
    87: { r: 79, g: 127, b: 63 },
    88: { r: 19, g: 76, b: 0 },
    89: { r: 47, g: 76, b: 38 },
    90: { r: 0, g: 254, b: 0 }, // {use {0, 254, 0} to avoid duplicate with ACI 3}
    91: { r: 127, g: 255, b: 127 },
    92: { r: 0, g: 204, b: 0 },
    93: { r: 102, g: 204, b: 102 },
    94: { r: 0, g: 153, b: 0 },
    95: { r: 76, g: 153, b: 76 },
    96: { r: 0, g: 127, b: 0 },
    97: { r: 63, g: 127, b: 63 },
    98: { r: 0, g: 76, b: 0 },
    99: { r: 38, g: 76, b: 38 },
    100: { r: 0, g: 255, b: 63 },
    101: { r: 127, g: 255, b: 159 },
    102: { r: 0, g: 204, b: 51 },
    103: { r: 102, g: 204, b: 127 },
    104: { r: 0, g: 153, b: 38 },
    105: { r: 76, g: 153, b: 95 },
    106: { r: 0, g: 127, b: 31 },
    107: { r: 63, g: 127, b: 79 },
    108: { r: 0, g: 76, b: 19 },
    109: { r: 38, g: 76, b: 47 },
    110: { r: 0, g: 255, b: 127 },
    111: { r: 127, g: 255, b: 191 },
    112: { r: 0, g: 204, b: 94 },
    113: { r: 102, g: 204, b: 157 },
    114: { r: 0, g: 153, b: 76 },
    115: { r: 76, g: 153, b: 114 },
    116: { r: 0, g: 127, b: 63 },
    117: { r: 63, g: 127, b: 95 },
    118: { r: 0, g: 76, b: 38 },
    119: { r: 38, g: 76, b: 57 },
    120: { r: 0, g: 255, b: 191 },
    121: { r: 127, g: 255, b: 223 },
    122: { r: 0, g: 204, b: 127 },
    123: { r: 102, g: 204, b: 173 },
    124: { r: 0, g: 153, b: 114 },
    125: { r: 76, g: 153, b: 133 },
    126: { r: 0, g: 127, b: 95 },
    127: { r: 63, g: 127, b: 111 },
    128: { r: 0, g: 76, b: 57 },
    129: { r: 38, g: 76, b: 66 },
    130: { r: 0, g: 254, b: 254 }, // {use {0, 254, 254} to avoid duplicate with ACI 4}
    131: { r: 127, g: 255, b: 255 },
    132: { r: 0, g: 204, b: 204 },
    133: { r: 102, g: 204, b: 204 },
    134: { r: 0, g: 153, b: 153 },
    135: { r: 76, g: 153, b: 153 },
    136: { r: 0, g: 127, b: 127 },
    137: { r: 63, g: 127, b: 127 },
    138: { r: 0, g: 76, b: 76 },
    139: { r: 38, g: 76, b: 76 },
    140: { r: 0, g: 191, b: 255 },
    141: { r: 127, g: 223, b: 255 },
    142: { r: 0, g: 127, b: 204 },
    143: { r: 102, g: 173, b: 204 },
    144: { r: 0, g: 114, b: 153 },
    145: { r: 76, g: 133, b: 153 },
    146: { r: 0, g: 95, b: 127 },
    147: { r: 63, g: 111, b: 127 },
    148: { r: 0, g: 57, b: 76 },
    149: { r: 38, g: 66, b: 76 },
    150: { r: 0, g: 127, b: 255 },
    151: { r: 127, g: 191, b: 255 },
    152: { r: 0, g: 94, b: 204 },
    153: { r: 102, g: 157, b: 204 },
    154: { r: 0, g: 76, b: 153 },
    155: { r: 76, g: 114, b: 153 },
    156: { r: 0, g: 63, b: 127 },
    157: { r: 63, g: 76, b: 127 },
    158: { r: 0, g: 38, b: 76 },
    159: { r: 38, g: 57, b: 76 },
    160: { r: 0, g: 63, b: 255 },
    161: { r: 127, g: 159, b: 255 },
    162: { r: 0, g: 51, b: 204 },
    163: { r: 102, g: 127, b: 204 },
    164: { r: 0, g: 38, b: 153 },
    165: { r: 76, g: 95, b: 153 },
    166: { r: 0, g: 31, b: 127 },
    167: { r: 63, g: 79, b: 127 },
    168: { r: 0, g: 19, b: 76 },
    169: { r: 38, g: 47, b: 76 },
    170: { r: 0, g: 0, b: 254 }, // {use {0, 0, 254} to avoid duplicate with ACI 5}
    171: { r: 127, g: 127, b: 255 },
    172: { r: 0, g: 0, b: 204 },
    173: { r: 102, g: 102, b: 204 },
    174: { r: 0, g: 0, b: 153 },
    175: { r: 76, g: 76, b: 153 },
    176: { r: 0, g: 0, b: 127 },
    177: { r: 63, g: 63, b: 127 },
    178: { r: 0, g: 0, b: 76 },
    179: { r: 38, g: 38, b: 76 },
    180: { r: 63, g: 0, b: 255 },
    181: { r: 159, g: 127, b: 255 },
    182: { r: 51, g: 0, b: 204 },
    183: { r: 127, g: 102, b: 204 },
    184: { r: 38, g: 0, b: 153 },
    185: { r: 95, g: 76, b: 153 },
    186: { r: 31, g: 0, b: 127 },
    187: { r: 79, g: 63, b: 127 },
    188: { r: 19, g: 0, b: 76 },
    189: { r: 59, g: 38, b: 76 },
    190: { r: 127, g: 0, b: 255 },
    191: { r: 191, g: 127, b: 255 },
    192: { r: 94, g: 0, b: 204 },
    193: { r: 157, g: 102, b: 204 },
    194: { r: 76, g: 0, b: 153 },
    195: { r: 114, g: 76, b: 153 },
    196: { r: 63, g: 0, b: 127 },
    197: { r: 95, g: 63, b: 127 },
    198: { r: 38, g: 0, b: 76 },
    199: { r: 57, g: 38, b: 76 },
    200: { r: 191, g: 0, b: 255 },
    201: { r: 223, g: 127, b: 255 },
    202: { r: 127, g: 0, b: 204 },
    203: { r: 173, g: 102, b: 204 },
    204: { r: 114, g: 0, b: 153 },
    205: { r: 118, g: 86, b: 153 },
    206: { r: 95, g: 0, b: 127 },
    207: { r: 111, g: 63, b: 127 },
    208: { r: 57, g: 0, b: 76 },
    209: { r: 66, g: 38, b: 76 },
    210: { r: 254, g: 0, b: 254 }, // {use {254, 0, 254} to avoid duplicate with ACI 6}
    211: { r: 255, g: 127, b: 255 },
    212: { r: 204, g: 0, b: 204 },
    213: { r: 204, g: 102, b: 204 },
    214: { r: 153, g: 0, b: 153 },
    215: { r: 153, g: 76, b: 153 },
    216: { r: 127, g: 0, b: 127 },
    217: { r: 127, g: 63, b: 127 },
    218: { r: 76, g: 0, b: 76 },
    219: { r: 76, g: 38, b: 76 },
    220: { r: 255, g: 0, b: 191 },
    221: { r: 255, g: 127, b: 223 },
    222: { r: 204, g: 0, b: 127 },
    223: { r: 204, g: 102, b: 173 },
    224: { r: 153, g: 0, b: 114 },
    225: { r: 153, g: 76, b: 133 },
    226: { r: 127, g: 0, b: 95 },
    227: { r: 127, g: 63, b: 111 },
    228: { r: 76, g: 0, b: 57 },
    229: { r: 76, g: 38, b: 66 },
    230: { r: 255, g: 0, b: 127 },
    231: { r: 255, g: 127, b: 191 },
    232: { r: 204, g: 0, b: 94 },
    233: { r: 204, g: 102, b: 157 },
    234: { r: 153, g: 0, b: 76 },
    235: { r: 153, g: 76, b: 114 },
    236: { r: 127, g: 0, b: 63 },
    237: { r: 127, g: 63, b: 95 },
    238: { r: 76, g: 0, b: 38 },
    239: { r: 76, g: 38, b: 57 },
    240: { r: 255, g: 0, b: 63 },
    241: { r: 255, g: 127, b: 159 },
    242: { r: 204, g: 0, b: 51 },
    243: { r: 204, g: 102, b: 127 },
    244: { r: 153, g: 0, b: 38 },
    245: { r: 153, g: 76, b: 95 },
    246: { r: 127, g: 0, b: 31 },
    247: { r: 127, g: 63, b: 79 },
    248: { r: 76, g: 0, b: 19 },
    249: { r: 76, g: 38, b: 47 },
    250: { r: 51, g: 51, b: 51 },
    251: { r: 91, g: 91, b: 91 },
    252: { r: 132, g: 132, b: 132 },
    253: { r: 173, g: 173, b: 173 },
    254: { r: 214, g: 214, b: 214 },
    255: { r: 255, g: 255, b: 255 },
    256: { r: 1, g: 1, b: 1 }, // ByLayer (Adjusted to {1, 1, 1} to be unique)
  };
}
