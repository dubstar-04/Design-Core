import { jest } from '@jest/globals';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { MText } from '../../core/entities/mtext.js';
import { Text } from '../../core/entities/text.js';
import { Point } from '../../core/entities/point.js';
import { Hatch } from '../../core/entities/hatch.js';
import { DXF } from '../../core/lib/dxf/dxf.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { Logging } from '../../core/lib/logging.js';
import { Utils } from '../../core/lib/utils.js';
import { Input } from '../../core/lib/input.js';
import { SvgRenderer } from '../../core/lib/renderers/svgRenderer.js';
import { PdfRenderer } from '../../core/lib/renderers/pdfRenderer.js';
import { withMockInput } from '../test-helpers/test-helpers.js';
import { Scale } from '../../core/tools/scale.js';

let core;
beforeEach(() => {
  core = new Core();
});
afterEach(() => jest.restoreAllMocks());

const makeText = (data = {}) => new MText({ points: [new Point(10, 20)], height: 3, string: 'First\\PSecond', ...data });
const groups = (contents) => {
  const lines = contents.split('\n');
  const result = [];
  for (let i = 0; i < lines.length - 1; i += 2) result.push([lines[i].trim(), lines[i + 1]]);
  return result;
};

test('MText is independently registered without leader-specific handling', () => {
  expect(MText.register()).toEqual({ command: 'MText', shortcut: 'MT' });
  expect(DesignCore.CommandManager.getCommand('MT')).toBe('MText');
  const text = DesignCore.CommandManager.createNew('MTEXT', { points: [new Point()] });
  expect(text).toBeInstanceOf(MText);
  expect(text).toBeInstanceOf(Text);
  expect(text.type).toBe('MText');
  expect(text.properties.list()).toEqual(expect.arrayContaining(['string', 'height', 'width', 'attachmentPoint', 'lineSpacingFactor', 'lineSpacingStyle']));
  expect(text.properties.list()).not.toContain('backwards');
  expect(text.properties.list()).not.toContain('verticalAlignment');
});

test.each([
  ['A\\PB', 'A\nB'],
  ['A\n\nB', 'A\n\nB'],
  ['A\r\nB', 'A\nB'],
  ['\\\\P \\{literal\\}', '\\P {literal}'],
  ['A\\~B', 'A\u00a0B'],
  ['\\U+00B0 %%d %%p %%c', '\u00b0 \u00b0 \u00b1 \u00d8'],
  ['{\\fArial;A}\\H2x;B\\C1;C\\Lunder\\l', 'ABCunder'],
  ['\\S1#2; \\S3^4;', '1/2 3/4'],
  ['\\unknown', '\\unknown'],
  ['Last\\', 'Last\\'],
])('MText plain display decodes %s without changing stored content', (string, expected) => {
  jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  const text = makeText({ string });
  expect(text.getPlainText()).toBe(expected);
  expect(text.getProperty('string')).toBe(string);
});

test('formatting warnings occur on content changes, not every layout or paint', () => {
  const warn = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  const text = makeText({ string: '{\\C1;Note}' });
  expect(warn).toHaveBeenCalledTimes(1);
  const renderer = { measureText: (string) => ({ width: string.length }), drawText: jest.fn() };
  text.draw(renderer);
  text.draw(renderer);
  text.boundingBox();
  expect(warn).toHaveBeenCalledTimes(1);
  text.setProperty('string', '{\\H2x;Updated}');
  expect(warn).toHaveBeenCalledTimes(2);
});

test('MText wraps words and long tokens at the actual measured threshold', () => {
  const text = makeText({ string: 'AA BB CCCCC', width: 5 });
  const layout = text.getLayout((string) => string.length);
  expect(layout.lines.map((line) => line.text)).toEqual(['AA BB', 'CCCCC']);
  expect(layout.lines.every((line) => line.width <= 5)).toBe(true);
  text.setProperty('width', 4);
  const narrower = text.getLayout((string) => string.length);
  expect(narrower.lines.map((line) => line.text)).toEqual(['AA', 'BB', 'CCCC', 'C']);
  expect(narrower.lines.every((line) => line.width <= 4)).toBe(true);
});

test('MText preserves blank paragraphs, disables wrapping at width zero and handles oversized glyphs', () => {
  const text = makeText({ string: 'ABCDE\\P\\PZ', width: 0 });
  expect(text.getLayout((string) => string.length).lines.map((line) => line.text)).toEqual(['ABCDE', '', 'Z']);
  text.setProperty('width', 0.1);
  expect(text.getLayout((string) => string.length).lines.map((line) => line.text)).toEqual(['A', 'B', 'C', 'D', 'E', '', 'Z']);
});

test('layout cache updates with text, width, height, spacing and font changes', () => {
  const text = makeText({ width: 20 });
  const first = text.getLayout();
  expect(text.getLayout()).toBe(first);
  text.setProperty('string', 'One');
  expect(text.getLayout()).not.toBe(first);
  text.setProperty('height', 6);
  expect(text.getBoundingRect().height).toBe(6);
  text.setProperty('string', 'One\\PTwo');
  text.setProperty('lineSpacingFactor', 2);
  expect(text.getBoundingRect().height).toBeCloseTo(26);
  const beforeFont = text.getLayout();
  DesignCore.StyleManager.getItemByName('STANDARD').font = 'Changed font';
  expect(text.getLayout()).not.toBe(beforeFont);
});

test.each(Array.from({ length: 9 }, (_, index) => index + 1))('attachment %s positions the complete multiline frame', (attachmentPoint) => {
  const text = makeText({ attachmentPoint, width: 12 });
  const layout = text.getLayout((string) => string.length);
  const column = (attachmentPoint - 1) % 3;
  const row = Math.floor((attachmentPoint - 1) / 3);
  const [bottomLeft, , topRight] = text.getTextFrameCorners();
  expect(bottomLeft.x).toBeCloseTo(10 - column * layout.width / 2);
  expect(bottomLeft.y).toBeCloseTo(20 - (2 - row) * layout.height / 2);
  expect(topRight.x - bottomLeft.x).toBeCloseTo(layout.width);
  expect(topRight.y - bottomLeft.y).toBeCloseTo(layout.height);
  const lines = text.toCharacters();
  expect(lines[0].x).toBeCloseTo(bottomLeft.x + (layout.width - 5) * column / 2);
  expect(lines[0].y - lines[1].y).toBeCloseTo(5);
});

test('rotation, bounds, selection and snapping work before the first draw', () => {
  const text = makeText({ width: 12, rotation: 90 });
  const layout = text.getLayout();
  const corners = text.getTextFrameCorners();
  const bounds = text.boundingBox();
  expect(bounds.xMin).toBeCloseTo(10);
  expect(bounds.xMax).toBeCloseTo(10 + layout.height);
  expect(bounds.yMin).toBeCloseTo(20);
  expect(bounds.yMax).toBeCloseTo(32);
  const middle = corners[0].midPoint(corners[2]);
  expect(text.closestPoint(middle)[1]).toBe(0);
  expect(text.within({ min: new Point(0, 0), max: new Point(100, 100) })).toBe(true);
  expect(text.touched({ min: new Point(9, 19), max: new Point(12, 25) })).toBe(true);
  expect(text.snaps()[0].snapPoint.isSame(new Point(10, 20))).toBe(true);
  expect(text.toCharacters()[0].rotation).toBeCloseTo(Math.PI / 2);
});

test('move, scale, rotation and cloned copies keep independent geometry and layout', () => {
  const text = makeText({ width: 12, rotation: 30 });
  text.setProperty('points', text.points.map((point) => point.add(new Point(4, 5))));
  expect(text.getProperty('height')).toBeCloseTo(3);
  expect(text.getProperty('width')).toBeCloseTo(12);
  text.setProperty('points', text.points.map((point) => point.scaleFrom(new Point(), 2)));
  expect(text.getProperty('height')).toBeCloseTo(6);
  expect(text.getProperty('width')).toBeCloseTo(24);
  text.setProperty('height', 9);
  expect(text.points[0].distance(text.points[1])).toBeCloseTo(9);
  expect(text.getRotation()).toBeCloseTo(30);
  DesignCore.Scene.entities.add(text);
  const copy = Utils.cloneObject(text);
  copy.setProperty('string', 'Copy');
  DesignCore.Scene.entities.add(copy);
  expect(text.getProperty('string')).toBe('First\\PSecond');
  expect(copy.getProperty('handle')).not.toBe(text.getProperty('handle'));
});

test.each([
  ['height', 0], ['height', -1], ['width', -1], ['width', Infinity],
  ['attachmentPoint', 0], ['attachmentPoint', 10], ['attachmentPoint', 1.5],
  ['lineSpacingFactor', 0.24], ['lineSpacingFactor', 4.01], ['lineSpacingStyle', 3],
  ['rotation', NaN], ['string', null],
])('invalid %s value %s is rejected explicitly', (property, value) => {
  const text = makeText();
  const previous = text.getProperty(property);
  expect(() => text.setProperty(property, value)).toThrow();
  expect(text.getProperty(property)).toEqual(previous);
});

test('invalid constructor properties fail explicitly', () => {
  expect(() => makeText({ width: -1 })).toThrow();
  expect(() => makeText({ height: 0 })).toThrow();
  expect(() => makeText({ attachmentPoint: 10 })).toThrow();
  expect(() => makeText({ rotation: NaN })).toThrow();
});

test('the Scale command and undo/redo restore both MTEXT dimensions and geometry', () => {
  const text = makeText({ width: 12, rotation: 30 });
  DesignCore.Scene.entities.add(text);
  DesignCore.Scene.selectionManager.addToSelectionSet(0);
  const scale = new Scale();
  scale.points = [new Point()];
  scale.scaleFactor = 2;
  scale.action();
  expect(text.getProperty('height')).toBeCloseTo(6);
  expect(text.getProperty('width')).toBeCloseTo(24);
  DesignCore.Scene.undo();
  expect(text.getProperty('height')).toBeCloseTo(3);
  expect(text.getProperty('width')).toBeCloseTo(12);
  expect(text.points[0].isSame(new Point(10, 20))).toBe(true);
  DesignCore.Scene.redo();
  expect(text.getProperty('height')).toBeCloseTo(6);
  expect(text.getProperty('width')).toBeCloseTo(24);
});

test.each([249, 250, 251, 500, 751])('DXF preserves %s characters using continuation groups', (length) => {
  const text = makeText({ string: 'x'.repeat(length) });
  DesignCore.Scene.entities.add(text);
  const file = new DXFFile('R2018');
  text.dxf(file);
  const contentGroups = groups(file.contents).filter(([code]) => code === '3' || code === '1');
  expect(contentGroups.at(-1)[0]).toBe('1');
  expect(contentGroups.at(-1)[1].length).toBeLessThan(250);
  expect(contentGroups.every(([, value]) => value.length <= 250)).toBe(true);
  expect(contentGroups.map(([, value]) => value).join('')).toBe('x'.repeat(length));
  expect(groups(file.contents)).toContainEqual(['100', 'AcDbMText']);
  expect(groups(file.contents)).toContainEqual(['71', '1']);
});

test('DXF newlines and inline formatting survive save/load with style, colours and rotation', () => {
  jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  const string = '{\\fArial;Formatted}\\P\\C1;Red ' + 'x'.repeat(500);
  DesignCore.StyleManager.addItem({ name: 'CUSTOM', font: 'Arial' });
  const text = makeText({ string, width: 30, attachmentPoint: 6, rotation: 45, lineSpacingFactor: 1.5,
    lineSpacingStyle: 2, styleName: 'CUSTOM', colour: { r: 12, g: 34, b: 56 } });
  DesignCore.Scene.entities.add(text);
  const output = core.saveFile('R2018');
  const loadCore = new Core();
  new DXF().loadDxf(output);
  expect(DesignCore.Scene.entities.count()).toBe(1);
  const loaded = DesignCore.Scene.entities.get(0);
  expect(loaded).toBeInstanceOf(MText);
  for (const property of ['string', 'width', 'height', 'attachmentPoint', 'lineSpacingFactor', 'lineSpacingStyle', 'styleName']) {
    expect(loaded.getProperty(property)).toBe(text.getProperty(property));
  }
  expect(loaded.getRotation()).toBeCloseTo(45);
  expect(loaded.getColour()).toEqual({ r: 12, g: 34, b: 56 });
  expect(loadCore.saveFile('R2018')).toBe(output);
  text.setProperty('string', 'A\nB');
  const file = new DXFFile();
  text.dxf(file);
  expect(groups(file.contents)).toContainEqual(['1', 'A\\PB']);
});

test('DXF continuation chunks do not split Unicode surrogate pairs', () => {
  const string = 'x'.repeat(249) + '\ud83d\ude00' + 'y'.repeat(300);
  const text = makeText({ string });
  DesignCore.Scene.entities.add(text);
  const file = new DXFFile();
  text.dxf(file);
  const contentGroups = groups(file.contents).filter(([code]) => code === '3' || code === '1');
  for (const [, chunk] of contentGroups) {
    expect(chunk).not.toMatch(/[\ud800-\udbff]$/u);
    expect(chunk).not.toMatch(/^[\udc00-\udfff]/u);
  }
  expect(contentGroups.map(([, value]) => value).join('')).toBe(string);
});

test('hand-written DXF imports MTEXT chunks, orientation and attachment without TEXT semantics', () => {
  const dxf = new DXF();
  dxf.read(`0
SECTION
2
ENTITIES
0
MTEXT
5
AA
100
AcDbEntity
8
0
100
AcDbMText
10
20
20
30
30
0
40
4
41
20
71
9
72
1
3
 First\\P
1
Second 
7
STANDARD
11
0
21
1
31
0
73
2
44
1.5
0
ENDSEC
0
EOF
`);
  dxf.loadEntities();
  const text = DesignCore.Scene.entities.get(0);
  expect(text).toBeInstanceOf(MText);
  expect(text.getProperty('string')).toBe(' First\\PSecond ');
  expect(text.getRotation()).toBeCloseTo(90);
  expect(text.getProperty('attachmentPoint')).toBe(9);
  expect(text.getProperty('lineSpacingStyle')).toBe(2);
  expect(text.getProperty('lineSpacingFactor')).toBe(1.5);
  expect(text.getBackwards()).toBe(false);
  expect(text.getUpsideDown()).toBe(false);
});

test('DXF direction vectors are not mistaken for alignment positions, and angles are radians', () => {
  const fromAngle = DesignCore.CommandManager.createNew('MTEXT', {
    50: Math.PI / 2, points: [new Point(20, 30)],
  });
  expect(fromAngle.points[0].isSame(new Point(20, 30))).toBe(true);
  expect(fromAngle.getRotation()).toBeCloseTo(90);
  const fromVector = DesignCore.CommandManager.createNew('MTEXT', {
    71: 9, 73: 2, points: [new Point(20, 30, 0, 10), new Point(0, -1, 0, 11)],
  });
  expect(fromVector.points[0].isSame(new Point(20, 30))).toBe(true);
  expect(fromVector.getRotation()).toBeCloseTo(270);
  expect(fromVector.getBackwards()).toBe(false);
  expect(fromVector.getUpsideDown()).toBe(false);
});

test.each(['ENTITIES', 'BLOCKS'])('AutoCAD embedded MTEXT imports in %s without overwriting entity properties', (sectionName) => {
  const warn = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  const record = `0
MTEXT
5
AA
100
AcDbEntity
8
0
100
AcDbMText
10
20
20
30
30
0
40
2.5
41
40
71
1
72
5
1
First\\PSecond\\PThird
73
1
44
1.0
101
Embedded Object
70
1
10
0
20
1
30
0
11
1000
21
1000
31
0
40
40
41
0
42
12
43
11
71
2
72
1
44
40
45
1
73
0
74
0
`;
  const body = sectionName === 'BLOCKS' ? `0\nBLOCK\n2\nAUTOCAD_TEXT\n${record}0\nENDBLK\n` : record;
  const dxf = new DXF();
  dxf.read(`0\nSECTION\n2\n${sectionName}\n${body}0\nENDSEC\n0\nEOF\n`);
  if (sectionName === 'BLOCKS') dxf.loadBlocks();
  else dxf.loadEntities();
  const text = sectionName === 'BLOCKS' ?
    DesignCore.Scene.blockManager.getItemByName('AUTOCAD_TEXT').entities[0] : DesignCore.Scene.entities.get(0);
  expect(text).toBeInstanceOf(MText);
  expect(text.getProperty('height')).toBe(2.5);
  expect(text.getProperty('width')).toBe(40);
  expect(text.getProperty('attachmentPoint')).toBe(1);
  expect(text.getProperty('lineSpacingFactor')).toBe(1);
  expect(text.getProperty('lineSpacingStyle')).toBe(1);
  expect(text.points[0].isSame(new Point(20, 30))).toBe(true);
  expect(text.getRotation()).toBeCloseTo(90);
  expect(text.toCharacters().map((line) => line.char)).toEqual(['First', 'Second', 'Third']);
  expect(warn).toHaveBeenCalledTimes(1);
  const output = core.saveFile('R2018');
  new Core();
  new DXF().loadDxf(output);
  const loaded = sectionName === 'BLOCKS' ?
    DesignCore.Scene.blockManager.getItemByName('AUTOCAD_TEXT').entities[0] : DesignCore.Scene.entities.get(0);
  expect(loaded.getProperty('string')).toBe('First\\PSecond\\PThird');
  expect(loaded.getProperty('height')).toBe(2.5);
  expect(loaded.getRotation()).toBeCloseTo(90);
});

test.each([
  [{ points: [new Point(20, 30, 0, 10), new Point(1, 0, 0, 11)] }, 0],
  [{ 50: Math.PI / 4, points: [new Point(20, 30, 0, 10)] }, 45],
  [{ rotation: 30, points: [new Point(20, 30, 0, 10)] }, 30],
])('drawing direction by style is valid and explicit orientation takes precedence over embedded data: %p', (orientation, expected) => {
  const warn = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  const text = DesignCore.CommandManager.createNew('MTEXT', {
    72: 5,
    ...orientation,
    embeddedObjects: [{ 101: 'Embedded Object', points: [{ x: 0, y: 1, sequence: 10 }] }],
  });
  expect(text.getRotation()).toBeCloseTo(expected);
  expect(warn).not.toHaveBeenCalled();
});

test('DXF zero direction is rejected and ambiguous rotation or unsupported layout is reported', () => {
  expect(() => DesignCore.CommandManager.createNew('MTEXT', { points: [new Point(), new Point(0, 0, 0, 11)] })).toThrow();
  const warn = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  DesignCore.CommandManager.createNew('MTEXT', {
    50: 1, 72: 3, 90: 1, points: [new Point(), new Point(1, 0, 0, 11)],
  });
  expect(warn).toHaveBeenCalledTimes(2);
});

test('R13 export is valid and R12 export fails instead of silently dropping MTEXT', () => {
  const text = makeText();
  DesignCore.Scene.entities.add(text);
  const file = new DXFFile('R13');
  text.dxf(file);
  expect(file.contents).toContain('0\nMTEXT\n5\n');
  expect(() => text.dxf(new DXFFile('R12'))).toThrow('R13');
});

test('block-contained MTEXT round trips as an independent entity', () => {
  const text = makeText();
  text.setProperty('handle', DesignCore.HandleManager.next());
  DesignCore.Scene.blockManager.addItem({ name: 'TEXTBLOCK', entities: [text] });
  const output = core.saveFile('R2018');
  new Core();
  new DXF().loadDxf(output);
  const block = DesignCore.Scene.blockManager.getItemByName('TEXTBLOCK');
  expect(block.entities).toHaveLength(1);
  expect(block.entities[0]).toBeInstanceOf(MText);
  expect(block.entities[0].getPlainText()).toBe('First\nSecond');
});

test.each([SvgRenderer, PdfRenderer])('%p renders separate text lines using the existing text interface', (Renderer) => {
  const renderer = new Renderer(100, 100);
  makeText().draw(renderer);
  const output = renderer.getOutput();
  expect(output).toContain('First');
  expect(output).toContain('Second');
  expect(output).not.toContain('\\P');
});

test('MText.execute supports multiline content and the existing style defaults', async () => {
  const text = new MText();
  const execute = jest.fn();
  await withMockInput(DesignCore.Scene, [new Point(1, 2), 4, 20, 30, 'One\\PTwo'], async () => {
    await text.execute();
  }, { extraMethods: { executeCommand: execute } });
  expect(execute).toHaveBeenCalledWith(text);
  expect(text.getProperty('height')).toBe(4);
  expect(text.getProperty('width')).toBe(20);
  expect(text.getRotation()).toBeCloseTo(30);
  expect(text.getPlainText()).toBe('One\nTwo');
});

test('MText.execute retries invalid dimensions and honours fixed style height', async () => {
  const notify = jest.spyOn(core, 'notify').mockImplementation(() => {});
  const text = new MText();
  DesignCore.StyleManager.getItemByName('STANDARD').textHeight = 5;
  await withMockInput(DesignCore.Scene, [new Point(), -1, 0, 0, 'Note'], async () => {
    await text.execute();
  });
  expect(notify).toHaveBeenCalledTimes(1);
  expect(text.getProperty('height')).toBe(5);
  expect(text.getProperty('width')).toBe(0);
});

test.each([undefined, '   '])('MText.execute does not commit cancelled or blank content (%s)', async (string) => {
  const execute = jest.fn();
  await withMockInput(DesignCore.Scene, [new Point(), 3, 0, 0, string], async () => {
    await new MText().execute();
  }, { extraMethods: { executeCommand: execute } });
  expect(execute).not.toHaveBeenCalled();
});

test('MText preview retains layout properties', () => {
  const text = makeText({ width: 20, attachmentPoint: 5, rotation: 30 });
  DesignCore.Scene.inputManager.promptOption = { types: [Input.Type.STRING] };
  const create = jest.spyOn(DesignCore.Scene.previewEntities, 'create');
  text.preview();
  expect(create).toHaveBeenCalledWith('MText', expect.objectContaining({ width: 20, attachmentPoint: 5, height: 3 }));
  expect(DesignCore.Scene.previewEntities.get(0).getRotation()).toBeCloseTo(30);
});

test('MText is not accepted as hatch boundary geometry', () => {
  jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  expect(new Hatch().processSelection([makeText()])).toEqual([]);
});
