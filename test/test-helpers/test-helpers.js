
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
 * @param {object} [extraMethods] - additional methods to add to the mock inputManager
 */
export async function withMockInput(scene, inputs, testFn, extraMethods = {}) {
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

  try {
    await testFn();
  } finally {
    scene.inputManager = origInputManager;
  }
}

/**
 * Run an async test with mock inputManager and entities.get, restoring both afterwards.
 * @param {object} scene - DesignCore.Scene
 * @param {Array} inputs - sequential values returned by requestInput
 * @param {Array} selectedItems - sequential values returned by entities.get
 * @param {Function} testFn - async function to run with the mocks active
 */
export async function withMockInputAndEntities(scene, inputs, selectedItems, testFn) {
  const origInputManager = scene.inputManager;
  const origGetItem = scene.entities.get;

  let requestInputCallCount = 0;
  let selectedItemsCallCount = 0;

  scene.inputManager = {
    requestInput: async () => {
      requestInputCallCount++;
      return inputs[requestInputCallCount - 1];
    },
    executeCommand: () => {},
  };

  scene.entities.get = () => {
    selectedItemsCallCount++;
    return selectedItems[selectedItemsCallCount - 1];
  };

  try {
    await testFn();
  } finally {
    scene.inputManager = origInputManager;
    scene.entities.get = origGetItem;
  }
}

