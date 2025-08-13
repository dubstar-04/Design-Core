import { Entities } from '../../../../core/lib/dxf/sections/entities.js';
import { DxfIterator } from '../../../../core/lib/dxf/dxfIterator.js';

const entityData =
  `0
ENTITIES
0
CIRCLE
  8
0
 10
100.0
 20
100.0
 30
0.0
 40
100.0
0
LINE
 8
0
 10
100.0
 20
100.0
 30
0.0
 11
300.0
 21
300.0
 31
0.0
0
POLYLINE
  8
0
 66
     1
 10
0.0
 20
0.0
 30
0.0
  0
VERTEX
  8
0
 10
100.0
 20
100.0
 30
0.0
  0
VERTEX
  8
0
 10
300.0
 20
300.0
 30
0.0
  0
SEQEND
  8
0
0
ENDSEC
0
EOF`;

const iterator = new DxfIterator();
iterator.loadFile(entityData);
const entities = new Entities();

test('Test Entities.read', () => {
  const readEntities = entities.read(iterator);

  expect(readEntities).toHaveLength(3);

  const circleEntity = readEntities[0];
  const lineEntity = readEntities[1];
  const polylineEntity = readEntities[2];

  // check the entity type
  expect(circleEntity).toHaveProperty('0', 'CIRCLE');
  expect(lineEntity).toHaveProperty('0', 'LINE');
  expect(polylineEntity).toHaveProperty('0', 'POLYLINE');
  // check the entity has points
  expect(circleEntity).toHaveProperty('points');
  expect(lineEntity).toHaveProperty('points');
  expect(polylineEntity).toHaveProperty('points');
  // check the entity has children
  expect(polylineEntity).toHaveProperty('children');
  expect(polylineEntity.children).toHaveLength(3);
  // check the points contain a point object
  expect(circleEntity.points).toHaveLength(1);
  expect(lineEntity.points).toHaveLength(2);
  expect(polylineEntity.points).toHaveLength(1);
  // check the point contains valid x and y values
  expect(circleEntity.points[0]).toHaveProperty('x', 100);
  expect(circleEntity.points[0]).toHaveProperty('y', 100);

  expect(lineEntity.points[0]).toHaveProperty('x', 100);
  expect(lineEntity.points[0]).toHaveProperty('y', 100);
  expect(lineEntity.points[1]).toHaveProperty('x', 300);
  expect(lineEntity.points[1]).toHaveProperty('y', 300);

  expect(polylineEntity.children[0].points[0]).toHaveProperty('x', 100);
  expect(polylineEntity.children[0].points[0]).toHaveProperty('y', 100);
  expect(polylineEntity.children[1].points[0]).toHaveProperty('x', 300);
  expect(polylineEntity.children[1].points[0]).toHaveProperty('y', 300);
});


test('Test Entities.addEntity', () => {
  // entity without points
  const circleEntity = { '0': 'CIRCLE', '40': 100, '8': '0' };

  expect(() => {
    entities.addEntity(circleEntity);
  }).toThrow();
});
