import {Section} from '../../../../core/lib/dxf/sections/section.js';
import {DxfIterator} from '../../../../core/lib/dxf/dxfIterator.js';

const section = new Section();

test('Test Section.parseValue', () => {
  const iterator = new DxfIterator();
  const string = '1\n2\n10\n100\n20\n200\nEOF';
  iterator.loadFile(string);

  const object = {};
  section.parseValue(iterator, object);
  expect(object).toHaveProperty('1', '2');

  // Move to the next pair
  iterator.nextPair();

  // parse the pair - expect object to contain a points property
  section.parseValue(iterator, object);
  // check the object contains points
  expect(object).toHaveProperty('points');
  // check the points contain a point object
  expect(object.points).toHaveLength(1);
  // check the point contains valid x and y values
  expect(object.points[0]).toHaveProperty('x', 100);
  expect(object.points[0]).toHaveProperty('y', 200);
});


test('Test Section.parseChild', () => {
  const string =
`0
CIRCLE
  8
0
  10
500.0
  20
500.0
  30
0.0
  40
100.0
  0
LINE
  `;

  const iterator = new DxfIterator();
  iterator.loadFile(string);
  const child = section.parseChild(iterator);

  expect(child).toHaveProperty('0', 'CIRCLE');
  expect(child).toHaveProperty('points');
  // check the points contain a point object
  expect(child.points).toHaveLength(1);
  // check the point contains valid x and y values
  expect(child.points[0]).toHaveProperty('x', 500);
  expect(child.points[0]).toHaveProperty('y', 500);


  // parse child expects that the first groupcode is 0
  // test for throw when first groupcode is not 0
  iterator.loadFile('20\n100\n30\n100');
  expect(() => {
    section.parseChild(iterator);
  }).toThrow();
});

test('Test Section.parsePoint', () => {
  const string =
`10
  500.0
20
  500.0
  30
0.0
  40
100.0
`;

  const iterator = new DxfIterator();
  iterator.loadFile(string);
  const point = section.parsePoint(iterator);

  // check the point contains valid x and y values
  expect(point).toHaveProperty('x', 500);
  expect(point).toHaveProperty('y', 500);
  expect(point).toHaveProperty('z', 0);


  // parse point expects that the first groupcode is 10
  // test for throw when first groupcode is not 10
  iterator.loadFile('20\n100\n30\n100');
  expect(() => {
    section.parsePoint(iterator);
  }).toThrow();
});

test('Test Section.parseFloat', () => {
  expect(section.parseFloat('  0')).toBe(0.0);
  expect(section.parseFloat('  10 ')).toBe(10.0);

  expect(() => {
    section.parseFloat('abc');
  }).toThrow();
});

test('Test Section.parseInt', () => {
  expect(section.parseInt('  0')).toBe(0);
  expect(section.parseInt('  10.0 ')).toBe(10);

  expect(() => {
    section.parseInt('abc');
  }).toThrow();
});

test('Test Section.parseBoolean', () => {
  const bool1 = section.parseBoolean('  0');
  expect(bool1).toBe(false);
  const bool2 = section.parseBoolean('  1 ');
  expect(bool2).toBe(true);
});

test('Test Section.getGroupValue', () => {
  // 0-9: String
  expect(section.getGroupValue({'code': '1', 'value': '1'})).toBe('1');
  // 10-39: Double precision 3D point value
  // 40-59: Double precision floating-point value
  expect(section.getGroupValue({'code': '10', 'value': ' 100.0'})).toBe(100.0);
  // 60-79: 16-bit integer value
  // 90-99: 32-bit integer value
  expect(section.getGroupValue({'code': '60', 'value': ' 100.0'})).toBe(100);
  // 100: String (255-character maximum; less for Unicode strings)
  // 102: String (255-character maximum; less for Unicode strings)
  // 105: String representing hexadecimal (hex) handle value
  expect(section.getGroupValue({'code': '100', 'value': 'aabbccdd'})).toBe('aabbccdd');
  // 110-119: Double precision floating-point value
  // 120-129: Double precision floating-point value
  // 130-139: Double precision floating-point value
  // 140-149: Double precision scalar floating-point value
  expect(section.getGroupValue({'code': '110', 'value': ' 100.0'})).toBe(100.0);
  // 160-169: 64-bit integer value
  // 170-179: 16-bit integer value
  expect(section.getGroupValue({'code': '160', 'value': ' 100.0'})).toBe(100);
  // 210-239: Double-precision floating-point value
  expect(section.getGroupValue({'code': '210', 'value': ' 100.0'})).toBe(100.0);
  // 270-279: 16-bit integer value
  // 280-289: 16-bit integer value
  expect(section.getGroupValue({'code': '270', 'value': ' 100.0'})).toBe(100);
  // 290-299: Boolean flag value
  expect(section.getGroupValue({'code': '290', 'value': ' 0'})).toBe(false);
  expect(section.getGroupValue({'code': '299', 'value': ' 1'})).toBe(true);
  // 300-309: Arbitrary text string
  // 330-369: String representing hex object IDs
  expect(section.getGroupValue({'code': '300', 'value': 'aabbccdd'})).toBe('aabbccdd');
  // 370-379: 16-bit integer value
  // 380-389: 16-bit integer value
  expect(section.getGroupValue({'code': '370', 'value': ' 100.0'})).toBe(100);
  // 390-399: String representing hex handle value
  expect(section.getGroupValue({'code': '390', 'value': 'aabbccdd'})).toBe('aabbccdd');
  // 400-409: 16-bit integer value
  expect(section.getGroupValue({'code': '400', 'value': ' 100.0'})).toBe(100);
  // 410-419: String
  expect(section.getGroupValue({'code': '410', 'value': 'aabbccdd'})).toBe('aabbccdd');
  // 420-429: 32-bit integer value
  expect(section.getGroupValue({'code': '420', 'value': ' 100.0'})).toBe(100);
  // 430-439: String
  expect(section.getGroupValue({'code': '340', 'value': 'aabbccdd'})).toBe('aabbccdd');
  // 440-449: 32-bit integer value
  // 450-459: Long
  expect(section.getGroupValue({'code': '440', 'value': ' 100.0'})).toBe(100);
  // 460-469: Double-precision floating-point value
  expect(section.getGroupValue({'code': '460', 'value': ' 100.0'})).toBe(100.0);
  // 470-479: String
  // 480-481: String representing hex handle value
  expect(section.getGroupValue({'code': '470', 'value': 'aabbccdd'})).toBe('aabbccdd');
  // 999: Comment (string)
  expect(section.getGroupValue({'code': '999', 'value': 'comment'})).toBe('comment');
  // 1000-1009: String (same limits as indicated with 0-9 code range)
  expect(section.getGroupValue({'code': '1000', 'value': 'aabbccdd'})).toBe('aabbccdd');
  // 1010-1059: Double-precision floating-point value
  expect(section.getGroupValue({'code': '1010', 'value': ' 100.0'})).toBe(100.0);
  // 1060-1070: 16-bit integer value
  // 1071: 32-bit: integer value
  expect(section.getGroupValue({'code': '1060', 'value': ' 100.0'})).toBe(100);

  // test for throw on invalid group code
  expect(() => {
    section.getGroupValue({'code': 'error', 'value': 'error'}); ;
  }).toThrow();
});
