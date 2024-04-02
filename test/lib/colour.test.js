
import {Colour, EntityColour} from '../../core/lib/colour.js';

test('Test Colour', () => {
  const colour = new Colour();
  expect(colour.aci).toEqual(7);
  expect(colour.rgb).toEqual({'b': 254, 'g': 254, 'r': 254});

  const colour4 = new Colour(4);
  expect(colour4.aci).toEqual(4);
  expect(colour4.rgb).toEqual({'b': 255, 'g': 255, 'r': 0});
});

test('Test Colour.isTrueColour', () => {
  const colour = new Colour();
  expect(colour.isTrueColour).toEqual(false);

  const trueColour = new Colour();
  trueColour.setColour({r: 200, g: 100, b: 50});
  expect(trueColour.isTrueColour).toEqual(true);
});

test('Test Colour.getColour', () => {
  const colour = new Colour();
  expect(colour.getColour()).toEqual({'b': 254, 'g': 254, 'r': 254});
});


test('Test Colour.setColour', () => {
  const colour = new Colour();
  colour.setColour({r: 200, g: 100, b: 50});
  expect(colour.rgb).toEqual({'r': 200, 'g': 100, 'b': 50});
  expect(colour.aci).toEqual(7);

  colour.setColour({r: 0, g: 255, b: 255});
  expect(colour.rgb).toEqual({'r': 0, 'g': 255, 'b': 255});
  expect(colour.aci).toEqual(4);

  colour.setColour({r: 1, g: 2, b: 3});
  expect(colour.rgb).toEqual({'r': 1, 'g': 2, 'b': 3});
  expect(colour.aci).toEqual(7);

  colour.setColour({r: 1000, g: 2000, b: 3000});
  expect(colour.rgb).toEqual({'r': 1, 'g': 2, 'b': 3});
  expect(colour.aci).toEqual(7);
});

test('Test Colour.setColourFromACI', () => {
  const colour = new Colour();
  colour.setColourFromACI(7);
  expect(colour.rgb).toEqual({'r': 254, 'g': 254, 'b': 254});
  expect(colour.aci).toEqual(7);

  colour.setColourFromACI(50);
  expect(colour.rgb).toEqual({'r': 254, 'g': 254, 'b': 0});
  expect(colour.aci).toEqual(50);

  colour.setColourFromACI(-1);
  expect(colour.rgb).toEqual({'r': 254, 'g': 254, 'b': 0});
  expect(colour.aci).toEqual(50);
});

/*
  Entity Colour - Included byblock and bylayer
*/
test('Test EntityColour.setColour', () => {
  const colour = new EntityColour();

  expect(colour.byLayer).toEqual(true);
  expect(colour.byBlock).toEqual(false);

  colour.setColour({r: 200, g: 100, b: 50});
  expect(colour.rgb).toEqual({'r': 200, 'g': 100, 'b': 50});
  expect(colour.aci).toEqual(7);
  expect(colour.byLayer).toEqual(false);
  expect(colour.byBlock).toEqual(false);

  colour.setColour({r: 0, g: 0, b: 0});
  expect(colour.rgb).toEqual({'r': 0, 'g': 0, 'b': 0});
  expect(colour.aci).toEqual(0);
  expect(colour.byLayer).toEqual(false);
  expect(colour.byBlock).toEqual(true);

  colour.setColour('BYLAYER');
  expect(colour.aci).toEqual(256);
  expect(colour.byLayer).toEqual(true);
  expect(colour.byBlock).toEqual(false);

  colour.setColour('BYBLOCK');
  expect(colour.aci).toEqual(0);
  expect(colour.byLayer).toEqual(false);
  expect(colour.byBlock).toEqual(true);

  colour.setColour('bylayer');
  expect(colour.aci).toEqual(256);
  expect(colour.byLayer).toEqual(true);
  expect(colour.byBlock).toEqual(false);

  colour.setColour('byblock');
  expect(colour.aci).toEqual(0);
  expect(colour.byLayer).toEqual(false);
  expect(colour.byBlock).toEqual(true);
});


test('Colour Conversion Test', () => {
  const colour = new EntityColour();

  // Check the returned ACI is the same as the set ACI
  for (let i=0; i<255; i++) {
    colour.setColourFromACI(i);
    expect(colour.aci).toEqual(i);
  }
});
