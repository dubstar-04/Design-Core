
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';

const core = new Core();
const propertiesManager = core.propertyManager;

const point1 = new Point();
const point2 = new Point(0, 100);

const data = {
  points: [point1, point2],
  colour: { r: 100, g: 100, b: 100 },
};

DesignCore.Scene.addItem('Line', data);
DesignCore.Scene.addItem('Circle', data);
DesignCore.Scene.addItem('Text', data);
// Add Arc with a different Colour
DesignCore.Scene.addItem('Arc', { points: [point1, point2], colour: { r: 130, g: 130, b: 130 } });

test('Test propertyManager.getItemTypes', () => {
  // Add an item to the selectionSet
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(0);
  let types = propertiesManager.getItemTypes();
  expect(types.length).toBe(1);

  // Add the same item to the selectionSet - shouldn't change the count
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(0);
  types = propertiesManager.getItemTypes();
  expect(types.length).toBe(1);

  // Add a new item to the selectionSet - result should include 'All'
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(1);
  types = propertiesManager.getItemTypes();
  expect(types.length).toBe(3);
  expect(types[0]).toBe('All');
});

test('Test propertyManager.setItemProperties', () => {
  // clear the selection set
  DesignCore.Scene.reset();
  // add the text entity
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(2);
  // set the string attribute of the text entity
  const string = 'test text';
  propertiesManager.setItemProperties('string', string);

  let text = DesignCore.Scene.getItem(2);
  expect(text.type).toBe('Text');
  expect(text.string).toBe(string);

  // try and set a non-existent property
  propertiesManager.setItemProperties('faux-prop', string);
  text = DesignCore.Scene.getItem(2);
  expect(text['faux-prop']).toBeUndefined();

  // clear the selection set
  DesignCore.Scene.reset();
  // Select the circle element
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(1);
  // get the current radius
  const radius = DesignCore.Scene.getItem(1).radius;
  // try and set an incorrect value
  propertiesManager.setItemProperties('radius', string);
  const circle = DesignCore.Scene.getItem(1);
  expect(circle.radius).toBe(radius);
});

test('Test propertyManager.getItemProperties', () => {
  // clear the selection set
  DesignCore.Scene.reset();

  // get props with nothing selected - should be undefined
  let properties = propertiesManager.getItemProperties();
  expect(properties).toBeUndefined();

  // Add the line entity to the selectionSet
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(0);
  properties = propertiesManager.getItemProperties('Line');
  expect(properties.length).toBeGreaterThan(0);

  // check properties for All itemTypes
  properties = propertiesManager.getItemProperties('All');
  expect(properties.length).toBeGreaterThan(0);

  // get circle props with a line selected - should be 0
  properties = propertiesManager.getItemProperties('Circle');
  expect(properties.length).toBe(0);
});

test('Test propertyManager.getItemPropertyValue', () => {
  // clear the selection set
  DesignCore.Scene.reset();

  // get props with nothing selected - should be undefined
  let propertyValues = propertiesManager.getItemPropertyValue();
  expect(propertyValues).toBeUndefined();

  // Add the line entity to the selectionSet
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(0);
  // get the line colour
  propertyValues = propertiesManager.getItemPropertyValue('Line', 'colour');
  expect(propertyValues).toEqual(data.colour);

  // get circle props with a line selected - should be undefined
  propertyValues = propertiesManager.getItemPropertyValue('Circle', 'colour');
  expect(propertyValues).toBeUndefined();

  // get props for all selected types - index 0 and 3 colour should be Varies
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(3);
  propertyValues = propertiesManager.getItemPropertyValue('All', 'colour');
  expect(propertyValues).toBe('Varies');
});
