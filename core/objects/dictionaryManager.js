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
    // ACAD_GROUP: child dictionary that stores named entity groups (selections)
    this.groupDictionary = new Dictionary({
      'name': 'ACAD_GROUP',
      'handle': DesignCore.HandleManager.next(),
    });

    // Root dictionary with entry pointing to ACAD_GROUP
    this.rootDictionary = new Dictionary({
      'handle': DesignCore.HandleManager.next(),
      'entries': [{ 'name': 'ACAD_GROUP', 'handle': this.groupDictionary.handle }],
    });
  }

  /**
   * Clear all dictionary items
   */
  clearItems() {
    this.groupDictionary = undefined;
    this.rootDictionary = undefined;
  }

  /**
   * Add a dictionary item from parsed DXF data
   * @param {Object} data - parsed DICTIONARY object
   */
  addItem(data) {
    const dictionary = new Dictionary(data);
    DesignCore.HandleManager.checkHandle(dictionary.handle);

    if (!this.rootDictionary) {
      // The first dictionary is the root dictionary
      this.rootDictionary = dictionary;
      // Only keep entries for dictionaries that Design manages
      const groupEntry = this.rootDictionary.entries.find((entry) => entry.name === 'ACAD_GROUP');
      this.rootDictionary.entries = groupEntry ? [groupEntry] : [];
    } else if (!this.groupDictionary) {
      // Check if this dictionary is the ACAD_GROUP child
      const groupEntry = this.rootDictionary.entries[0];
      if (groupEntry && dictionary.handle === groupEntry.handle) {
        dictionary.name = groupEntry.name;
        this.groupDictionary = dictionary;
      }
    }
  }

  /**
   * Ensure standard dictionary items exist
   */
  checkItems() {
    if (!this.rootDictionary || !this.groupDictionary) {
      this.addStandardItems();
    }
  }

  /**
   * Write the dictionaries to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    this.rootDictionary.dxf(file);
    this.groupDictionary.dxf(file);
  }
}
