import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Circle } from '../../core/entities/circle.js';
import { Arc } from '../../core/entities/arc.js';
import { Text } from '../../core/entities/text.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Lwpolyline } from '../../core/entities/lwpolyline.js';
// import { Solid } from '../../core/entities/solid.js';
import { Hatch } from '../../core/entities/hatch.js';
import { Insert } from '../../core/entities/insert.js';
// import { ArcAlignedText } from '../../core/entities/arctext.js';
import { PolylineBase } from '../../core/entities/polylineBase.js';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let core;

beforeAll(() => {
  core = new Core();

  // Entities are arranged in a 3x3 grid of 100x100 cells:
  //
  //   Row 2 (y=200-300): | Hatch        | Insert       |
  //   Row 1 (y=100-200): | Text         | Polyline     | Lwpolyline   |
  //   Row 0 (y=0-100):   | Line         | Circle       | Arc          |

  // Add layers for each entity type
  DesignCore.LayerManager.addItem({ name: 'LINE_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'CIRCLE_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'ARC_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'TEXT_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'POLYLINE_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'LWPOLYLINE_LAYER' });
  // DesignCore.LayerManager.addItem({ name: 'SOLID_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'HATCH_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'INSERT_LAYER' });
  // DesignCore.LayerManager.addItem({ name: 'ARCTEXT_LAYER' });

  // Row 0, Col 0: Line
  const line = new Line({
    points: [new Point(20, 25), new Point(80, 85)],
    layer: 'LINE_LAYER',
  });
  core.scene.entities.add(line);
  core.scene.entities.add(new Text({ points: [new Point(15, 5)], string: 'Line', height: 4 }));

  // Row 0, Col 1: Circle
  const circle = new Circle({
    points: [new Point(150, 55)],
    radius: 25,
    layer: 'CIRCLE_LAYER',
  });
  core.scene.entities.add(circle);
  core.scene.entities.add(new Text({ points: [new Point(115, 5)], string: 'Circle', height: 4 }));

  // Row 0, Col 2: Arc
  const arc = new Arc({
    points: [new Point(250, 55)],
    radius: 25,
    startAngle: 0,
    endAngle: 270,
    layer: 'ARC_LAYER',
  });
  core.scene.entities.add(arc);
  core.scene.entities.add(new Text({ points: [new Point(215, 5)], string: 'Arc', height: 4 }));

  // Row 1, Col 0: Text
  const text = new Text({
    points: [new Point(25, 150)],
    string: 'Hello',
    height: 8,
    layer: 'TEXT_LAYER',
  });
  core.scene.entities.add(text);
  core.scene.entities.add(new Text({ points: [new Point(15, 105)], string: 'Text', height: 4 }));

  // Row 1, Col 1: Polyline
  const polyline = new Polyline({
    points: [new Point(130, 130), new Point(170, 130), new Point(170, 175), new Point(130, 175)],
    layer: 'POLYLINE_LAYER',
  });
  core.scene.entities.add(polyline);
  core.scene.entities.add(new Text({ points: [new Point(115, 105)], string: 'Polyline', height: 4 }));

  // Row 1, Col 2: Lwpolyline
  const lwpolyline = new Lwpolyline({
    points: [new Point(230, 130), new Point(270, 130), new Point(270, 175), new Point(230, 175)],
    layer: 'LWPOLYLINE_LAYER',
  });
  core.scene.entities.add(lwpolyline);
  core.scene.entities.add(new Text({ points: [new Point(215, 105)], string: 'Lwpolyline', height: 4 }));

  // Solid - not registered as a command, cannot be imported
  // const solid = new Solid({
  //   points: [new Point(20, 225), new Point(80, 225), new Point(50, 280)],
  //   layer: 'SOLID_LAYER',
  // });
  // core.scene.entities.add(solid);
  // core.scene.entities.add(new Text({ points: [new Point(15, 205)], string: 'Solid', height: 4 }));

  // Row 2, Col 0: Hatch
  const boundary = new PolylineBase({
    points: [new Point(25, 230), new Point(75, 230), new Point(75, 280), new Point(25, 280)],
  });
  const hatch = new Hatch({
    patternName: 'ANSI31',
    layer: 'HATCH_LAYER',
  });
  hatch.setProperty('childEntities', [boundary]);
  core.scene.entities.add(hatch);
  core.scene.entities.add(new Text({ points: [new Point(15, 205)], string: 'Hatch', height: 4 }));

  // Row 2, Col 1: Insert
  const blockLine = new Line({ points: [new Point(0, 0), new Point(40, 40)] });
  blockLine.setProperty('handle', DesignCore.HandleManager.next());
  const block = DesignCore.Scene.blockManager.addItem({
    name: 'TEST_BLOCK',
    entities: [blockLine],
  });
  const insert = new Insert({
    points: [new Point(130, 235)],
    layer: 'INSERT_LAYER',
  });
  insert.block = block;
  core.scene.entities.add(insert);
  core.scene.entities.add(new Text({ points: [new Point(115, 205)], string: 'Insert', height: 4 }));

  // ArcAlignedText - omitted
  // const arctext = new ArcAlignedText({
  //   points: [new Point(250, 255)],
  //   radius: 25,
  //   string: 'ArcText',
  //   height: 5,
  //   startAngle: 0,
  //   endAngle: 180,
  //   layer: 'ARCTEXT_LAYER',
  // });
  // core.scene.entities.add(arctext);
  // core.scene.entities.add(new Text({ points: [new Point(215, 205)], string: 'ArcText', height: 4 }));
});

let dxfOutput;

beforeAll(() => {
  dxfOutput = core.saveFile('R2018');
});

test('Test DXF output contains all entities', () => {
  expect(dxfOutput).toContain('LINE');
  expect(dxfOutput).toContain('CIRCLE');
  expect(dxfOutput).toContain('ARC');
  expect(dxfOutput).toContain('TEXT');
  expect(dxfOutput).toContain('POLYLINE');
  expect(dxfOutput).toContain('LWPOLYLINE');
  // expect(dxfOutput).toContain('SOLID');
  expect(dxfOutput).toContain('HATCH');
  expect(dxfOutput).toContain('INSERT');
  // expect(dxfOutput).toContain('ARCALIGNEDTEXT');
});

test('Test DXF output contains all layers', () => {
  expect(dxfOutput).toContain('LINE_LAYER');
  expect(dxfOutput).toContain('CIRCLE_LAYER');
  expect(dxfOutput).toContain('ARC_LAYER');
  expect(dxfOutput).toContain('TEXT_LAYER');
  expect(dxfOutput).toContain('POLYLINE_LAYER');
  expect(dxfOutput).toContain('LWPOLYLINE_LAYER');
  // expect(dxfOutput).toContain('SOLID_LAYER');
  expect(dxfOutput).toContain('HATCH_LAYER');
  expect(dxfOutput).toContain('INSERT_LAYER');
  // expect(dxfOutput).toContain('ARCTEXT_LAYER');
});

test('Test DXF output matches reference file', () => {
  const referencePath = join(__dirname, 'exportIntegration.reference.dxf');
  const reference = readFileSync(referencePath, 'utf8');

  expect(dxfOutput).toBe(reference);
});
