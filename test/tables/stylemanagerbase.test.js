import { Core } from '../../core/core/core.js';
import { StyleManagerBase } from '../../core/tables/styleManagerBase.js';


// mock createItem method
StyleManagerBase.prototype.createItem = function (style) {
  return { name: style.name };
};

// mock addStandardItems method
StyleManagerBase.prototype.addStandardItems = function () {
  this.addItem({ 'name': 'TEST' });
};

// initialise core
new Core();
const styleManager = new StyleManagerBase();

test('Test StyleManagerBase.getItems', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  // test getItems
  expect(styleManager.getItems()).toHaveLength(2);
});

test('Test StyleManagerBase.itemCount', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  // test itemCount
  expect(styleManager.itemCount()).toBe(2);
});

test('Test StyleManagerBase.newItem', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  // Add new style
  styleManager.newItem();

  expect(styleManager.itemCount()).toBe(3);
});

test('Test StyleManagerBase.getUniqueName', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  // check existing style name
  expect(styleManager.getUniqueName('styleOne')).toBe('styleOne_1');
  expect(styleManager.getUniqueName('sTyLeOnE')).toBe('sTyLeOnE_1');

  // check new style name
  expect(styleManager.getUniqueName('styleThree')).toBe('styleThree');
});

test('Test StyleManagerBase.addItem', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }];

  // Add new style
  styleManager.addItem({ name: 'styleTwo' });
  expect(styleManager.itemCount()).toBe(2);

  // Try and add existing style
  styleManager.addItem({ name: 'styleOne' });
  expect(styleManager.itemCount()).toBe(2);

  // OverWrite existing style
  styleManager.addItem({ name: 'styleone' }, true);
  expect(styleManager.itemCount()).toBe(2);
  expect(styleManager.items[0].name).toBe('styleone');
});

test('Test StyleManagerBase.deleteStyle', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }], { name: 'Standard' };
  styleManager.indelibleItems = ['Standard'];

  // Delete style
  styleManager.deleteStyle(1);
  expect(styleManager.itemCount(1)).toBe(1);

  // Try and delete an non-existant index
  styleManager.deleteStyle(10);
  expect(styleManager.itemCount()).toBe(1);


  // Check style name
  const styleIndex = styleManager.getItemIndex('Standard');

  // Try and delete an indelible styles
  styleManager.deleteStyle(styleIndex);
  expect(styleManager.itemCount()).toBe(1);
});


test('Test StyleManagerBase.getCstyle', () => {
  expect(styleManager.getCstyle()).toBe('TEST');
});

test('Test StyleManagerBase.setCstyle', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  styleManager.setCstyle('styleOne');
  expect(styleManager.getCstyle()).toBe('styleOne');

  expect(() => {
    styleManager.setCstyle('Non-Existent');
  }).toThrow();
  // styleManager.setCstyle('Non-Existent');
  expect(styleManager.getCstyle()).toBe('styleOne');
});

test('Test StyleManagerBase.itemExists', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  expect(styleManager.itemExists('styleOne')).toBe(true);
  expect(styleManager.itemExists('styleTwo')).toBe(true);
  expect(styleManager.itemExists('Non-Existent')).toBe(false);
});

test('Test StyleManagerBase.checkStyles', () => {
  // clear all styles
  styleManager.items = [];

  expect(styleManager.itemCount()).toBe(0);

  styleManager.checkStyles();
  expect(styleManager.itemCount()).toBe(1);
});

test('Test StyleManagerBase.addStandardItems', () => {
  // clear all styles
  styleManager.items = [];

  expect(styleManager.itemCount()).toBe(0);

  styleManager.addStandardItems();
  expect(styleManager.itemCount()).toBe(1);

  // check standard styles can't be added multiple times
  styleManager.addStandardItems();
  expect(styleManager.itemCount()).toBe(1);
});

test('Test StyleManagerBase.getItemByName', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  expect(styleManager.getItemByName('styleOne').name).toBe('styleOne');
  expect(() => {
    styleManager.getItemByName('Non-Existent');
  }).toThrow();
  // expect(styleManager.getItemByName('Non-Existent')).toBeUndefined();
});

test('Test StyleManagerBase.getItemByIndex', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];

  expect(styleManager.getItemByIndex(0).name).toBe('styleOne');
  expect(styleManager.getItemByIndex(20)).toBeUndefined();
});

test('Test StyleManagerBase.renameStyle', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne' }, { name: 'styleTwo' }];
  styleManager.indelibleItems = ['Standard'];

  // check index name
  expect(styleManager.getItemByIndex(0).name).toBe('styleOne');

  // try and rename to STANDARD
  styleManager.renameStyle(0, 'STANDARD');
  expect(styleManager.getItemByIndex(0).name).toBe('styleOne');

  // valid rename
  styleManager.renameStyle(0, 'styleOneRenamed');
  expect(styleManager.getItemByIndex(0).name).toBe('styleOneRenamed');

  // try and rename to current name - no change
  styleManager.renameStyle(0, 'styleOneRenamed');
  expect(styleManager.getItemByIndex(0).name).toBe('styleOneRenamed');

  // try and rename current style
  // check index name
  expect(styleManager.getItemByIndex(1).name).toBe('styleTwo');
  styleManager.setCstyle('styleTwo');
  expect(styleManager.getCstyle()).toBe('styleTwo');

  styleManager.renameStyle(1, 'styleTwoRenamed');
  expect(styleManager.getItemByIndex(1).name).toBe('styleTwoRenamed');
  expect(styleManager.getCstyle()).toBe('styleTwoRenamed');
});


test('Test StyleManagerBase.updateItem', () => {
  // add some style to the styles array property
  styleManager.items = [{ name: 'styleOne', textHeight: 2 }, { name: 'styleTwo', textHeight: 3 }];

  // update non-existent style index
  expect(() => {
    styleManager.updateItem(10, 'Non-Existent-property', 'value');
  }).toThrow();


  // update non-existent style property
  expect(() => {
    styleManager.updateItem(1, 'Non-Existent-property', 'value');
  }).toThrow();

  // update style name
  styleManager.updateItem(0, 'name', 'styleOneRenamed');
  expect(styleManager.getItemByIndex(0).name).toBe('styleOneRenamed');


  // update style text height
  styleManager.updateItem(0, 'textHeight', 20);
  expect(styleManager.getItemByIndex(0).textHeight).toBe(20);
});
