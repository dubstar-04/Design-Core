import { Tool } from '../../core/tools/tool.js';
import { GripStretch } from '../../core/tools/gripStretch.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { DimensionBase } from '../../core/dimensions/dimensionBase.js';
import { Point } from '../../core/entities/point.js';
import { jest } from '@jest/globals';

const core = new Core();

test('GripStretch is a Tool with type GripStretch', () => {
  const gripStretch = new GripStretch();
  expect(gripStretch).toBeInstanceOf(Tool);
  expect(gripStretch.type).toBe('GripStretch');
});

test('GripStretch is not registered as a typeable command', () => {
  expect(typeof GripStretch.register).toBe('undefined');
});

test('GripStretch.action commits the dropped grip position to the real entity', () => {
  core.scene.clear();
  const dim = new DimensionBase({});
  dim.points = [
    Object.assign(new Point(0, 0), { sequence: 13 }),
    Object.assign(new Point(10, 10), { sequence: 11 }),
  ];
  DesignCore.Scene.entities.add(dim);
  core.scene.selectionManager.addToSelectionSet(0);

  const grip = dim.getGrips()[0];
  const gripStretch = new GripStretch(0, grip);
  gripStretch.points.push(new Point(50, 60));

  gripStretch.action();

  const entity = core.scene.entities.get(0);
  const pt11 = entity.getPointBySequence(entity.points, 11);
  expect(pt11.x).toBe(50);
  expect(pt11.y).toBe(60);
  expect(entity.dimType.hasUserPositionedText()).toBe(true);
});

test('GripStretch.preview live-updates the selected-entity preview clone, not the real entity', () => {
  core.scene.clear();
  const dim = new DimensionBase({});
  dim.points = [
    Object.assign(new Point(0, 0), { sequence: 13 }),
    Object.assign(new Point(10, 10), { sequence: 11 }),
  ];
  DesignCore.Scene.entities.add(dim);
  core.scene.selectionManager.addToSelectionSet(0);

  const grip = dim.getGrips()[0];
  const gripStretch = new GripStretch(0, grip);
  jest.spyOn(DesignCore.Mouse, 'pointOnScene').mockReturnValue(new Point(50, 60));

  gripStretch.preview();

  const previewEntity = core.scene.selectionManager.selectedEntities[0];
  const previewPt11 = previewEntity.getPointBySequence(previewEntity.points, 11);
  expect(previewPt11.x).toBe(50);
  expect(previewPt11.y).toBe(60);

  const realPt11 = core.scene.entities.get(0).getPointBySequence(core.scene.entities.get(0).points, 11);
  expect(realPt11.x).toBe(10);
  expect(realPt11.y).toBe(10);

  jest.restoreAllMocks();
});

test('GripStretch.execute requests the stretch point then commits, keeping the entity selected', async () => {
  core.scene.clear();
  const dim = new DimensionBase({});
  dim.points = [
    Object.assign(new Point(0, 0), { sequence: 13 }),
    Object.assign(new Point(10, 10), { sequence: 11 }),
  ];
  DesignCore.Scene.entities.add(dim);
  core.scene.selectionManager.addToSelectionSet(0);

  const grip = dim.getGrips()[0];
  const gripStretch = new GripStretch(0, grip);

  const origInputManager = DesignCore.Scene.inputManager;
  DesignCore.Scene.inputManager = {
    requestInput: async (op) => {
      expect(op.promptMessage).toBe('Specify stretch point');
      return new Point(50, 60);
    },
    actionCommand: () => gripStretch.action(),
    refreshPreview: () => {},
  };

  try {
    await gripStretch.execute();
  } finally {
    DesignCore.Scene.inputManager = origInputManager;
  }

  const entity = core.scene.entities.get(0);
  const pt11 = entity.getPointBySequence(entity.points, 11);
  expect(pt11.x).toBe(50);
  expect(pt11.y).toBe(60);
  // grip editing must leave the entity selected afterwards, unlike most commands
  expect(core.scene.selectionManager.selectionSet.selectionSet).toContain(0);
});

