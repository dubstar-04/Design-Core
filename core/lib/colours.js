export class Colours {
  /**
   * Convert an AutoCAD colour index (ACI) to a hex colour
   * @param  {Number} acadColour
   */
  static getHexColour(acadColour) {
    return this.conversion_table[acadColour];
  };

  /**
   * Convert a hex colour to an AutoCAD colour index (ACI)
   * @param  {String} hexColour
   */
  static getACADColour(hexColour) {
    for (const acadColour in this.conversion_table) {
      if (this.conversion_table[acadColour] === hexColour) {
        return acadColour;
      }
    }
  };

  /**
   * Get hex component from r, g or b value
   * @param  {Number} c
   */
  static componentToHex(c) {
    const hex = Math.abs(c).toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  }

  /**
   * Get hex colour from RGB
   * @param  {Number} r - red value
   * @param  {Number} g - green value
   * @param  {Number} b - blue value
   */
  static rgbToHex(r, g, b) {
    return '#' + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }

  /**
   *  Get RGB colour components from hex colour
   * @param  {String} hexColour
   */
  static hexToRGB(hexColour) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColour);

    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }

    return null;
  }

  /**
   *  Get RGB colour components scaled 0 - 1 from hex colour
   * @param  {String} hexColour
   */
  static hexToScaledRGB(hexColour) {
    const rgb = this.hexToRGB(hexColour);

    if (rgb) {
      return {
        r: rgb.r / 255,
        g: rgb.g / 255,
        b: rgb.b / 255,
      };
    }

    return null;
  }

  static conversion_table = {
    // Map the 256 AutoCAD colours to the equivalent hex colour
    0: 'BYBLOCK',
    1: '#FF0000',
    2: '#FFFF00',
    3: '#00FF00',
    4: '#00FFFF',
    5: '#0000FF',
    6: '#FF00FF',
    7: '#FFFFFF',
    8: '#808080',
    9: '#C0C0C0',
    10: '#FF0000',
    11: '#FF7F7F',
    12: '#CC0000',
    13: '#CC6666',
    14: '#990000',
    15: '#994C4C',
    16: '#7F0000',
    17: '#7F3F3F',
    18: '#4C0000',
    19: '#4C2626',
    20: '#FF3F00',
    21: '#FF9F7F',
    22: '#CC3300',
    23: '#CC7F66',
    24: '#992600',
    25: '#995F4C',
    26: '#7F1F00',
    27: '#7F4F3F',
    28: '#4C1300',
    29: '#4C2F26',
    30: '#FF7F00',
    31: '#FFBF7F',
    32: '#CC6600',
    33: '#CC9966',
    34: '#994C00',
    35: '#99724C',
    36: '#7F3F00',
    37: '#7F5F3F',
    38: '#4C2600',
    39: '#4C3926',
    40: '#FFBF00',
    41: '#FFDF7F',
    42: '#CC9900',
    43: '#CCB266',
    44: '#997200',
    45: '#99854C',
    46: '#7F5F00',
    47: '#7F6F3F',
    48: '#4C3900',
    49: '#4C4226',
    50: '#FFFF00',
    51: '#FFFF7F',
    52: '#CCCC00',
    53: '#CCCC66',
    54: '#999900',
    55: '#99994C',
    56: '#7F7F00',
    57: '#7F7F3F',
    58: '#4C4C00',
    59: '#4C4C26',
    60: '#BFFF00',
    61: '#DFFF7F',
    62: '#99CC00',
    63: '#B2CC66',
    64: '#729900',
    65: '#85994C',
    66: '#5F7F00',
    67: '#6F7F3F',
    68: '#394C00',
    69: '#424C26',
    70: '#7FFF00',
    71: '#BFFF7F',
    72: '#66CC00',
    73: '#99CC66',
    74: '#4C9900',
    75: '#72994C',
    76: '#3F7F00',
    77: '#5F7F3F',
    78: '#264C00',
    79: '#394C26',
    80: '#3FFF00',
    81: '#9FFF7F',
    82: '#33CC00',
    83: '#7FCC66',
    84: '#269900',
    85: '#5F994C',
    86: '#1F7F00',
    87: '#4F7F3F',
    88: '#134C00',
    89: '#2F4C26',
    90: '#00FF00',
    91: '#7FFF7F',
    92: '#00CC00',
    93: '#66CC66',
    94: '#009900',
    95: '#4C994C',
    96: '#007F00',
    97: '#3F7F3F',
    98: '#004C00',
    99: '#264C26',
    100: '#00FF3F',
    101: '#7FFF9F',
    102: '#00CC33',
    103: '#66CC7F',
    104: '#009926',
    105: '#4C995F',
    106: '#007F1F',
    107: '#3F7F4F',
    108: '#004C13',
    109: '#264C2F',
    110: '#00FF7F',
    111: '#7FFFBF',
    112: '#00CC66',
    113: '#66CC99',
    114: '#00994C',
    115: '#4C9972',
    116: '#007F3F',
    117: '#3F7F5F',
    118: '#004C26',
    119: '#264C39',
    120: '#00FFBF',
    121: '#7FFFDF',
    122: '#00CC99',
    123: '#66CCB2',
    124: '#009972',
    125: '#4C9985',
    126: '#007F5F',
    127: '#3F7F6F',
    128: '#004C39',
    129: '#264C42',
    130: '#00FFFF',
    131: '#7FFFFF',
    132: '#00CCCC',
    133: '#66CCCC',
    134: '#009999',
    135: '#4C9999',
    136: '#007F7F',
    137: '#3F7F7F',
    138: '#004C4C',
    139: '#264C4C',
    140: '#00BFFF',
    141: '#7FDFFF',
    142: '#0099CC',
    143: '#66B2CC',
    144: '#007299',
    145: '#4C8599',
    146: '#005F7F',
    147: '#3F6F7F',
    148: '#00394C',
    149: '#26424C',
    150: '#007FFF',
    151: '#7FBFFF',
    152: '#0066CC',
    153: '#6699CC',
    154: '#004C99',
    155: '#4C7299',
    156: '#003F7F',
    157: '#3F5F7F',
    158: '#00264C',
    159: '#26394C',
    160: '#003FFF',
    161: '#7F9FFF',
    162: '#0033CC',
    163: '#667FCC',
    164: '#002699',
    165: '#4C5F99',
    166: '#001F7F',
    167: '#3F4F7F',
    168: '#00134C',
    169: '#262F4C',
    170: '#0000FF',
    171: '#7F7FFF',
    172: '#0000CC',
    173: '#6666CC',
    174: '#000099',
    175: '#4C4C99',
    176: '#00007F',
    177: '#3F3F7F',
    178: '#00004C',
    179: '#26264C',
    180: '#3F00FF',
    181: '#9F7FFF',
    182: '#3300CC',
    183: '#7F66CC',
    184: '#260099',
    185: '#5F4C99',
    186: '#1F007F',
    187: '#4F3F7F',
    188: '#13004C',
    189: '#2F264C',
    190: '#7F00FF',
    191: '#BF7FFF',
    192: '#6600CC',
    193: '#9966CC',
    194: '#4C0099',
    195: '#724C99',
    196: '#3F007F',
    197: '#5F3F7F',
    198: '#26004C',
    199: '#39264C',
    200: '#BF00FF',
    201: '#DF7FFF',
    202: '#9900CC',
    203: '#B266CC',
    204: '#720099',
    205: '#854C99',
    206: '#5F007F',
    207: '#6F3F7F',
    208: '#39004C',
    209: '#42264C',
    210: '#FF00FF',
    211: '#FF7FFF',
    212: '#CC00CC',
    213: '#CC66CC',
    214: '#990099',
    215: '#994C99',
    216: '#7F007F',
    217: '#7F3F7F',
    218: '#4C004C',
    219: '#4C264C',
    220: '#FF00BF',
    221: '#FF7FDF',
    222: '#CC0099',
    223: '#CC66B2',
    224: '#990072',
    225: '#994C85',
    226: '#7F005F',
    227: '#7F3F6F',
    228: '#4C0039',
    229: '#4C2642',
    230: '#FF007F',
    231: '#FF7FBF',
    232: '#CC0066',
    233: '#CC6699',
    234: '#99004C',
    235: '#994C72',
    236: '#7F003F',
    237: '#7F3F5F',
    238: '#4C0026',
    239: '#4C2639',
    240: '#FF003F',
    241: '#FF7F9F',
    242: '#CC0033',
    243: '#CC667F',
    244: '#990026',
    245: '#994C5F',
    246: '#7F001F',
    247: '#7F3F4F',
    248: '#4C0013',
    249: '#4C262F',
    250: '#333333',
    251: '#5B5B5B',
    252: '#848484',
    253: '#ADADAD',
    254: '#D6D6D6',
    255: '#FFFFFF',
    256: 'BYLAYER', // '#000000'
  };
}
