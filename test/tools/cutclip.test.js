import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Cutclip } from '../../core/tools/cutclip.js';
import { DesignCore } from '../../core/designCore.js';

import { jest } from '@jest/globals';

// Initialize core (sets DesignCore.Core)
new Core();

describe('Cutclip Tool', () => {
  beforeEach(() => {
    // reset scene entities and selection
    DesignCore.Scene.entities.clear();
    DesignCore.Scene.selectionManager.reset();
    // clear clipboard
    DesignCore.Clipboard.Entities = [];
  });

  test('action copies selected entities and sets base point to bounding box bottom-left', () => {
    // Create two line entities and add to scene
    const line1 = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(10, 20), new Point(30, 40)] });
    const line2 = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(-5, 100), new Point(0, 80)] });
    DesignCore.Scene.entities.add(line1);
    DesignCore.Scene.entities.add(line2);

    // Select both
    DesignCore.Scene.selectionManager.addToSelectionSet(0);
    DesignCore.Scene.selectionManager.addToSelectionSet(1);
    expect(DesignCore.Scene.selectionManager.selectedItems).toHaveLength(2);

    const tool = new Cutclip();
    tool.action();

    // Clipboard now holds selected items (cloned)
    expect(DesignCore.Clipboard.Entities).toHaveLength(2);
    // BasePoint should be min x (-5), min y (20) across all points
    expect(DesignCore.Clipboard.BasePoint.x).toBe(-5);
    expect(DesignCore.Clipboard.BasePoint.y).toBe(20);
    // Scene entities should be removed
    expect(DesignCore.Scene.entities.count()).toBe(0);
  });

  test('clipboard entities are clones (mutating original does not change clipboard)', () => {
    const line = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(0, 0), new Point(10, 0)] });
    DesignCore.Scene.entities.add(line);
    DesignCore.Scene.selectionManager.addToSelectionSet(0);
    const originalClonePoints = DesignCore.Scene.selectionManager.selectedItems[0].points.map((p) => ({ x: p.x, y: p.y }));

    const tool = new Cutclip();
    tool.action();
    expect(DesignCore.Clipboard.Entities).toHaveLength(1);

    // Mutate original entity
    line.points[0].x = 999;
    // Clipboard should remain with old coordinates
    expect(DesignCore.Clipboard.Entities[0].points[0].x).toBe(originalClonePoints[0].x);
  });

  test('execute requests selection when none selected then calls executeCommand', async () => {
    const tool = new Cutclip();
    const requestSpy = jest.fn().mockResolvedValue(undefined);
    const execSpy = jest.fn();
    DesignCore.Scene.selectionManager.reset();

    // Mock inputManager methods
    DesignCore.Scene.inputManager.requestInput = requestSpy;
    DesignCore.Scene.inputManager.executeCommand = execSpy;

    await tool.execute();
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(execSpy).toHaveBeenCalledTimes(1);
  });

  test('execute skips requestInput when selection exists', async () => {
    // Prepare selection
    const ent = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(1, 1), new Point(2, 2)] });
    DesignCore.Scene.entities.add(ent);
    DesignCore.Scene.selectionManager.addToSelectionSet(0);
    expect(DesignCore.Scene.selectionManager.selectionSet.selectionSet.length).toBe(1);

    const tool = new Cutclip();
    const requestSpy = jest.fn().mockResolvedValue(undefined);
    const execSpy = jest.fn();
    DesignCore.Scene.inputManager.requestInput = requestSpy;
    DesignCore.Scene.inputManager.executeCommand = execSpy;

    await tool.execute();
    expect(requestSpy).not.toHaveBeenCalled();
    expect(execSpy).toHaveBeenCalledTimes(1);
  });
});


