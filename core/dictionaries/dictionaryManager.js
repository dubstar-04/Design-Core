import { Dictionary } from './dictionary.js';
import { DesignCore } from '../designCore.js';

/**
 * DictionaryManager Class
 * Manages DXF dictionary objects for the OBJECTS section
 */
export class DictionaryManager {
  /** Create a DictionaryManager */
  constructor() {
    // ACAD_GROUP child dictionary
    this.acadGroup = new Dictionary({
      'name': 'ACAD_GROUP',
      'handle': DesignCore.HandleManager.next(),
    });

    // Root dictionary with entry pointing to ACAD_GROUP
    this.rootDictionary = new Dictionary({
      'handle': DesignCore.HandleManager.next(),
      'entries': [{ 'name': 'ACAD_GROUP', 'handle': this.acadGroup.handle }],
    });
  }

  /**
   * Write the dictionaries to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    this.rootDictionary.dxf(file);
    this.acadGroup.dxf(file);
  }
}
