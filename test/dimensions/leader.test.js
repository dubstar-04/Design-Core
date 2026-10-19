import { Leader } from '../../core/dimensions/leader.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Solid } from '../../core/entities/solid.js';
import { Text } from '../../core/entities/text.js';
import { Core } from '../../core/core/core.js';
import { DXF } from '../../core/lib/dxf/dxf.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { DesignCore } from '../../core/designCore.js';
import { Property } from '../../core/properties/property.js';
import { Utils } from '../../core/lib/utils.js';
import { EntityManager } from '../../core/lib/entityManager.js';
import { Block } from '../../core/tables/block.js';
import { withMockInput } from '../test-helpers/test-helpers.js';

let core;

beforeEach(() => {
  core = new Core();
});

const countOf = (entities, type) => entities.filter((e) => e instanceof type).length;

const groups = (dxfString) => {
  const lines = dxfString.split('\n');
  const result = [];
  for (let i = 0; i < lines.length - 1; i += 2) {
    result.push([lines[i].trim(), lines[i + 1].trim()]);
  }
  return result;
};

const expectValidHandles = (output) => {
  const g = groups(output);
  const handseedIndex = g.findIndex((pair) => pair[0] === '9' && pair[1] === '$HANDSEED') + 1;
  const handseed = parseInt(g[handseedIndex][1], 16);
  let type;
  const handles = g.filter(([code, value], index) => {
    if (code === '0') type = value;
    // DIMSTYLE uses code 5 for an arrow block name and code 105 for its handle.
    return index !== handseedIndex && (code === '105' || (code === '5' && type !== 'DIMSTYLE'));
  }).map((pair) => pair[1]);
  expect(new Set(handles).size).toBe(handles.length);
  for (const handle of handles) {
    expect(handseed).toBeGreaterThan(parseInt(handle, 16));
  }
};

test('Leader defaults', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)] });
  expect(leader.type).toBe('Leader');
  expect(leader.getProperty(Property.Names.STRING)).toBe('');
  expect(leader.getProperty(Property.Names.ARROWHEAD)).toBe(true);
  expect(leader.getProperty(Property.Names.HOOKLINE)).toBe(true);
  expect(leader.properties.has(Property.Names.TEXTOVERRIDE)).toBe(false);
});

test('Leader is a registered command', () => {
  expect(DesignCore.CommandManager.isCommand('Leader')).toBe(true);
  expect(DesignCore.CommandManager.getCommand('LE')).toBe('Leader');
});

test('Leader with fewer than two points has no geometry', () => {
  const leader = new Leader({ points: [new Point(0, 0)] });
  expect(leader.buildDimension()).toEqual([]);
});

test('Leader without annotation has path lines and an arrow only', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10), new Point(20, 10)] });
  const entities = leader.buildDimension();
  expect(countOf(entities, Line)).toBe(2);
  expect(countOf(entities, Solid)).toBe(1);
  expect(countOf(entities, Text)).toBe(0);
});

test('Leader arrow can be disabled', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], arrowHead: false });
  expect(countOf(leader.buildDimension(), Solid)).toBe(0);
});

test('Leader arrow is skipped when the first segment is shorter than the arrow', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(0.01, 0)] });
  expect(countOf(leader.buildDimension(), Solid)).toBe(0);
});

test('Leader arrow body extends along the first segment', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 0)] });
  const arrow = leader.buildDimension().find((e) => e instanceof Solid);
  expect(arrow.points[0].isSame(new Point(0, 0))).toBe(true);
  expect(arrow.points[1].x).toBeGreaterThan(0);
  expect(arrow.points[2].x).toBeGreaterThan(0);
});

test('Leader adds a hookline when the last segment is steeper than 15 degrees', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  const entities = leader.buildDimension();
  // one path segment and one hookline
  expect(countOf(entities, Line)).toBe(2);
  const arrowSize = leader.getDimensionStyle().getValue('DIMASZ');
  const hookline = entities.filter((e) => e instanceof Line)[1];
  expect(hookline.points[1].x).toBeCloseTo(10 + arrowSize);
  expect(hookline.points[1].y).toBeCloseTo(10);
});

test('Leader has no hookline when the last segment is nearly horizontal', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 1)], string: 'Note' });
  expect(countOf(leader.buildDimension(), Line)).toBe(1);
});

test('Leader has no hookline when disabled or without annotation', () => {
  const disabled = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note', hookline: false });
  expect(countOf(disabled.buildDimension(), Line)).toBe(1);
  const noText = new Leader({ points: [new Point(0, 0), new Point(10, 10)] });
  expect(countOf(noText.buildDimension(), Line)).toBe(1);
});

test('Leader text is left aligned when heading right', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  const text = leader.buildDimension().find((e) => e instanceof Text);
  expect(text.getProperty(Property.Names.STRING)).toBe('Note');
  expect(text.getProperty(Property.Names.HORIZONTALALIGNMENT)).toBe(0);
  expect(text.points[0].x).toBeGreaterThan(10);
});

test('Leader text is right aligned when heading left', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(-10, 10)], string: 'Note' });
  const text = leader.buildDimension().find((e) => e instanceof Text);
  expect(text.getProperty(Property.Names.HORIZONTALALIGNMENT)).toBe(2);
  expect(text.points[0].x).toBeLessThan(-10);
});

test('Leader geometry follows the dimension style', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  const before = leader.buildDimension().filter((e) => e instanceof Line)[1].points[1].x;
  const style = DesignCore.DimStyleManager.getItemByName('STANDARD');
  const original = style.DIMASZ;
  style.DIMASZ = original * 2;
  const after = leader.buildDimension().filter((e) => e instanceof Line)[1].points[1].x;
  style.DIMASZ = original;
  expect(after).toBeGreaterThan(before);
});

test('Leader grips - one per vertex, moving only that vertex', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10), new Point(20, 10)] });
  const grips = leader.getGrips();
  expect(grips.length).toBe(3);
  const moved = grips[1].apply(new Point(5, 5));
  expect(moved[0].isSame(new Point(0, 0))).toBe(true);
  expect(moved[1].isSame(new Point(5, 5))).toBe(true);
  expect(moved[2].isSame(new Point(20, 10))).toBe(true);
});

test('Leader setProperty points rebuilds the geometry', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)] });
  leader.setProperty(Property.Names.POINTS, [new Point(0, 0), new Point(10, 10), new Point(20, 10)]);
  expect(countOf(leader.block.entities, Line)).toBe(2);
});

test('Leader.execute with annotation', async () => {
  const leader = new Leader();
  await withMockInput(DesignCore.Scene, [new Point(0, 0), new Point(10, 10), 'Annotation', 'Note'], async () => {
    await leader.execute();
  });
  expect(leader.points.length).toBe(2);
  expect(leader.getProperty(Property.Names.STRING)).toBe('Note');
});

test('Leader.execute with no annotation and undo', async () => {
  const leader = new Leader();
  await withMockInput(DesignCore.Scene, [new Point(0, 0), new Point(10, 10), new Point(20, 10), 'Undo', 'None'], async () => {
    await leader.execute();
  });
  expect(leader.points.length).toBe(2);
  expect(leader.getProperty(Property.Names.STRING)).toBe('');
});

test('Leader dxf writes a LEADER and a companion MTEXT', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  DesignCore.Scene.entities.add(leader);

  const file = new DXFFile('R2018');
  leader.dxf(file);
  const g = groups(file.contents);

  expect(g[0]).toEqual(['0', 'LEADER']);
  expect(g).toContainEqual(['76', '2']);
  expect(g).toContainEqual(['73', '0']);
  expect(g).toContainEqual(['340', leader.textHandle]);
  const textIndex = g.findIndex((pair) => pair[0] === '0' && pair[1] === 'MTEXT');
  expect(textIndex).toBeGreaterThan(0);
  expect(g[textIndex + 1]).toEqual(['5', leader.textHandle]);
  expect(g.slice(textIndex + 2, textIndex + 5)).toEqual([['102', '{ACAD_REACTORS'], ['330', leader.getProperty('handle')], ['102', '}']]);
  expect(g).toContainEqual(['1', 'Note']);
});

test('Leader assigns its annotation handle on add, not during construction or export', () => {
  const seed = DesignCore.HandleManager.handseed;
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  leader.buildDimension();
  leader.setProperty(Property.Names.STRING, 'Preview note');
  expect(leader.textHandle).toBeUndefined();
  expect(DesignCore.HandleManager.handseed).toBe(seed);

  new EntityManager(false).add(leader);
  expect(leader.textHandle).toBeUndefined();

  DesignCore.Scene.entities.add(leader);
  expect(leader.textHandle).toBeDefined();
  const assignedSeed = DesignCore.HandleManager.handseed;
  const output = core.saveFile('R2018');
  expect(DesignCore.HandleManager.handseed).toBe(assignedSeed);
  expect(core.saveFile('R2018')).toBe(output);
  expectValidHandles(output);
});

test('Leader assigns a handle when annotation is added later and keeps it when text is cleared', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)] });
  DesignCore.Scene.entities.add(leader);
  expect(leader.textHandle).toBeUndefined();

  leader.setProperty(Property.Names.STRING, 'Note');
  const handle = leader.textHandle;
  expect(handle).toBeDefined();
  expectValidHandles(core.saveFile('R2018'));

  leader.setProperty(Property.Names.STRING, '');
  leader.setProperty(Property.Names.STRING, 'Updated');
  expect(leader.textHandle).toBe(handle);
});

test('Leader copies get distinct annotation handles without changing the original', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  DesignCore.Scene.entities.add(leader);
  const handle = leader.textHandle;
  const copy = Utils.cloneObject(leader);
  expect(copy.textHandle).toBeUndefined();
  DesignCore.Scene.entities.add(copy);

  expect(leader.textHandle).toBe(handle);
  expect(copy.textHandle).toBeDefined();
  expect(copy.textHandle).not.toBe(handle);
  expect(copy.getProperty(Property.Names.HANDLE)).not.toBe(leader.getProperty(Property.Names.HANDLE));
  expectValidHandles(core.saveFile('R2018'));
});

test('Leader delete and undo preserve the annotation handle without registering it twice', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  DesignCore.Scene.entities.add(leader);
  const handle = leader.textHandle;
  const seed = DesignCore.HandleManager.handseed;
  const size = DesignCore.HandleManager.usedHandles.size;

  DesignCore.Scene.entities.remove(0);
  expect(DesignCore.HandleManager.usedHandles.has(handle)).toBe(true);
  DesignCore.Scene.entities.add(leader);
  expect(leader.textHandle).toBe(handle);
  expect(DesignCore.HandleManager.handseed).toBe(seed);
  expect(DesignCore.HandleManager.usedHandles.size).toBe(size);
  expectValidHandles(core.saveFile('R2018'));
});

test('Block creation assigns a fresh annotation handle to its copied leader', async () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  DesignCore.Scene.entities.add(leader);
  const handle = leader.textHandle;
  DesignCore.Scene.selectionManager.addToSelectionSet(0);

  await withMockInput(DesignCore.Scene, ['LeaderBlock', new Point()], async () => {
    await new Block().execute();
  });

  const block = DesignCore.Scene.blockManager.getItemByName('LeaderBlock');
  expect(block.entities).toHaveLength(1);
  const child = block.entities[0];
  expect(child).toBeInstanceOf(Leader);
  expect(child.textHandle).toBeDefined();
  expect(child.textHandle).not.toBe(handle);
  expectValidHandles(core.saveFile('R2018'));
});

test('Block manager assigns annotation handles before export and block annotations round trip', () => {
  const leader = new Leader({ handle: 'AA', points: [new Point(0, 0), new Point(10, 10)], string: 'Block note' });
  DesignCore.HandleManager.checkHandle('AA');
  DesignCore.Scene.blockManager.addItem({ name: 'LeaderBlock', entities: [leader] });
  expect(leader.textHandle).toBeDefined();

  const output = core.saveFile('R2018');
  expectValidHandles(output);
  new Core();
  new DXF().loadDxf(output);

  const block = DesignCore.Scene.blockManager.getItemByName('LeaderBlock');
  expect(block.entities).toHaveLength(1);
  expect(block.entities[0]).toBeInstanceOf(Leader);
  expect(block.entities[0].textHandle).toBe(leader.textHandle);
  expect(block.entities[0].getProperty(Property.Names.STRING)).toBe('Block note');
  expect(DesignCore.Core.saveFile('R2018')).toBe(output);
});

test('Leader dxf without annotation writes no TEXT and annotation type 3', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)] });
  DesignCore.Scene.entities.add(leader);

  const file = new DXFFile('R2018');
  leader.dxf(file);
  const g = groups(file.contents);

  expect(g).toContainEqual(['73', '3']);
  expect(g.some((pair) => pair[0] === '340')).toBe(false);
  expect(g.some((pair) => pair[0] === '0' && pair[1] === 'MTEXT')).toBe(false);
});

test('Leader dxf is not written before R13', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  const file = new DXFFile('R12');
  leader.dxf(file);
  expect(file.contents).toBe('');
});

test('Leader round trips through dxf save and load', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10), new Point(20, 12)], string: 'Note', arrowHead: false });
  DesignCore.Scene.entities.add(leader);
  const plain = new Leader({ points: [new Point(50, 50), new Point(60, 40)] });
  DesignCore.Scene.entities.add(plain);

  const output = core.saveFile('R2018');

  const loadCore = new Core();
  new DXF().loadDxf(output);

  // the annotation TEXT is owned by the leader and must not load as a separate entity
  expect(DesignCore.Scene.entities.count()).toBe(2);
  const [first, second] = DesignCore.Scene.entities.getAll();
  expect(first).toBeInstanceOf(Leader);
  expect(first.points.length).toBe(3);
  expect(first.points[2].isSame(new Point(20, 12))).toBe(true);
  expect(first.getProperty(Property.Names.STRING)).toBe('Note');
  expect(first.getProperty(Property.Names.ARROWHEAD)).toBe(false);
  expect(second).toBeInstanceOf(Leader);
  expect(second.getProperty(Property.Names.STRING)).toBe('');
  expect(second.getProperty(Property.Names.ARROWHEAD)).toBe(true);

  // saving again keeps the file stable
  const again = loadCore.saveFile('R2018');
  expect(again).toBe(output);
});

test('Leader save has unique handles and a handseed beyond the annotation handle', () => {
  const leader = new Leader({ points: [new Point(0, 0), new Point(10, 10)], string: 'Note' });
  DesignCore.Scene.entities.add(leader);

  const output = core.saveFile('R2018');
  const g = groups(output);
  const handseedIndex = g.findIndex((pair) => pair[0] === '9' && pair[1] === '$HANDSEED');
  const handseed = parseInt(g[handseedIndex + 1][1], 16);
  expect(handseed).toBeGreaterThan(parseInt(leader.textHandle, 16));
  expect(handseed).toBeGreaterThan(parseInt(leader.getProperty(Property.Names.HANDLE), 16));
  expectValidHandles(output);
});

describe('DXF leader reference resolution', () => {
  const loadEntities = (entities) => {
    const dxf = new DXF();
    return dxf.linkReferences(entities);
  };

  test('missing annotation gives empty text', () => {
    const leader = { 0: 'LEADER', 340: 'AAAA' };
    const result = loadEntities([leader]);
    expect(result.length).toBe(1);
    expect(result[0].annotation).toBe('');
    expect(result[0][340]).toBe('AAAA');
  });

  test('leader without 340 gives empty text', () => {
    const leader = { 0: 'LEADER' };
    const result = loadEntities([leader]);
    expect(result[0].annotation).toBe('');
  });

  test('text referenced by two leaders is merged into both and consumed once', () => {
    const text = { 0: 'TEXT', 5: 'AA', 1: 'Shared' };
    const one = { 0: 'LEADER', 340: 'AA' };
    const two = { 0: 'LEADER', 340: 'AA' };
    const other = { 0: 'TEXT', 5: 'BB', 1: 'Free' };
    const size = DesignCore.HandleManager.usedHandles.size;
    const result = loadEntities([text, one, two, other]);
    expect(result).toHaveLength(3);
    expect(result[0].annotation).toBe('Shared');
    expect(result[1].annotation).toBe('Shared');
    expect(result[2][5]).toBe('BB');
    expect(DesignCore.HandleManager.usedHandles.size).toBe(size + 1);
    expect(DesignCore.HandleManager.usedHandles.has('AA')).toBe(true);
    expect(one).not.toHaveProperty('annotation');
    expect(text[1]).toBe('Shared');
  });

  test.each([
    ['TEXT', true],
    ['TEXT', false],
    ['MTEXT', true],
    ['MTEXT', false],
  ])('%s annotation resolves with text first: %s', (type, textFirst) => {
    const text = { 0: type, 5: 'AA', 1: type === 'MTEXT' ? '{\\H2;Note}\\PNext' : 'Note' };
    const leader = { 0: 'LEADER', 5: 'AB', 340: 'aa', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] };
    const records = textFirst ? [text, leader] : [leader, text];
    const result = loadEntities(records);
    expect(result).toHaveLength(1);
    expect(result[0].annotation).toBe(type === 'MTEXT' ? '{Note} Next' : 'Note');
    expect(result[0].points).toBe(leader.points);
    expect(result[0].points[0]).not.toBeInstanceOf(Point);

    const dxf = new DXF();
    dxf.reader = { entities: records };
    // Linking registers consumed handles; use a fresh core for the actual load.
    new Core();
    dxf.loadEntities();
    expect(DesignCore.Scene.entities.count()).toBe(1);
    const loaded = DesignCore.Scene.entities.get(0);
    expect(loaded).toBeInstanceOf(Leader);
    expect(loaded.getProperty(Property.Names.STRING)).toBe(result[0].annotation);
    expectValidHandles(DesignCore.Core.saveFile('R2018'));
  });

  test('unsupported reference types are not consumed', () => {
    const line = { 0: 'LINE', 5: 'AA', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };
    const leader = { 0: 'LEADER', 340: 'AA' };
    const result = loadEntities([leader, line]);
    expect(result).toHaveLength(2);
    expect(result[0].annotation).toBe('');
    expect(result[1][0]).toBe('LINE');
    expect(DesignCore.HandleManager.usedHandles.has('AA')).toBe(false);
  });

  test('normalisation without an import context still accepts canonical annotation data', () => {
    const data = Leader.fromDxf({ annotation: 'Note', 340: 'AA', 71: 0, 75: 1 });
    expect(data.string).toBe('Note');
    expect(data.textHandle).toBe('AA');
    expect(data.arrowHead).toBe(false);
    expect(data.hookline).toBe(true);
  });

  test.each([true, false])('block annotation resolves with text first: %s', (textFirst) => {
    const text = { 0: 'MTEXT', 5: 'AA', 1: 'Block note' };
    const leader = { 0: 'LEADER', 5: 'AB', 340: 'AA', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] };
    const children = textFirst ? [text, leader] : [leader, text];
    const dxf = new DXF();
    dxf.reader = { blocks: [{ 0: 'BLOCK', 2: 'LeaderBlock', children }] };
    dxf.loadBlocks();

    const block = DesignCore.Scene.blockManager.getItemByName('LeaderBlock');
    expect(block.entities).toHaveLength(1);
    expect(block.entities[0]).toBeInstanceOf(Leader);
    expect(block.entities[0].getProperty(Property.Names.STRING)).toBe('Block note');
    expect(block.entities[0].textHandle).toBe('AA');
    expectValidHandles(core.saveFile('R2018'));
  });
});
