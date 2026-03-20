import { Dictionary } from './dictionary.js';

/**
 * DictionaryManager Class
 * Manages DXF dictionary objects for the OBJECTS section
 */
export class DictionaryManager {
  /** Create a DictionaryManager */
  constructor() { }

  /**
   * Write the dictionaries to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    // ACAD_GROUP child dictionary
    const acadGroup = new Dictionary({
      'name': 'ACAD_GROUP',
    });

    // Root dictionary with entry pointing to ACAD_GROUP
    const rootDictionary = new Dictionary({
      'entries': [{ 'name': 'ACAD_GROUP', 'handle': 'D' }],
    });

    rootDictionary.dxf(file);
    acadGroup.dxf(file);
  }
}
