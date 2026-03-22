import { Core } from '../../core/core/core.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';

const core = new Core();
const vportManager = core.vportManager;

test('Test VPortManager.getItems', () => {
  const items = vportManager.getItems();
  expect(items).toHaveLength(1);
  expect(items[0]).toHaveProperty('name', '*ACTIVE');
});

test('Test VPortManager.itemCount', () => {
  expect(vportManager.itemCount()).toBe(1);
});

test('Test VPortManager.dxf', () => {
  const file = new DXFFile();
  vportManager.dxf(file);

  const lines = file.contents.split('\n');

  // Check TABLE header
  expect(lines[0]).toBe('0');
  expect(lines[1]).toBe('TABLE');
  expect(lines[2]).toBe('2');
  expect(lines[3]).toBe('VPORT');
  expect(lines[4]).toBe('5');
  expect(lines[5]).toBe('20');

  // Check contains VPORT entry
  expect(file.contents).toContain('0\nVPORT\n');
  expect(file.contents).toContain('2\n*ACTIVE\n');

  // Check ends with ENDTAB
  expect(file.contents).toContain('0\nENDTAB\n');
});
