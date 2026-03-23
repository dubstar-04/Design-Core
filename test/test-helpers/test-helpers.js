
/**
 *  Mock File class for testing
 */
export class File {
  /**
   * Mock File class constructor
   */
  constructor() {
    this.contents = '';
  }

  /**
   * Mock function to write group code and value
   * @param {number} groupCode
   * @param {any} groupValue
   */
  writeGroupCode(groupCode, groupValue) {
    this.contents = this.contents.concat(`${groupCode}\n${groupValue}\n`);
  }
}

/**
 * Run an async test with a mock inputManager, restoring the original afterwards.
 * @param {object} scene - DesignCore.Scene
 * @param {Array} inputs - sequential values returned by requestInput
 * @param {Function} testFn - async function to run with the mock active
 * @param {object} [options] - optional configuration
 * @param {object} [options.extraMethods] - additional methods to add to the mock inputManager
 * @param {Array} [options.selectedItems] - sequential values returned by entities.get
 */
export async function withMockInput(scene, inputs, testFn, options = {}) {
  const { extraMethods = {}, selectedItems } = options;
  const origInputManager = scene.inputManager;
  let callCount = 0;

  scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    ...extraMethods,
  };

  let origGetItem;
  if (selectedItems) {
    origGetItem = scene.entities.get;
    let selectedItemsCallCount = 0;
    scene.entities.get = () => {
      return selectedItems[selectedItemsCallCount++];
    };
  }

  try {
    await testFn();
  } finally {
    scene.inputManager = origInputManager;
    if (selectedItems) {
      scene.entities.get = origGetItem;
    }
  }
}

