
import {Colours} from '../../core/lib/colours.js';

test('Test Colours.getHexColour', () => {
  expect(Colours.getHexColour(0)).toBe('BYBLOCK');
  expect(Colours.getHexColour(255)).toBe('#FFFFFF');
});

test('Test Colours.getACADColour', () => {
  expect(Colours.getACADColour('#FF0000')).toBe('1');
  expect(Colours.getACADColour('#00FF3F')).toBe('100');
});

test('Test Colours.rgbToHex', () => {
  expect(Colours.rgbToHex(1, 1, 1)).toBe('#010101');
  expect(Colours.rgbToHex(100, 100, 100)).toBe('#646464');
});

test('Test Colours.hexToRGB', () => {
  expect(Colours.hexToRGB('#010101')).toEqual({r: 1, g: 1, b: 1});
  expect(Colours.hexToRGB('#646464')).toEqual({r: 100, g: 100, b: 100});
  expect(Colours.hexToRGB('12345')).toBe(null);
});

test('Test Colours.hexToScaledRGB', () => {
  expect(Colours.hexToScaledRGB('#010101')).toEqual({r: 1/255, g: 1/255, b: 1/255});
  expect(Colours.hexToScaledRGB('#646464')).toEqual({r: 100/255, g: 100/255, b: 100/255});
  expect(Colours.hexToScaledRGB('12345')).toBe(null);
});
