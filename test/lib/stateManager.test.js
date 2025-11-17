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
    // Add 20 items
    for (let i = 0; i < 20; i++) {
      const stateChange = new AddState({ id: `e${i}` });
      sm.commit(em, [stateChange]);
      expect(sm.getHistoryLength()).toBeLessThanOrEqual(10);
    }
  });


  test('add() creates an AddState, performs do, undo and redo', () => {
    const em = new EntityManager();
    const entity = { id: 'e1' };

    const stateChange = new AddState(entity);
    sm.commit(em, [stateChange]);
    expect(em.count()).toBe(1);
    expect(sm.getHistoryLength()).toBe(1);

    // undo should remove the added entity
    sm.undo();
    expect(em.count()).toBe(0);
    expect(sm.getHistoryLength()).toBe(1);

    // redo should re-add the entity
    sm.redo();
    expect(em.count()).toBe(1);
  });

  test('remove() creates a RemoveState, performs do, undo and redo', () => {
    const em = new EntityManager();
    const entity = { id: 'e2' };
    const stateChange = new AddState(entity);
    sm.commit(em, [stateChange]);
    expect(em.count()).toBe(1);

    const stateChangeRem = new RemoveState(entity);
    sm.commit(em, [stateChangeRem]);
    // remove.do should have removed entity
    expect(em.count()).toBe(0);

    // undo should add it back
    sm.undo();
    expect(em.count()).toBe(1);

    // redo should remove again
    sm.redo();
    expect(em.count()).toBe(0);
  });


  test('update() creates UpdateState and undo restores previous properties', () => {
    const em = new EntityManager();
    // Add 10 items
    for (let i = 0; i < 10; i++) {
      const stateChange = new AddState({ id: `e${i}` });
      sm.commit(em, [stateChange]);
      expect(sm.getHistoryLength()).toBeLessThanOrEqual(10);
      expect(em.count()).toBe(i + 1);
    }

    // undo should restore previous values
    const itemCount = em.count();
    for (let i = 0; i < 5; i++) {
      sm.undo();
      expect(em.get(em.count() - 1).id).toBe(`e${itemCount - i - 2}`);
      expect(em.count()).toBe(itemCount - i - 1);
      expect(sm.getHistoryLength()).toBe(10);
    };

    // adding a new state should remove future states
    const entity = { id: 'extraItem' };
    const stateChange = new AddState(entity);
    sm.commit(em, [stateChange]);
    expect(sm.getHistoryLength()).toBe(6);
  });


  test('addState removed future states', () => {
    const em = new EntityManager();
    const entity = new Line( { layer: 'testLayer', points: [new Point(), new Point(10, 11)] });
    const stateChange = new AddState(entity);
    sm.commit(em, [stateChange]);
    expect(em.get(0).layer).toBe('testLayer');
    expect(em.get(0).points[0].x).toBe(0);
    expect(em.get(0).points[0].y).toBe(0);
    expect(em.get(0).points[1].x).toBe(10);
    expect(em.get(0).points[1].y).toBe(11);

    // perform update
    const stateChangeUpdate = new UpdateState(entity, { layer: 'differentLayer', points: [new Point(1, 2), new Point(101, 110)] });
    sm.commit(em, [stateChangeUpdate]);
    expect(em.get(0).layer).toBe('differentLayer');
    expect(em.get(0).points[0].x).toBe(1);
    expect(em.get(0).points[0].y).toBe(2);
    expect(em.get(0).points[1].x).toBe(101);
    expect(em.get(0).points[1].y).toBe(110);

    // undo should restore previous values
    sm.undo();
    expect(em.get(0).layer).toBe('testLayer');
    expect(em.get(0).points[0].x).toBe(0);
    expect(em.get(0).points[0].y).toBe(0);
    expect(em.get(0).points[1].x).toBe(10);
    expect(em.get(0).points[1].y).toBe(11);

    // redo should apply update again
    sm.redo();
    expect(em.get(0).layer).toBe('differentLayer');
    expect(em.get(0).points[0].x).toBe(1);
    expect(em.get(0).points[0].y).toBe(2);
    expect(em.get(0).points[1].x).toBe(101);
    expect(em.get(0).points[1].y).toBe(110);
  });

  test('clearHistory resets history and indices', () => {
    const em = new EntityManager();
    const entity = new Line( { layer: 'testLayer', points: [new Point(), new Point(10, 11)] });
    const stateChange = new AddState(entity);
    sm.commit(em, [stateChange]);
    expect(sm.getHistoryLength()).toBeGreaterThan(0);
    sm.clearHistory();
    expect(sm.getHistoryLength()).toBe(0);
  });
});

