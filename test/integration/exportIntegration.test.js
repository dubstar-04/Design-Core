import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Circle } from '../../core/entities/circle.js';
import { Arc } from '../../core/entities/arc.js';
import { Text } from '../../core/entities/text.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Lwpolyline } from '../../core/entities/lwpolyline.js';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let core;

beforeAll(() => {
  core = new Core();

  // Add layers for each entity type
  DesignCore.LayerManager.addItem({ name: 'LINE_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'CIRCLE_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'ARC_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'TEXT_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'POLYLINE_LAYER' });
  DesignCore.LayerManager.addItem({ name: 'LWPOLYLINE_LAYER' });

  // Create entities and add to scene
  const line = new Line({
    points: [new Point(0, 0), new Point(100, 100)],
    layer: 'LINE_LAYER',
  });
  core.scene.entities.add(line);

  const circle = new Circle({
    points: [new Point(50, 50)],
    radius: 25,
    layer: 'CIRCLE_LAYER',
  });
  core.scene.entities.add(circle);

  const arc = new Arc({
    points: [new Point(75, 75)],
    radius: 30,
    startAngle: 0,
    endAngle: 90,
    layer: 'ARC_LAYER',
  });
  core.scene.entities.add(arc);

  const text = new Text({
    points: [new Point(10, 10)],
    string: 'Hello',
    height: 5,
    layer: 'TEXT_LAYER',
  });
  core.scene.entities.add(text);

  const polyline = new Polyline({
    points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)],
    layer: 'POLYLINE_LAYER',
  });
  core.scene.entities.add(polyline);

  const lwpolyline = new Lwpolyline({
    points: [new Point(20, 20), new Point(30, 20), new Point(30, 30), new Point(20, 30)],
    layer: 'LWPOLYLINE_LAYER',
  });
  core.scene.entities.add(lwpolyline);
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
});

test('Test DXF output contains all layers', () => {
  expect(dxfOutput).toContain('LINE_LAYER');
  expect(dxfOutput).toContain('CIRCLE_LAYER');
  expect(dxfOutput).toContain('ARC_LAYER');
  expect(dxfOutput).toContain('TEXT_LAYER');
  expect(dxfOutput).toContain('POLYLINE_LAYER');
  expect(dxfOutput).toContain('LWPOLYLINE_LAYER');
});

test('Test DXF output matches reference file', () => {
  const referencePath = join(__dirname, 'exportIntegration.reference.dxf');
  const reference = readFileSync(referencePath, 'utf8');

  expect(dxfOutput).toBe(reference);
});
