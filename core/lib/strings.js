
/**
 * String Class
 * Holds common strings for consistency and translation
 */
export class Strings {
  // Error Strings
  static Error = {
    ERROR: 'Error',
    FILEOPEN: 'Error Opening File',
    INPUT: 'Invalid Input',
    INVALIDFILE: 'Invalid File',
    INVALIDDXFFORMAT: 'Invalid DXF Format',
    INVALIDPOINT: 'Invalid Point Data',
    INVALIDGROUPCODE: 'Invalid DXF Groupcode',
    INVALIDNUMBER: 'Invalid Number',
    INVALIDTYPE: 'Invalid Type',
    INVALIDINTERSECTTYPE: 'Invalid Intersect Type',
    SELECTION: 'Invalid Selection',
    PARALLELLINES: 'Parallel Lines',
  };

  // Warning Strings
  static Warning = {
    WARNING: 'Warning',
    UNSUPPORTEDENTITIES: 'File contains unsupported entities',
  };

  // Message Strings
  static Message = {
    UNKNOWNCOMMAND: 'Unknown command',
    RECOMMEND: 'Did you mean',
    FILEOPEN: 'File opened',
    CSTYLEDELETE: 'Currently selected style cannot be deleted',
    CANNOTBEDELETED: 'cannot be deleted',
    CANNOTBERENAMED: 'cannot be renamed',
    CANNOTBEACTIONED: 'cannot be actioned',
    COMPLETED: 'completed',
  };

  // Strings
  static Strings = {
    LENGTH: 'Length',
    LINE: 'Line',
    VARIES: 'Varies',
    AND: 'and',
    OR: 'or',
    ITEMS: 'item(s)',
    ADDED: 'added',
    REMOVED: 'removed',
  };

  // colours
  static Colour = {
    BYLAYER: 'ByLayer',
    BYBLOCK: 'ByBlock',
  };

  // Unicode Symbols
  static Symbol = {
    DIAMETER: '\u00D8',
    DEGREE: '\u00B0',
    RADIUS: 'R',
  };

  // Input Strings
  static Input = {
    BASEPOINT: 'Specify base point',
    BOUNDARY: 'Specify boundary edges',
    CENTER: 'Specify centre point',
    START: 'Specify start point',
    END: 'Specify end point',
    POINT: 'Specify a point',
    DIMENSION: 'Specify dimension position',
    NEXTPOINT: 'Specify next point',
    RADIUS: 'Specify radius',
    POSITION: 'Specify position',
    HEIGHT: 'Specify height',
    STRING: 'Specify text',
    NAME: 'Specify name',
    OPTION: 'Specify option',
    ANGLE: 'Specify angle',
    ROTATION: 'Specify rotation angle',
    DESTINATION: 'Specify destination',
    SELECT: 'Select object',
    SELECTIONSET: 'Select Items',
    SOURCE: 'Select source object',
    DESTINATIONSET: 'Select destination object(s)',
  };
};
