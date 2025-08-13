import { Solid } from '../../core/entities/solid.js';
import { Point } from '../../core/entities/point.js';

import { File } from '../test-helpers/test-helpers.js';


test('Test Solid.boundingBox', () => {
  const solid = new Solid({ points: [new Point(100, 100), new Point(200, 100), new Point(200, 200)] });
  expect(solid.boundingBox().xMin).toBeCloseTo(100);
  expect(solid.boundingBox().xMax).toBeCloseTo(200);
  expect(solid.boundingBox().yMin).toBeCloseTo(100);
  expect(solid.boundingBox().yMax).toBeCloseTo(200);
});

test('Test Solid.dxf', () => {
  // test solid with 3 points
  const solid = new Solid({ points: [new Point(100, 100), new Point(200, 100), new Point(200, 200)] });
  let file = new File();
  solid.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
SOLID
5
1
100
AcDbEntity
100
AcDbTrace
8
0
10
100
20
100
30
0.0
11
200
21
100
31
0.0
12
200
22
200
32
0.0
13
200
23
200
33
0.0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newSolid = new Solid(solid);
  file = new File();
  newSolid.dxf(file);
  expect(file.contents).toEqual(dxfString);

  // test solid with 4 points
  const solid2 = new Solid({ points: [new Point(100, 100), new Point(200, 100), new Point(200, 200), new Point(300, 300)] });
  const file2 = new File();
  solid2.dxf(file2);
  // console.log(file.contents);

  const dxfString2 = `0
SOLID
5
1
100
AcDbEntity
100
AcDbTrace
8
0
10
100
20
100
30
0.0
11
200
21
100
31
0.0
12
200
22
200
32
0.0
13
300
23
300
33
0.0
`;

  expect(file2.contents).toEqual(dxfString2);
});
