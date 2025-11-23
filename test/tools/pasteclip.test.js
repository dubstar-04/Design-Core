import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Pasteclip } from '../../core/tools/pasteclip.js';
import { Copyclip } from '../../core/tools/copyclip.js';
import { DesignCore } from '../../core/designCore.js';
import { expect, jest } from '@jest/globals';

// Init core context
new Core();

describe('Pasteclip Tool', () => {
  beforeEach(() => {
    DesignCore.Scene.entities.clear();
    DesignCore.Scene.selectionManager.reset();
    DesignCore.Scene.tempEntities.clear();
    DesignCore.Clipboard.Entities = []; // also resets basePoint
  });

  test('execute throws / resets when clipboard invalid', async () => {
    const tool = new Pasteclip();
    const resetSpy = jest.spyOn(DesignCore.Scene.inputManager, 'reset').mockImplementation(() => {});
    const requestSpy = jest.spyOn(DesignCore.Scene.inputManager, 'requestInput').mockResolvedValue(new Point());
    await tool.execute();
    expect(resetSpy).toHaveBeenCalled();
    expect(requestSpy).not.toHaveBeenCalled();
  });

  test('execute requests base point and then calls executeCommand when clipboard valid', async () => {
    // Prepare clipboard via copyclip to ensure validity
    const line = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(10, 10), new Point(20, 20)] });
    DesignCore.Scene.entities.add(line);
    DesignCore.Scene.selectionManager.addToSelectionSet(0);
    new Copyclip().action();
    expect(DesignCore.Clipboard.isValid).toBe(true);

    const tool = new Pasteclip();
    const pt = new Point(100, 100);
    const requestSpy = jest.spyOn(DesignCore.Scene.inputManager, 'requestInput').mockResolvedValue(pt);
    const execSpy = jest.spyOn(DesignCore.Scene.inputManager, 'executeCommand').mockImplementation(() => {});
    await tool.execute();
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(execSpy).toHaveBeenCalledTimes(1);
    expect(tool.points[0]).toBe(pt);
  });

  test('preview creates temp entities offset from mouse', () => {
    // Setup clipboard
    const line = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(0, 0), new Point(10, 0)] });
    DesignCore.Scene.entities.add(line);
    DesignCore.Scene.selectionManager.addToSelectionSet(0);
    new Copyclip().action();
    const basePoint = DesignCore.Clipboard.BasePoint; // bottom-left of line

    // Mock mouse pointOnScene to return offset target
    const targetPoint = new Point(50, 50);
    DesignCore.Mouse.pointOnScene = () => targetPoint;

    const tool = new Pasteclip();
    tool.preview();
    expect(DesignCore.Scene.tempEntities.count()).toBeGreaterThan(0);
    const tempLine = DesignCore.Scene.tempEntities.get(0);
    const deltaX = targetPoint.x - basePoint.x;
    const deltaY = targetPoint.y - basePoint.y;
    expect(tempLine.points[0].x).toBe(line.points[0].x + deltaX);
    expect(tempLine.points[0].y).toBe(line.points[0].y + deltaY);
  });

  test('action pastes entities with correct offset', () => {
    const line = DesignCore.CommandManager.createNew('Circle', { layer: '0', points: [new Point(), new Point(5, 0)] });
    DesignCore.Scene.entities.add(line);
    DesignCore.Scene.selectionManager.addToSelectionSet(0);
    new Copyclip().action();

    const basePoint = DesignCore.Clipboard.BasePoint;
    expect(basePoint.x).toBe(-5);
    expect(basePoint.y).toBe(-5);

    const entityCount = DesignCore.Scene.entities.count();
    const tool = new Pasteclip();
    const insertion = new Point(10, 10);
    tool.points.push(insertion); // simulate execute collected base point
    tool.action();

    expect(DesignCore.Scene.entities.count()).toBe(entityCount + 1);


    const newEntity = DesignCore.Scene.entities.get(-1);
    expect(newEntity.points[0].x).toBe(15);
    expect(newEntity.points[0].y).toBe(15);

    // Ensure the in clipboard was not mutated
    const pasted = DesignCore.Clipboard.Entities[0];
    expect(pasted.points[0].x).toBe(0);
    expect(pasted.points[0].y).toBe(0);
  });
});
