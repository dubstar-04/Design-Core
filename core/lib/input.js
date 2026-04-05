/** Sentinel resolved when a MOUSEDOWN prompt completes */
export class MouseDown {}

/** Sentinel resolved when a MOUSEUP prompt completes */
export class MouseUp {}

/** Input Class */
export class Input {
  static CursorState = {
    DEFAULT: 'DEFAULT',
    GRAB: 'GRAB',
    GRABBING: 'GRABBING',
    SELECTION: 'SELECTION',
  };

  /**
   * Input type definitions.
   * Each entry describes an accepted input type:
   *   value  — matches value.constructor.name for runtime type detection via getType()
   *   cursor — the cursor state to apply when this type is requested (null = DEFAULT)
   */
  static Type = {
    POINT: { value: 'Point', cursor: null },
    SELECTIONSET: { value: 'SelectionSet', cursor: Input.CursorState.SELECTION },
    SINGLESELECTION: { value: 'SingleSelection', cursor: Input.CursorState.SELECTION },
    NUMBER: { value: 'Number', cursor: null },
    STRING: { value: 'String', cursor: null },
    DYNAMIC: { value: 'Dynamic', cursor: null },
    MOUSEDOWN: { value: 'MouseDown', cursor: null },
    MOUSEUP: { value: 'MouseUp', cursor: null },
  };

  /**
   * Return the Input.Type for value
   * @param {any} value
   * @return {Object|undefined}
   */
  static getType(value) {
    if (value === undefined) {
      return undefined;
    }

    const name = value.constructor.name;
    return Object.values(Input.Type).find((t) => t.value === name);
  }
}
