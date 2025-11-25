/**
 * State Manager Class
 * Manages the history of states for undo/redo functionality
 *
 * The design of this class is based on a command design pattern.
 * The commands consist of Add, Remove and Update.
 * Each command has a do() and undo() method to perform and revert the action respectively.
 */
export class StateManager {
  #history = [];
  #historyIndex = 0;
  #maxHistoryStates = 10;
  #isModified = false;

  /**
   * Create StateManager
   * @param {EntityManager} entityManager
   */
  constructor() {
    this.stateCallbackFunction;
  }

  /**
   * Add a new state to the history
   * state: instance of State (AddState, RemoveState, UpdateState)
   * @param {State} state
   * */
  addState(state) {
    // Remove all future states
    if (this.#historyIndex < this.#history.length && this.#historyIndex !== -1) {
      this.#history.splice(this.#historyIndex);
    }

    // Add the new state and increment the index
    this.#history.push(state);
    this.#historyIndex++;

    this.limitHistory();
  }

  /** Limit the history to the maximum number of states */
  limitHistory() {
    while (this.#history.length > this.#maxHistoryStates) {
      this.#history.shift();
      this.#historyIndex--;
    }
  }

  /**
   * Get the previous state
   * @return {State}
   * */
  getPreviousState() {
    return this.#history[this.#historyIndex - 1];
  }

  /**
   * Get the current state
   * @return {State}
   * */
  getCurrentState() {
    return this.#history[this.#historyIndex];
  }

  /**
   * Get the next state
   * @return {State}
   * */
  getNextState() {
    return this.#history[this.#historyIndex + 1];
  }

  /** Clear the history */
  clearHistory() {
    this.#history = [];
    this.#historyIndex = 0;
  }

  /**
   * Get the length of the history
   * @return {number}
   * */
  getHistoryLength() {
    return this.#history.length;
  }

  /**
   * Commit a set of state changes
   * @param {EntityManager} entityManger
   * @param {Array} stateChanges
   */
  commit(entityManger, stateChanges) {
    const state = new State(entityManger, stateChanges);
    this.addState(state);
    state.do();
    this.stateChanged();
  }

  /** Undo the last action */
  undo() {
    const lastState = this.getPreviousState();

    if (lastState) {
      lastState.undo();
      this.#historyIndex--;
      this.stateChanged();
    }
  }

  /** Redo the last undone action */
  redo() {
    if (this.#historyIndex < this.#history.length) {
      const currentState = this.getCurrentState();

      if (currentState) {
        currentState.do();
        this.#historyIndex++;
        this.stateChanged();
      }
    }
  }

  /**
   * Check if undo is possible
   * @return {boolean} true if undo is possible
   * */
  canUndo() {
    return this.#historyIndex > 0;
  }

  /**
   * Check if redo is possible
   * @return {boolean} true if redo is possible
   * */
  canRedo() {
    return this.#historyIndex < this.#history.length;
  }

  /** Get the modified state */
  get isModified() {
    return this.#isModified;
  }

  /**
   * Set the state changed callback function
   * @param {function} callback
   */
  setStateCallbackFunction(callback) {
    this.stateCallbackFunction = callback;
  }

  /**
   * Set the modified state
   * @param {boolean} isModified
   */
  stateChanged(isModified=true) {
    this.#isModified = isModified;

    if (this.stateCallbackFunction) {
      this.stateCallbackFunction();
    }
  }
}

/** Base State Class */
class State {
  /**
   * Create State
   * @param {EntityManager} entityManager
   * @param {Array} stateChanges
   * */
  constructor(entityManager, stateChanges) {
    this.entityManager = entityManager;
    this.stateChanges = stateChanges;
    this.undoStateChanges = [];
  }

  /** Perform the state changes */
  do() {
    this.undoStateChanges = [];
    for (const stateChange of this.stateChanges) {
      if (stateChange instanceof AddState) {
        this.entityManager.add(stateChange.entity);
        const undoStateChange = new RemoveState(stateChange.entity, {});
        this.undoStateChanges.push(undoStateChange);
      }

      if (stateChange instanceof RemoveState) {
        const index = this.entityManager.indexOf(stateChange.entity);
        if (index !== -1) {
          this.entityManager.remove(index);
          const undoStateChange = new AddState(stateChange.entity, {});
          this.undoStateChanges.push(undoStateChange);
        }
      }

      if (stateChange instanceof UpdateState) {
        const index = this.entityManager.indexOf(stateChange.entity);
        if (index !== -1) {
          // capture previous properties for undo
          const previousProperties = {};
          for (const prop of Object.getOwnPropertyNames(stateChange.properties)) {
            previousProperties[prop] = stateChange.entity[prop];
          }
          const undoStateChange = new UpdateState(stateChange.entity, previousProperties);
          this.undoStateChanges.push(undoStateChange);

          this.entityManager.update(index, stateChange.properties);
        }
      }
    }
  }

  /** Undo the state changes */
  undo() {
    for (const stateChange of this.undoStateChanges) {
      if (stateChange instanceof AddState) {
        this.entityManager.add(stateChange.entity);
      }

      if (stateChange instanceof RemoveState) {
        const index = this.entityManager.indexOf(stateChange.entity);
        if (index !== -1) {
          this.entityManager.remove(index);
        }
      }

      if (stateChange instanceof UpdateState) {
        const index = this.entityManager.indexOf(stateChange.entity);
        if (index !== -1) {
          this.entityManager.update(index, stateChange.properties);
        }
      }
    }
  }
}


/**
 * State Change Base Class
 * Holds an entity and the properties to be changed
 */
class StateChange {
  /**
   * Create a state change
   * @param {object} entity
   * @param {object} properties
   */
  constructor(entity, properties) {
    this.entity = entity;
    this.properties = properties;
  }
}

/** Add State Class */
export class AddState extends StateChange {
  /**
   * Create Add State
   * @param {object} entity
   * @param {object} properties
   */
  constructor(entity, properties={}) {
    super(entity, properties);
  }
}

/** Remove State Class */
export class RemoveState extends StateChange {
  /** Create Remove State
   * @param {object} entity
   * @param {object} properties
   */
  constructor(entity, properties={}) {
    super(entity, properties);
  }
}

/** Update State Class */
export class UpdateState extends StateChange {
  /**
   * Create Update State
   * @param {object} entity
   * @param {object} properties
   */
  constructor(entity, properties) {
    super(entity, properties);
  }
}
