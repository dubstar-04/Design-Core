import { Core } from '../../core/core/core.js';
import { Clipboard } from '../../core/lib/clipboard.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { Logging } from '../../core/lib/logging.js';
import { jest } from '@jest/globals';

// Initialize core (sets DesignCore.Core)
new Core();

describe('Clipboard', () => {
  test('BasePoint setter invokes callback', () => {
    const cb = jest.fn();
    DesignCore.Clipboard.setClipboardCallbackFunction(cb);
    const p = new Point(10, 20);
    DesignCore.Clipboard.BasePoint = p;
    expect(DesignCore.Clipboard.BasePoint.x).toBe(10);
    expect(DesignCore.Clipboard.BasePoint.y).toBe(20);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('Entities setter sets basePoint to bounding box bottom-left and invokes callback', () => {
    const cb = jest.fn();
    DesignCore.Clipboard.setClipboardCallbackFunction(cb);
    const e1 = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(5, 5), new Point(15, 10)] });
    const e2 = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(-2, 50), new Point(3, 55)] });
    DesignCore.Clipboard.Entities = [e1, e2];
    // Bounding box min should be x=-2, y=5
    expect(DesignCore.Clipboard.BasePoint.x).toBe(-2);
    expect(DesignCore.Clipboard.BasePoint.y).toBe(5);
    expect(cb).toHaveBeenCalledTimes(1); // Entities setter triggers callback once
  });

  test('isValid false when empty, true after setting entities', () => {
    DesignCore.Clipboard.Entities = [];
    expect(DesignCore.Clipboard.isValid).toBe(false);
    const e = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(0, 0), new Point(1, 1)] });
    DesignCore.Clipboard.Entities = [e];
    expect(DesignCore.Clipboard.isValid).toBe(true);
  });

  test('stringify and parse roundtrip restores basePoint and entities points', () => {
    const e1 = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(10, 20), new Point(30, 40)] });
    const e2 = DesignCore.CommandManager.createNew('Line', { layer: '0', points: [new Point(-5, -6), new Point(-1, -2)] });
    DesignCore.Clipboard.Entities = [e1, e2];
    const originalBase = DesignCore.Clipboard.BasePoint;
    const json = DesignCore.Clipboard.stringify();

    // New clipboard instance to parse into (simulate external paste)
    const fresh = new Clipboard();
    fresh.parse(json);

    expect(fresh.BasePoint.x).toBe(originalBase.x);
    expect(fresh.BasePoint.y).toBe(originalBase.y);
    expect(fresh.Entities).toHaveLength(2);
    expect(fresh.Entities[0].points[0].x).toBe(10);
    expect(fresh.Entities[0].points[0].y).toBe(20);
    expect(fresh.Entities[1].points[0].x).toBe(-5);
    expect(fresh.Entities[1].points[0].y).toBe(-6);
  });

  test('parse invalid json logs error and leaves clipboard empty', () => {
    const errorSpy = jest.spyOn(Logging.instance, 'error').mockImplementation(() => {});
    const fresh = new Clipboard();
    fresh.parse('{"bad": true}');
    expect(errorSpy).toHaveBeenCalled();
    expect(fresh.Entities).toHaveLength(0);
    errorSpy.mockRestore();
  });
});
