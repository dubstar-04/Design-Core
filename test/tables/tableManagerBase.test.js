import { Core } from '../../core/core/core.js';
import { TableManagerBase } from '../../core/tables/tableManagerBase.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';

// initialise core
new Core();

// mock createItem method
TableManagerBase.prototype.createItem = function(item) {
  return { name: item.name };
};

// mock addStandardItems method
TableManagerBase.prototype.addStandardItems = function() {
  this.addItem({ 'name': 'TEST' });
};

const tableManagerBase = new TableManagerBase();

// mock item data
tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

test('Test tableManagerBase.getItems', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

  // test getItems
  expect(tableManagerBase.getItems()).toHaveLength(2);
});

test('Test tableManagerBase.itemCount', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

  // test itemCount
  expect(tableManagerBase.itemCount()).toBe(2);
});

test('Test tableManagerBase.newItem', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

  // Add new item
  tableManagerBase.newItem();

  expect(tableManagerBase.itemCount()).toBe(3);
});

test('Test tableManagerBase.getUniqueName', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

  // check existing item name
  expect(tableManagerBase.getUniqueName('itemOne')).toBe('itemOne_1');
  expect(tableManagerBase.getUniqueName('itemOnE')).toBe('itemOnE_1');

  // check new item name
  expect(tableManagerBase.getUniqueName('itemThree')).toBe('itemThree');
});

test('Test tableManagerBase.addItem', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }];

  // Add new item
  tableManagerBase.addItem({ name: 'itemTwo' });
  expect(tableManagerBase.itemCount()).toBe(2);

  // Try and add existing item
  tableManagerBase.addItem({ name: 'itemOne' });
  expect(tableManagerBase.itemCount()).toBe(2);

  // OverWrite existing item
  tableManagerBase.addItem({ name: 'itemone' }, true);
  expect(tableManagerBase.itemCount()).toBe(2);
  expect(tableManagerBase.items[0].name).toBe('itemone');
});

test('Test tableManagerBase.deleteItem', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }], { name: 'Standard' };
  tableManagerBase.indelibleItems = ['Standard'];

  // Delete item
  tableManagerBase.deleteItem(1);
  expect(tableManagerBase.itemCount(1)).toBe(1);

  // Try and delete an non-existant index
  tableManagerBase.deleteItem(10);
  expect(tableManagerBase.itemCount()).toBe(1);


  // Check item name
  const itemIndex = tableManagerBase.getItemIndex('Standard');

  // Try and delete an indelible items
  tableManagerBase.deleteItem(itemIndex);
  expect(tableManagerBase.itemCount()).toBe(1);
});

test('Test tableManagerBase.itemExists', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

  expect(tableManagerBase.itemExists('itemOne')).toBe(true);
  expect(tableManagerBase.itemExists('itemTwo')).toBe(true);
  expect(tableManagerBase.itemExists('Non-Existent')).toBe(false);
});

test('Test tableManagerBase.checkitems', () => {
  // clear all items
  tableManagerBase.items = [];

  expect(tableManagerBase.itemCount()).toBe(0);

  tableManagerBase.checkItems();
  expect(tableManagerBase.itemCount()).toBe(1);
});

test('Test tableManagerBase.addStandardItems', () => {
  // clear all items
  tableManagerBase.items = [];

  expect(tableManagerBase.itemCount()).toBe(0);

  tableManagerBase.addStandardItems();
  expect(tableManagerBase.itemCount()).toBe(1);

  // check standard items can't be added multiple times
  tableManagerBase.addStandardItems();
  expect(tableManagerBase.itemCount()).toBe(1);
});

test('Test tableManagerBase.getItemByName', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

  expect(tableManagerBase.getItemByName('itemOne').name).toBe('itemOne');
  expect(tableManagerBase.getItemByName('Non-Existent')).toBeUndefined();
});

test('Test tableManagerBase.getItemByIndex', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];

  expect(tableManagerBase.getItemByIndex(0).name).toBe('itemOne');
  expect(tableManagerBase.getItemByIndex(20)).toBeUndefined();
});

test('Test tableManagerBase.renameitem', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];
  tableManagerBase.indelibleItems = ['Standard'];

  // check index name
  expect(tableManagerBase.getItemByIndex(0).name).toBe('itemOne');

  // try and rename to STANDARD
  tableManagerBase.renameItem(0, 'STANDARD');
  expect(tableManagerBase.getItemByIndex(0).name).toBe('itemOne');

  // valid rename
  tableManagerBase.renameItem(0, 'itemOneRenamed');
  expect(tableManagerBase.getItemByIndex(0).name).toBe('itemOneRenamed');

  // try and rename to current name - no change
  tableManagerBase.renameItem(0, 'itemOneRenamed');
  expect(tableManagerBase.getItemByIndex(0).name).toBe('itemOneRenamed');
});


test('Test tableManagerBase.updateItem', () => {
  // add some item to the items array property
  tableManagerBase.items = [{ name: 'itemOne', textHeight: 2 }, { name: 'itemTwo', textHeight: 3 }];

  // update non-existent item index
  expect(() => {
    tableManagerBase.updateItem(10, 'Non-Existent-property', 'value');
  }).toThrow();


  // update non-existent item property
  expect(() => {
    tableManagerBase.updateItem(1, 'Non-Existent-property', 'value');
  }).toThrow();

  // update item name
  tableManagerBase.updateItem(0, 'name', 'itemOneRenamed');
  expect(tableManagerBase.getItemByIndex(0).name).toBe('itemOneRenamed');


  // update item text height
  tableManagerBase.updateItem(0, 'textHeight', 20);
  expect(tableManagerBase.getItemByIndex(0).textHeight).toBe(20);
});

describe('tableManagerBase deleteItem return contract', () => {
  beforeEach(() => {
    tableManagerBase.items = [{ name: 'itemOne' }, { name: 'Standard' }];
    tableManagerBase.indelibleItems = ['Standard'];
  });

  test('returns the spliced array containing the deleted item', () => {
    const deleted = tableManagerBase.deleteItem(0);

    expect(Array.isArray(deleted)).toBe(true);
    expect(deleted).toEqual([{ name: 'itemOne' }]);
    expect(tableManagerBase.itemExists('itemOne')).toBe(false);
  });

  test('returns undefined for an invalid index', () => {
    expect(tableManagerBase.deleteItem(10)).toBeUndefined();
    expect(tableManagerBase.itemCount()).toBe(2);
  });

  test('returns undefined and keeps indelible items, ignoring case', () => {
    tableManagerBase.indelibleItems = ['STANDARD'];

    expect(tableManagerBase.deleteItem(1, false)).toBeUndefined();
    expect(tableManagerBase.itemExists('Standard')).toBe(true);
  });

  test('invalidates the name lookup cache', () => {
    expect(tableManagerBase.getItemByName('itemOne')).toBeDefined();

    tableManagerBase.deleteItem(0);

    expect(tableManagerBase.getItemByName('itemOne')).toBeUndefined();
  });
});

describe('tableManagerBase lookups', () => {
  beforeEach(() => {
    tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];
  });

  test('getItemIndex is case-insensitive and returns -1 when missing', () => {
    expect(tableManagerBase.getItemIndex('ITEMTWO')).toBe(1);
    expect(tableManagerBase.getItemIndex('missing')).toBe(-1);
  });

  test('itemExists and getItemByName are case-insensitive', () => {
    expect(tableManagerBase.itemExists('ITEMONE')).toBe(true);
    expect(tableManagerBase.getItemByName('itemone').name).toBe('itemOne');
  });

  test('getItemByName cache is refreshed after addItem and rename', () => {
    expect(tableManagerBase.getItemByName('itemOne')).toBeDefined();

    tableManagerBase.addItem({ name: 'itemThree' });
    expect(tableManagerBase.getItemByName('itemThree')).toBeDefined();

    tableManagerBase.renameItem(0, 'itemRenamed');
    expect(tableManagerBase.getItemByName('itemOne')).toBeUndefined();
    expect(tableManagerBase.getItemByName('itemRenamed')).toBeDefined();
  });

  test('clearItems removes all items', () => {
    tableManagerBase.clearItems();

    expect(tableManagerBase.itemCount()).toBe(0);
    expect(tableManagerBase.getItemByName('itemOne')).toBeUndefined();
  });

  test('addItem returns the existing item when not overwriting', () => {
    const existing = tableManagerBase.getItemByName('itemOne');

    expect(tableManagerBase.addItem({ name: 'ITEMONE' })).toBe(existing);
  });
});

describe('tableManagerBase renameItem', () => {
  beforeEach(() => {
    tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }, { name: 'Standard' }];
    tableManagerBase.indelibleItems = ['Standard'];
  });

  test('returns the new name', () => {
    expect(tableManagerBase.renameItem(0, 'renamed')).toBe('renamed');
  });

  test('returns undefined when the name is unchanged apart from case', () => {
    expect(tableManagerBase.renameItem(0, 'ITEMONE')).toBeUndefined();
    expect(tableManagerBase.getItemByIndex(0).name).toBe('itemOne');
  });

  test('cannot rename an indelible item', () => {
    expect(tableManagerBase.renameItem(2, 'other')).toBeUndefined();
    expect(tableManagerBase.getItemByIndex(2).name).toBe('Standard');
  });

  test('makes a clashing name unique', () => {
    expect(tableManagerBase.renameItem(0, 'itemTwo')).toBe('itemTwo_1');
  });
});

describe('tableManagerBase scene references', () => {
  const originalProperty = tableManagerBase.itemProperty;

  const addLine = (layer) => {
    const line = DesignCore.Scene.addEntity('Line', { points: [new Point(), new Point(10, 10)], layer: layer });
    return line;
  };

  beforeEach(() => {
    tableManagerBase.itemProperty = 'layer';
    tableManagerBase.items = [{ name: 'itemOne' }, { name: 'itemTwo' }];
    tableManagerBase.indelibleItems = [];
    while (DesignCore.Scene.entities.count() > 0) {
      DesignCore.Scene.entities.remove(0);
    }
  });

  afterAll(() => {
    tableManagerBase.itemProperty = originalProperty;
  });

  test('updateSceneItem renames references through the property API', () => {
    addLine('itemOne');
    addLine('itemTwo');

    tableManagerBase.updateSceneItem('itemOne', 'renamed');

    expect(DesignCore.Scene.entities.get(0).getProperty('layer')).toBe('renamed');
    expect(DesignCore.Scene.entities.get(1).getProperty('layer')).toBe('itemTwo');
  });

  test('updateSceneItem matches names case-insensitively', () => {
    addLine('ITEMONE');

    tableManagerBase.updateSceneItem('itemOne', 'renamed');

    expect(DesignCore.Scene.entities.get(0).getProperty('layer')).toBe('renamed');
  });

  test('updateSceneItem ignores an undefined name', () => {
    addLine('itemOne');

    tableManagerBase.updateSceneItem(undefined, 'renamed');

    expect(DesignCore.Scene.entities.get(0).getProperty('layer')).toBe('itemOne');
  });

  test('renameItem updates dependent entities', () => {
    addLine('itemOne');

    tableManagerBase.renameItem(0, 'renamed');

    expect(DesignCore.Scene.entities.get(0).getProperty('layer')).toBe('renamed');
  });

  test('purge removes only unused items', () => {
    addLine('itemOne');

    tableManagerBase.purge();

    expect(tableManagerBase.itemExists('itemOne')).toBe(true);
    expect(tableManagerBase.itemExists('itemTwo')).toBe(false);
  });
});
