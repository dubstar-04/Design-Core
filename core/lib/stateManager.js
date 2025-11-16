import { Utils } from './utils.js';

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

  /**
   * Create StateManager
   */
  constructor() { }

  /** Add a new state to the history */
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

  /** Get the previous state */
  getPreviousState() {
    return this.#history[this.#historyIndex - 1];
  }

  /** Get the current state */
  getCurrentState() {
    return this.#history[this.#historyIndex];
  }
  /** Get the next state */
  getNextState() {
    return this.#history[this.#historyIndex + 1];
  }

  /** Clear the history */
  clearHistory() {
    this.#history = [];
    this.#historyIndex = 0;
  }

  /** Get the length of the history */
  getHistoryLength() {
    return this.#history.length;
  }

  /** Add entities to the entity manager */
  add(entityManager, stateChanges) {
    const state = new AddState(entityManager, stateChanges);
    this.addState(state);
    state.do();
  }

  /** Remove entities from the entity manager */
  remove(entityManager, stateChanges) {
    const state = new RemoveState(entityManager, stateChanges);
    this.addState(state);
    state.do();
  }

  /** Update entities in the entity manager */
  update(entityManager, StateChanges) {
    const state = new UpdateState(entityManager, StateChanges);
    this.addState(state);
    state.do();
  }

  /** Undo the last action */
  undo() {
    console.log('StateManager undo');
    const lastState = this.getPreviousState();

    if (lastState) {
      lastState.undo();
      this.#historyIndex--;
    }
  }

  /** Redo the last undone action */
  redo() {
    if (this.#historyIndex < this.#history.length) {
      console.log('StateManager redo');
      const currentState = this.getCurrentState();

      if (currentState) {
        currentState.do();
        this.#historyIndex++;
      }
    }
  }
}

/** Base State Class */
export class State {
  constructor(entityManager, stateChanges) {
    this.entityManager = entityManager;
    this.stateChanges = stateChanges;
  }
}


/** Add State Class */
export class AddState extends State {
  constructor(entityManager, stateChanges) {
    super(entityManager, stateChanges);
  }

  /** Perform the add */
  do() {
    console.log('do add');
    for (const stateChange of this.stateChanges) {
      this.entityManager.add(stateChange.entity);
    }
  }

  /** Undo the add */
  undo() {
    console.log('undo add');
    for (const stateChange of this.stateChanges) {
      const index = this.entityManager.indexOf(stateChange.entity);
      if (index !== -1) {
        this.entityManager.remove(index);
      }
    }
  }
}

/** Remove State Class */
export class RemoveState extends State {
  constructor(entityManager, stateChanges) {
    super(entityManager, stateChanges);
  }

  /** Perform the remove  */
  do() {
    console.log('do remove');
    for (const stateChange of this.stateChanges) {
      const index = this.entityManager.indexOf(stateChange.entity);
      if (index !== -1) {
        this.entityManager.remove(index);
      }
    }
  }

  /** Undo the remove */
  undo() {
    console.log('undo remove');
    for (const stateChange of this.stateChanges) {
      this.entityManager.add(stateChange.entity);
    }
  }
}

/** Update State Class */
export class UpdateState extends State {
  constructor(entityManager, StateChanges) {
    super(entityManager, StateChanges);
    this.previousStateChanges = [];
  }

  /** Perform the update */
  do() {
    console.log('do update');

    this.previousStateChanges = [];
    for (const stateChange of this.stateChanges) {
      // get the entity and its current properties
      const entity = stateChange.entity;
      const properties = stateChange.properties;
      // store the previous properties for undo
      const previousProperties = Utils.cloneObject(entity);
      const previousStateChange = new StateChange(entity, previousProperties);
      this.previousStateChanges.push(previousStateChange);
      // perform the update
      const index = this.entityManager.indexOf(entity);
      this.entityManager.update(index, properties);
    }
  }

  /**
   * Undo the update
   */
  undo() {
    console.log('undo update');
    for (const stateChange of this.previousStateChanges) {
      // get the entity and its previous properties
      const entity = stateChange.entity;
      const properties = stateChange.properties;
      // perform the update to restore previous properties
      const index = this.entityManager.indexOf(entity);
      this.entityManager.update(index, properties);
    }
  }
}

/**
 * State Change Class
 * Holds an entity and the properties to be changed
 */
export class StateChange {
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

