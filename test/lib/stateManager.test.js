import { StateManager } from '../../core/lib/stateManager.js';
import { EntityManager } from '../../core/lib/entityManager.js';
import { AddState, RemoveState, UpdateState } from '../../core/lib/stateManager.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';

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
});

