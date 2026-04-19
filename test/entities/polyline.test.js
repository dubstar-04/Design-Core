import { Polyline } from '../../core/entities/polyline.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

// ─── register ────────────────────────────────────────────────────────────────

test('Polyline.register returns correct command object', () => {
  expect(Polyline.register()).toEqual({ command: 'Polyline', shortcut: 'PL', type: 'Entity' });
});
