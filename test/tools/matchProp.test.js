import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { MatchProp } from '../../core/tools/matchProp.js';
import { Input } from '../../core/lib/inputManager.js';
import { jest } from '@jest/globals';

const core = new Core();

// Add items to scene
DesignCore.Scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)], layer: 'test' });
DesignCore.Scene.addItem('Circle', { points: [new Point(10, 0), new Point(20, 0)] });
DesignCore.Scene.addItem('Polyline', { points: [new Point(10, 0), new Point(20, 0)] });
DesignCore.Scene.addItem('Arc', { points: [new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
DesignCore.Scene.addItem('Rectangle', { points: [new Point(10, 0), new Point(0, 10)] });
DesignCore.Scene.addItem('Text', { points: [new Point(10, 0), new Point(0, 10)], height: 10, rotation: 0, string: 'text test' });

test('Test MatchProp.execute requests source and targets and completes', async () => {
  const match = new MatchProp();

  // Use existing items added at top of file
  const src = core.scene.items[0];
  const tgt1 = core.scene.items[1];
  const tgt2 = core.scene.items[2];

  const im = core.scene.inputManager;

  const promptCalls = [];
  const reqSpy = jest
      .spyOn(im, 'requestInput')
  // First prompt: pick source entity (single selection)
      .mockImplementationOnce((po) => {
        promptCalls.push(po);
        return Promise.resolve(src);
      })
  // Second prompt: pick target entities (selection set)
      .mockImplementationOnce((po) => {
        promptCalls.push(po);
        return Promise.resolve([tgt1, tgt2]);
      });

  await expect(match.execute()).resolves.toBeUndefined();

  // Validate input sequence
  expect(reqSpy).toHaveBeenCalledTimes(2);
  expect(promptCalls[0].types).toContain(Input.Type.SINGLESELECTION);
  expect(promptCalls[1].types).toContain(Input.Type.SELECTIONSET);

  reqSpy.mockRestore();
});


test('Test MatchProp.register', () => {
  const command = MatchProp.register();
  expect(command.command).toBe('MatchProp');
  expect(command.shortcut).toBe('MA');
  expect(command.type).toBeUndefined();
});

test('Test MatchProp.action matches properties from source to targets', () => {
  const match = new MatchProp();

  // Use existing items added at top of file
  match.sourceIndex = 0; // Line with layer 'test'
  match.destinationSetIndices = [1, 2, 3, 4, 5]; // Circle, Polyline, Arc, Rectangle, Text

  match.action();

  // Validate that layer property was matched to targets
  for (let i = 0; i < match.destinationSetIndices.length; i++) {
    const tgt = DesignCore.Scene.items[match.destinationSetIndices[i]];
    expect(tgt.layer).toBe('test');
  }

  const circle = DesignCore.Scene.items[1];
  expect(circle.radius).toBe(10); // original radius

  const arc = DesignCore.Scene.items[3];
  expect(arc.radius).toBe(10); // original radius

  const text = DesignCore.Scene.items[5];
  expect(text.height).toBe(10); // original height
  expect(text.string).toBe('text test'); // original string
});
