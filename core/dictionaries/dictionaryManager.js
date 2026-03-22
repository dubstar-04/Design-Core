import { Dictionary } from './dictionary.js';
import { DesignCore } from '../designCore.js';

/**
 * DictionaryManager Class
 * Manages DXF dictionary objects for the OBJECTS section
 */
export class DictionaryManager {
  /** Create a DictionaryManager */
  constructor() {
    this.addStandardItems();
  }

  /**
   * Create the standard dictionary items
   */
  addStandardItems() {
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
   * Clear all dictionary items
   */
  clearItems() {
    this.acadGroup = undefined;
    this.rootDictionary = undefined;
  }

  /**
   * Load dictionaries from parsed DXF objects
   * @param {Array} objects - parsed objects from OBJECTS section
   */
  load(objects) {
    const dictionaries = objects.filter((obj) => obj[0] === 'DICTIONARY');

    if (dictionaries.length) {
      this.clearItems();

      // The first dictionary is the root dictionary
      this.rootDictionary = new Dictionary(dictionaries[0]);
      DesignCore.HandleManager.checkHandle(this.rootDictionary.handle);

      // Find the ACAD_GROUP child dictionary
      const acadGroupEntry = this.rootDictionary.entries.find((entry) => entry.name === 'ACAD_GROUP');

      if (acadGroupEntry) {
        // Find the child dictionary by handle
        const acadGroupData = dictionaries.find((dict) => dict[5] === acadGroupEntry.handle);
        if (acadGroupData) {
          this.acadGroup = new Dictionary(acadGroupData);
          this.acadGroup.name = 'ACAD_GROUP';
          DesignCore.HandleManager.checkHandle(this.acadGroup.handle);

          // Only keep entries for dictionaries that Design manages
          this.rootDictionary.entries = [{'name': 'ACAD_GROUP', 'handle': this.acadGroup.handle}];
          return;
        }
      }
    }

    // No valid objects data - create standard items
    this.addStandardItems();
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
