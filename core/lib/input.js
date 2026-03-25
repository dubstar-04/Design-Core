/** Sentinel resolved when a MOUSEDOWN prompt completes */
export class MouseDown {}

/** Sentinel resolved when a MOUSEUP prompt completes */
export class MouseUp {}

/** Input Class */
export class Input {
  static Type = {
    POINT: 'Point',
    SELECTIONSET: 'SelectionSet',
    SINGLESELECTION: 'SingleSelection',
    NUMBER: 'Number',
    STRING: 'String',
    DYNAMIC: 'Dynamic',
    MOUSEDOWN: 'MouseDown',
    MOUSEUP: 'MouseUp',
  };

  /**
   * Return the Input.Type for value
   * @param {any} value
   * @return {string|undefined}
   */
  static getType(value) {
    if (value === undefined) {
      return undefined;
    }

    return value.constructor.name;
  }
}
