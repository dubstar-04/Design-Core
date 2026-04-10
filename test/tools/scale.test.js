import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Scale } from '../../core/tools/scale.js';

const core = new Core();

const inputScenarios = [
  {
    desc: 'numeric factor 2 from origin',
    points: [new Point(10, 0), new Point(20, 0)],
    inputs: [new Point(0, 0), 2],
    result: [new Point(20, 0), new Point(40, 0)],
  },
  {
    desc: 'numeric factor 0.5 from origin',
    points: [new Point(10, 0), new Point(20, 0)],
    inputs: [new Point(0, 0), 0.5],
    result: [new Point(5, 0), new Point(10, 0)],
  },
  {
    desc: 'point input uses distance from base as scale factor',
    points: [new Point(1, 0), new Point(2, 0)],
    inputs: [new Point(0, 0), new Point(3, 4)], // distance = 5 → factor = 5
    result: [new Point(5, 0), new Point(10, 0)],
  },
  {
    desc: 'reference workflow with numeric ref and new length',
    points: [new Point(10, 0), new Point(20, 0)],
    inputs: [new Point(0, 0), 'Reference', 10, 30], // factor = 30/10 = 3
    result: [new Point(30, 0), new Point(60, 0)],
  },
  {
    desc: 'reference workflow with point-based ref length',
    points: [new Point(5, 0), new Point(10, 0)],
    inputs: [new Point(0, 0), 'Reference', new Point(0, 0), new Point(10, 0), 20], // ref=10, new=20 → factor=2
    result: [new Point(10, 0), new Point(20, 0)],
  },
];

test.each(inputScenarios)('Scale.execute handles $desc', async (scenario) => {
  const { points, inputs, result } = scenario;

  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const scale = new Scale();
  await scale.execute();

  scale.action();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(result[0].x);
  expect(line.points[0].y).toBeCloseTo(result[0].y);
  expect(line.points[1].x).toBeCloseTo(result[1].x);
  expect(line.points[1].y).toBeCloseTo(result[1].y);

  core.scene.inputManager = origInputManager;
});

test('Scale.execute - cancel at base point does not scale', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  core.scene.inputManager = {
    requestInput: async () => undefined,
    executeCommand: () => {},
    reset: () => {},
  };

  const scale = new Scale();
  await scale.execute();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(10);
  expect(line.points[1].x).toBeCloseTo(20);

  core.scene.inputManager = origInputManager;
});

test('Scale.execute - cancel at factor prompt does not scale', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [new Point(0, 0)]; // provides base point, then undefined on factor
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const scale = new Scale();
  await scale.execute();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(10);
  expect(line.points[1].x).toBeCloseTo(20);

  core.scene.inputManager = origInputManager;
});

test('Scale.execute - entity count unchanged after execute', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(5, 0), new Point(10, 0)] });

  const entityCount = core.scene.entities.count();

  for (let i = 0; i < entityCount; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [new Point(0, 0), 3];
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const scale = new Scale();
  await scale.execute();
  scale.action();

  expect(core.scene.entities.count()).toBe(entityCount);

  core.scene.inputManager = origInputManager;
});

test('Test Scale.action - scale by factor 2 from origin', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Polyline', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Arc', { points: [new Point(5, 0), new Point(10, 0), new Point(5, 5)] });
  core.scene.addItem('Rectangle', { points: [new Point(5, 0), new Point(10, 0)] });

  for (let i = 0; i < core.scene.entities.count(); i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const scale = new Scale();
  scale.points.push(new Point(0, 0)); // base point at origin
  scale.scaleFactor = 2;

  scale.action();

  for (let i = 0; i < core.scene.entities.count(); i++) {
    expect(core.scene.entities.get(i).points[0].x).toBeCloseTo(10);
    expect(core.scene.entities.get(i).points[0].y).toBeCloseTo(0);
    expect(core.scene.entities.get(i).points[1].x).toBeCloseTo(20);
    expect(core.scene.entities.get(i).points[1].y).toBeCloseTo(0);
  }
});

test('Test Scale.action - scale by factor 0.5 from origin', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });

  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.scaleFactor = 0.5;

  scale.action();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(5);
  expect(line.points[0].y).toBeCloseTo(0);
  expect(line.points[1].x).toBeCloseTo(10);
  expect(line.points[1].y).toBeCloseTo(0);
});

test('Test Scale.action - scale from offset base point', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 10), new Point(20, 10)] });

  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(10, 10)); // base at first point
  scale.scaleFactor = 2;

  scale.action();

  const line = core.scene.entities.get(0);
  // base point stays fixed, second point doubles away from it
  expect(line.points[0].x).toBeCloseTo(10);
  expect(line.points[0].y).toBeCloseTo(10);
  expect(line.points[1].x).toBeCloseTo(30);
  expect(line.points[1].y).toBeCloseTo(10);
});

test('Test Scale.action - entity count unchanged (in-place update)', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(5, 0), new Point(10, 0)] });

  const entityCount = core.scene.entities.count();

  for (let i = 0; i < entityCount; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.scaleFactor = 3;

  scale.action();

  // Scale is in-place — no new entities added
  expect(core.scene.entities.count()).toBe(entityCount);
});

test('Test Scale.action - scale factor 1 leaves points unchanged', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 20), new Point(30, 40)] });

  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.scaleFactor = 1;

  scale.action();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(10);
  expect(line.points[0].y).toBeCloseTo(20);
  expect(line.points[1].x).toBeCloseTo(30);
  expect(line.points[1].y).toBeCloseTo(40);
});

test('Test Scale.action - scale 2D point (non-axis-aligned)', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 5), new Point(10, 10)] });

  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.scaleFactor = 2;

  scale.action();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(10);
  expect(line.points[0].y).toBeCloseTo(10);
  expect(line.points[1].x).toBeCloseTo(20);
  expect(line.points[1].y).toBeCloseTo(20);
});

test('Test Scale.action - empty selection does not throw', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  // deliberately do not add anything to the selection set

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.scaleFactor = 2;

  expect(() => scale.action()).not.toThrow();

  // Entity should be unmodified
  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(5);
  expect(line.points[1].x).toBeCloseTo(10);
});

test('Test Scale.getScaledPoints - from origin', () => {
  const scale = new Scale();
  const base = new Point(0, 0);

  const points = [new Point(5, 0), new Point(0, 5)];
  const result = scale.getScaledPoints(points, base, 2);

  expect(result[0].x).toBeCloseTo(10);
  expect(result[0].y).toBeCloseTo(0);
  expect(result[1].x).toBeCloseTo(0);
  expect(result[1].y).toBeCloseTo(10);
});

test('Test Scale.getScaledPoints - from offset base', () => {
  const scale = new Scale();
  const base = new Point(10, 10);

  const points = [new Point(20, 10), new Point(10, 20)];
  const result = scale.getScaledPoints(points, base, 3);

  // (20-10)*3 + 10 = 40, (10-10)*3 + 10 = 10
  expect(result[0].x).toBeCloseTo(40);
  expect(result[0].y).toBeCloseTo(10);
  // (10-10)*3 + 10 = 10, (20-10)*3 + 10 = 40
  expect(result[1].x).toBeCloseTo(10);
  expect(result[1].y).toBeCloseTo(40);
});

test('Test Scale.getScaledPoints - preserves bulge and sequence', () => {
  const scale = new Scale();
  const base = new Point(0, 0);

  const points = [new Point(5, 0, 0.5, 1), new Point(10, 0, -0.25, 2)];
  const result = scale.getScaledPoints(points, base, 2);

  expect(result[0].bulge).toBe(0.5);
  expect(result[0].sequence).toBe(1);
  expect(result[1].bulge).toBe(-0.25);
  expect(result[1].sequence).toBe(2);
});

test('Scale.execute - requests selection set when none pre-selected', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });
  // Intentionally do NOT add to selection set — triggers the SELECTIONSET prompt

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  core.scene.inputManager = {
    requestInput: async () => {
      callCount++;
      if (callCount === 1) {
        // SELECTIONSET prompt: populate the selection manually and return
        core.scene.selectionManager.addToSelectionSet(0);
        return;
      }
      if (callCount === 2) return new Point(0, 0); // base point
      if (callCount === 3) return 2; // scale factor
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const scale = new Scale();
  await scale.execute();
  scale.action();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(20);
  expect(line.points[1].x).toBeCloseTo(40);

  core.scene.inputManager = origInputManager;
});

test('Scale.execute - reference with zero length returns without scaling', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  // base point, then 'Reference', then ref length = 0
  const inputs = [new Point(0, 0), 'Reference', 0];
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const scale = new Scale();
  await scale.execute();
  // action() should not be called — execute returned early, scaleFactor unchanged (1)
  scale.action();

  // Entity should be unchanged (scaleFactor stayed at 1 but no second point pushed,
  // so points array only has base — action uses scaleFactor=1)
  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(10);
  expect(line.points[1].x).toBeCloseTo(20);

  core.scene.inputManager = origInputManager;
});

test('Scale.preview - no points set, adds no temp entities', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  // No points — guard condition prevents any work
  scale.preview();

  expect(core.scene.previewEntities.count()).toBe(0);
});

test('Scale.preview - referencePoint set, suppresses preview', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.referencePoint = new Point(0, 0); // non-null blocks preview

  scale.preview();

  expect(core.scene.previewEntities.count()).toBe(0);
});

test('Scale.preview - mouse on base point (distance 0), draws line but skips scaling', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  // Push base point identical to default mouse scene position (0,0)
  scale.points.push(new Point(0, 0));
  scale.referencePoint = null;

  scale.preview();

  // Temp line is still created
  expect(core.scene.previewEntities.count()).toBeGreaterThanOrEqual(1);

  // Selected item points should be unchanged (scaling skipped)
  const previewItem = core.scene.selectionManager.selectedItems[0];
  expect(previewItem.points[0].x).toBeCloseTo(5);
});

test('Scale.preview - one point set, draws temp line and scales selected items', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(1, 0), new Point(2, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  // Base point away from the default mouse scene position so distance > 0
  scale.points.push(new Point(100, 100));
  scale.referencePoint = null;

  scale.preview();

  // Temp line should be created
  expect(core.scene.previewEntities.count()).toBeGreaterThanOrEqual(1);

  // Preview item should have been scaled (x differs from original 1.0)
  const previewItem = core.scene.selectionManager.selectedItems[0];
  expect(previewItem.points[0].x).not.toBeCloseTo(1);
});

test('Scale.preview - reference mode uses referenceLength to compute factor', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  // Line at x=10..20, y=0
  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(0, 0)); // base at origin
  scale.referencePoint = null; // reference collection done — preview active
  scale.referenceLength = 10; // established reference length

  // The default mouse scene position will give some distance from (0,0).
  // We can't control the mouse, so just verify the factor applied is
  // distance/referenceLength rather than raw distance: reload the selectedItems
  // before and after with a known referenceLength to confirm scaling occurred.
  scale.preview();

  expect(core.scene.previewEntities.count()).toBeGreaterThanOrEqual(1);

  // The preview item's first point should differ from the original (10,0)
  // because the factor (distance/10) is applied
  const previewItem = core.scene.selectionManager.selectedItems[0];
  expect(previewItem.points[0].x).not.toBeCloseTo(10);
});
