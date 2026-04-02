
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
    RADIUSTOOLARGE: 'Radius too large',
    INVALIDCLIPBOARD: 'Invalid Clipboard Data',
    INVALIDBOUNDARY: 'Invalid Boundary Item',
    NONZERO: 'Value must be positive and nonzero',
    MINVALUE: 'Value is too small',
    MAXVALUE: 'Value is too large',
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
    NOUNDO: 'No actions to undo',
    NOREDO: 'No actions to redo',
    NOTRIM: 'cannot be trimmed',
    NOEXTEND: 'cannot be extended',
    NOFILLET: 'cannot be filleted',
    NOCHAMFER: 'cannot be chamfered',
    NONCONSECUTIVESEGMENTS: 'segments must be consecutive',
    NOTIMPLEMENTED: 'Not Implemented',
  };

  // Strings
  static Strings = {
    ARC: 'Arc',
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
    DELTA: '\u0394',
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
    CLOSE: 'Close',
    NEXTPOINT: 'Specify next point',
    RADIUS: 'Specify radius',
    DIAMETER: 'Specify diameter',
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
