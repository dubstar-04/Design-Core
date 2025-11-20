import { Utils } from '../../core/lib/utils.js';

test('Test Utils.degrees2radians', () => {
  // Positive
  expect(Utils.degrees2radians(22.5)).toBe(Math.PI/8);
  expect(Utils.degrees2radians(45)).toBe(Math.PI/4);
  expect(Utils.degrees2radians(90)).toBe(Math.PI/2);
  expect(Utils.degrees2radians(180)).toBe(Math.PI);
  expect(Utils.degrees2radians(270)).toBe(Math.PI * 1.5);
  expect(Utils.degrees2radians(360)).toBe(Math.PI * 2);

  // Negative
  expect(Utils.degrees2radians(-22.5)).toBe(-Math.PI/8);
});

test('Test Utils.radians2degrees', () => {
  // Positive
  expect(Utils.radians2degrees(Math.PI/8)).toBe(22.5);
  expect(Utils.radians2degrees(Math.PI/4)).toBe(45);
  expect(Utils.radians2degrees(Math.PI/2)).toBe(90);
  expect(Utils.radians2degrees(Math.PI)).toBe(180);

  // Negative
  expect(Utils.radians2degrees(-Math.PI/8)).toBe(-22.5);
});

test('Test Utils.round', () => {
  // Positive
  expect(Utils.round(1.234567)).toBe(1.23457);

  // Negative
  expect(Utils.round(-1.234567)).toBe(-1.23457);
});

test('Test Utils.getLevenshteinDistance', () => {
  expect(Utils.getLevenshteinDistance('design', 'resign')).toBe(1);
  expect(Utils.getLevenshteinDistance('design', 'sign')).toBe(2);
});

test('Test Utils.sortPointsByDistance mutates array ordered by distance', () => {
  const ref = { x: 0, y: 0 };
  const pts = [
    { x: 3, y: 4 }, // dist^2 = 25
    { x: 1, y: 1 }, // dist^2 = 2
    { x: -2, y: 0 }, // dist^2 = 4
    { x: 0, y: 5 }, // dist^2 = 25
  ];
  Utils.sortPointsByDistance(pts, ref);
  // Expect ascending order: (1,1) ( -2,0 ) then the two distance=25 points (order between them not critical)
  expect(pts[0].x).toBe(1);
  expect(pts[0].y).toBe(1);
  expect(pts[1].x).toBe(-2);
  expect(pts[1].y).toBe(0);
  const lastTwo = pts.slice(2).map((p) => `${p.x},${p.y}`);
  expect(lastTwo.sort()).toEqual(['0,5', '3,4']);
});

test('Test Utils.sortPointsByDistance with empty array does nothing', () => {
  const ref = { x: 5, y: 5 };
  const pts = [];
  Utils.sortPointsByDistance(pts, ref);
  expect(pts).toEqual([]);
});


