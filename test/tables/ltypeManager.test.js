import { Core } from '../../core/core/core.js';

const core = new Core();
const lineTypeManager = core.ltypeManager;

test('Test LineTypeManager.getItems', () => {
  const layers = lineTypeManager.getOptionalStyles();
  expect(layers).toHaveLength(6);

  expect(layers[0]).toHaveProperty('name', 'CONTINUOUS');
  expect(layers[1]).toHaveProperty('name', 'CENTER');
});
