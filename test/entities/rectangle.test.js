import { Rectangle } from '../../core/entities/rectangle.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

// ─── register ────────────────────────────────────────────────────────────────

test('Rectangle.register returns correct command object', () => {
  expect(Rectangle.register()).toEqual({ command: 'Rectangle', shortcut: 'REC', type: 'Entity' });
});
