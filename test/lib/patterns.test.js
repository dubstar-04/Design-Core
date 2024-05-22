import {PatternLine, Patterns} from '../../core/lib/patterns.js';

test('Test Patterns.getPattern', () => {
  const pattern = Patterns.getPattern('HONEY');
  expect(pattern.length).toBe(3);
  pattern.forEach((patternLine) =>{
    expect(patternLine instanceof PatternLine).toBe(true);
  });
});


test('Test Patterns.getPatternLineCount', () => {
  expect(Patterns.getPatternLineCount('HONEY')).toBe(3);
  expect(Patterns.getPatternLineCount('hOnEy')).toBe(3);
  expect(Patterns.getPatternLineCount('ansi34')).toBe(4);
});

test('Test Patterns.patternExists', () => {
  expect(Patterns.patternExists('HONEY')).toBe(true);
  expect(Patterns.patternExists('hOnEy')).toBe(true);
  expect(Patterns.patternExists('ansi34')).toBe(true);

  expect(Patterns.patternExists('fakeName')).toBe(false);
});


test('Test PatternLine.loadPatternLine', () => {
  const patternLine = new PatternLine();
  const patternString = `45, 0, 0, 0, 3.175`;

  patternLine.loadPatternLine(patternString);

  expect(patternLine.angle).toBe(45);
  expect(patternLine.xOrigin).toBe(0);
  expect(patternLine.yOrigin).toBe(0);
  expect(patternLine.xDelta).toBe(0);
  expect(patternLine.yDelta).toBe(3.175);
  expect(patternLine.dashes.length).toBe(0);

  const patternStringwithDashes = `120, 0, 0, 4.7625, 2.749630645, 3.175, -6.35 `;

  patternLine.loadPatternLine(patternStringwithDashes);

  expect(patternLine.angle).toBe(120);
  expect(patternLine.xOrigin).toBe(0);
  expect(patternLine.yOrigin).toBe(0);
  expect(patternLine.xDelta).toBe(4.7625);
  expect(patternLine.yDelta).toBe(2.749630645);
  expect(patternLine.dashes.length).toBe(2);
  expect(patternLine.dashes[0]).toBe(3.175);
  expect(patternLine.dashes[1]).toBe(-6.35);
});

test('Test PatternLine.getDashLength', () => {
  const patternStringwithDashes = `120, 0, 0, 4.7625, 2.749630645, 3.175, -6.35 `;
  const patternLine = new PatternLine(patternStringwithDashes);
  expect(patternLine.getDashLength()).toBeCloseTo(9.5249);
});
