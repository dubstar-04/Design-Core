
import { Colours } from '../../core/lib/colours.js';

test('Test Colours.isRGB', () => {
  expect(Colours.isRGB({ r: 255, g: 255, b: 255 })).toEqual(true);
  expect(Colours.isRGB({ r: 255, b: 255 })).toEqual(false);
});

test('Test Colours.aciToRGB', () => {
  expect(Colours.aciToRGB(0)).toEqual({ r: 0, g: 0, b: 0 });
  expect(Colours.aciToRGB(255)).toEqual({ r: 255, g: 255, b: 255 });

  // aci 7 should change colour depending on the background colour
  expect(Colours.aciToRGB(255)).toEqual({ r: 255, g: 255, b: 255 });
});

test('Test Colours.rgbToACI', () => {
  expect(Colours.rgbToACI({ r: 0, g: 0, b: 0 })).toEqual(0);
  expect(Colours.rgbToACI({ r: 254, g: 254, b: 254 })).toEqual(7);
});

test('Test Colours.rgbToString', () => {
  expect(Colours.rgbToString({ r: 0, g: 0, b: 0 })).toEqual('rgb(0, 0, 0)');
  expect(Colours.rgbToString({ r: 255, g: 255, b: 255 })).toEqual('rgb(255, 255, 255)');
});

test('Test Colours.rgbToScaledRGB', () => {
  expect(Colours.rgbToScaledRGB({ r: 255, g: 255, b: 255 })).toEqual({ r: 1, g: 1, b: 1 });
  expect(Colours.rgbToScaledRGB({ r: 100, g: 100, b: 100 })).toEqual({ r: 100 / 255, g: 100 / 255, b: 100 / 255 });
  expect(Colours.rgbToScaledRGB({ r: 1, g: 1 })).toBeUndefined();
  expect(Colours.rgbToScaledRGB({})).toBeUndefined();
});

test('Test Colours.trueColourToRGB', () => {
  // rgb(200, 100,50)
  // hex 0x00C86432
  // int 13132850
  const rgb = Colours.trueColourToRGB(13132850);
  expect(rgb.r).toBe(200);
  expect(rgb.g).toBe(100);
  expect(rgb.b).toBe(50);

  expect(Colours.trueColourToRGB()).toBeUndefined();
});


test('Test Colours.rgbToTrueColour', () => {
  // rgb(200, 100,50)
  // hex 0x00C86432
  // int 13132850
  expect(Colours.rgbToTrueColour({ r: 200, g: 100, b: 50 })).toBe(13132850);
  expect(Colours.rgbToTrueColour()).toBeUndefined();
});

test('Test Colour Sequence', () => {
  // loop through all colour values and check the ACI numbers
  // ensure the numbers are sequential
  let index = 0;

  for (const key in Colours.rgb_conversion_table) {
    if (!isNaN(key)) {
      expect(parseInt(key)).toBe(index);
      index++;
    }
  }
});

test('Colours Conversion Test', () => {
  // Check the returned ACI is the same as the set ACI
  for (let i = 0; i < 255; i++) {
    const rgb = Colours.aciToRGB(i);
    expect(Colours.rgbToACI(rgb)).toEqual(i);
  }
});
