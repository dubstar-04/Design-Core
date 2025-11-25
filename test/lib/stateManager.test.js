import { StateManager } from '../../core/lib/stateManager.js';
import { EntityManager } from '../../core/lib/entityManager.js';
import { AddState, RemoveState, UpdateState } from '../../core/lib/stateManager.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';
import { jest } from '@jest/globals';

describe('StateManager', () => {
  let sm;

  beforeEach(() => {
    sm = new StateManager();
  });

  test('limitHistory only allows max history states', () => {
    const em = new EntityManager();
    for (let i = 0; i < 20; i++) {
      sm.commit(em, [new AddState({ id: `e${i}` })]);
      expect(sm.getHistoryLength()).toBeLessThanOrEqual(10);
    }
  });

  test('add() creates an AddState, performs do, undo and redo', () => {
    const em = new EntityManager();
    const entity = { id: 'e1' };
    sm.commit(em, [new AddState(entity)]);
    expect(em.count()).toBe(1);
    expect(sm.getHistoryLength()).toBe(1);
    sm.undo();
    expect(em.count()).toBe(0);
    expect(sm.getHistoryLength()).toBe(1);
    sm.redo();
    expect(em.count()).toBe(1);
  });

  test('remove() creates a RemoveState, performs do, undo and redo', () => {
    const em = new EntityManager();
    const entity = { id: 'e2' };
    sm.commit(em, [new AddState(entity)]);
    expect(em.count()).toBe(1);
    sm.commit(em, [new RemoveState(entity)]);
    expect(em.count()).toBe(0);
    sm.undo();
    expect(em.count()).toBe(1);
    sm.redo();
    expect(em.count()).toBe(0);
  });

  test('update() creates UpdateState and undo restores previous properties', () => {
    const em = new EntityManager();
    // seed entities
    for (let i = 0; i < 5; i++) {
      const line = new Line({ layer: 'testLayer', points: [new Point(i, i), new Point(10, 11)] });
      sm.commit(em, [new AddState(line)]);
    }
    const target = em.get(2);
    sm.commit(em, [new UpdateState(target, { layer: 'newLayer' })]);
    expect(em.get(2).layer).toBe('newLayer');
    sm.undo();
    expect(em.get(2).layer).toBe('testLayer');
    sm.redo();
    expect(em.get(2).layer).toBe('newLayer');
  });

  test('addState removed future states', () => {
    const em = new EntityManager();
    const line = new Line({ layer: 'testLayer', points: [new Point(), new Point(10, 11)] });
    sm.commit(em, [new AddState(line)]);
    expect(em.get(0).layer).toBe('testLayer');
    sm.commit(em, [new UpdateState(line, { layer: 'differentLayer', points: [new Point(1, 2), new Point(101, 110)] })]);
    expect(em.get(0).layer).toBe('differentLayer');
    sm.undo();
    expect(em.get(0).layer).toBe('testLayer');
    sm.redo();
    expect(em.get(0).layer).toBe('differentLayer');
  });

  test('clearHistory resets history and indices', () => {
    const em = new EntityManager();
    sm.commit(em, [new AddState({ id: 'a' })]);
    expect(sm.getHistoryLength()).toBe(1);
    sm.clearHistory();
    expect(sm.getHistoryLength()).toBe(0);
    expect(sm.canUndo()).toBe(false);
    expect(sm.canRedo()).toBe(false);
  });

  test('canUndo and canRedo basic lifecycle', () => {
    const em = new EntityManager();
    expect(sm.canUndo()).toBe(false);
    expect(sm.canRedo()).toBe(false);
    sm.commit(em, [new AddState({ id: 'first' })]);
    expect(sm.canUndo()).toBe(true);
    expect(sm.canRedo()).toBe(false);
    sm.undo();
    expect(sm.canUndo()).toBe(false);
    expect(sm.canRedo()).toBe(true);
    sm.redo();
    expect(sm.canUndo()).toBe(true);
    expect(sm.canRedo()).toBe(false);
  });

  test('canRedo cleared after new commit following undo', () => {
    const em = new EntityManager();
    sm.commit(em, [new AddState({ id: 'A' })]);
    sm.commit(em, [new AddState({ id: 'B' })]);
    expect(sm.canUndo()).toBe(true);
    expect(sm.canRedo()).toBe(false);
    sm.undo();
    expect(sm.canRedo()).toBe(true);
    sm.commit(em, [new AddState({ id: 'C' })]);
    expect(sm.canRedo()).toBe(false);
  });

  test('isModified getter reflects internal flag and stateChanged invokes callback and respects parameter', () => {
    // initial state should be not modified
    expect(sm.isModified).toBe(false);

    const cb = jest.fn();
    sm.setStateCallbackFunction(cb);

    // calling stateChanged with default should set modified to true and call callback
    sm.stateChanged();
    expect(sm.isModified).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);

    // calling stateChanged(false) should clear modified flag and call callback
    sm.stateChanged(false);
    expect(sm.isModified).toBe(false);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  test('stateChanged is invoked after commit/undo/redo', () => {
    const em = new EntityManager();
    const cb = jest.fn();
    sm.setStateCallbackFunction(cb);

    // commit should call stateChanged once
    sm.commit(em, [new AddState({ id: 'x' })]);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(sm.isModified).toBe(true);

    // undo should call stateChanged again
    sm.undo();
    expect(cb).toHaveBeenCalledTimes(2);

    // redo should call stateChanged again
    sm.redo();
    expect(cb).toHaveBeenCalledTimes(3);
  });
});

