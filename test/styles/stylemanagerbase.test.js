import {Core} from '../../core/core/core.js';
import {StyleManagerBase} from '../../core/styles/styleManagerBase';


// mock createStyle method
StyleManagerBase.prototype.createStyle = function(style) {
  return {name: style.name};
};

// mock addStandardStyles method
StyleManagerBase.prototype.addStandardStyles = function() {
  this.addStyle({'name': 'TEST'});
};

// initialise core
new Core();
const styleManager = new StyleManagerBase();

test('Test StyleManagerBase.getStyles', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  // test getStyles
  expect(styleManager.getStyles()).toHaveLength(2);
});

test('Test StyleManagerBase.styleCount', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  // test styleCount
  expect(styleManager.styleCount()).toBe(2);
});

test('Test StyleManagerBase.newStyle', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  // Add new style
  styleManager.newStyle();

  expect(styleManager.styleCount()).toBe(3);
});

test('Test StyleManagerBase.getUniqueName', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  // check existing style name
  expect(styleManager.getUniqueName('styleOne')).toBe('styleOne_1');
  expect(styleManager.getUniqueName('sTyLeOnE')).toBe('sTyLeOnE_1');

  // check new style name
  expect(styleManager.getUniqueName('styleThree')).toBe('styleThree');
});

test('Test StyleManagerBase.addStyle', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}];

  // Add new style
  styleManager.addStyle({name: 'styleTwo'});
  expect(styleManager.styleCount()).toBe(2);

  // Try and add existing style
  styleManager.addStyle({name: 'styleOne'});
  expect(styleManager.styleCount()).toBe(2);
});

test('Test StyleManagerBase.deleteStyle', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  // Delete style
  styleManager.deleteStyle(1);
  expect(styleManager.styleCount(1)).toBe(1);

  // Try and delete an non-existant index
  styleManager.deleteStyle(1);
  expect(styleManager.styleCount()).toBe(1);
});


test('Test StyleManagerBase.getCstyle', () => {
  expect(styleManager.getCstyle()).toBe('TEST');
});

test('Test StyleManagerBase.setCstyle', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  styleManager.setCstyle('styleOne');
  expect(styleManager.getCstyle()).toBe('styleOne');

  expect(() => {
    styleManager.setCstyle('Non-Existent');
  }).toThrow();
  // styleManager.setCstyle('Non-Existent');
  expect(styleManager.getCstyle()).toBe('styleOne');
});

test('Test StyleManagerBase.styleExists', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  expect(styleManager.styleExists('styleOne')).toBe(true);
  expect(styleManager.styleExists('styleTwo')).toBe(true);
  expect(styleManager.styleExists('Non-Existent')).toBe(false);
});

test('Test StyleManagerBase.checkStyles', () => {
  // clear all styles
  styleManager.styles = [];

  expect(styleManager.styleCount()).toBe(0);

  styleManager.checkStyles();
  expect(styleManager.styleCount()).toBe(1);
});

test('Test StyleManagerBase.addStandardStyles', () => {
  // clear all styles
  styleManager.styles = [];

  expect(styleManager.styleCount()).toBe(0);

  styleManager.addStandardStyles();
  expect(styleManager.styleCount()).toBe(1);

  // check standard styles can't be added multiple times
  styleManager.addStandardStyles();
  expect(styleManager.styleCount()).toBe(1);
});

test('Test StyleManagerBase.getStyleByName', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  expect(styleManager.getStyleByName('styleOne').name).toBe('styleOne');
  expect(() => {
    styleManager.getStyleByName('Non-Existent');
  }).toThrow();
  // expect(styleManager.getStyleByName('Non-Existent')).toBeUndefined();
});

test('Test StyleManagerBase.getStyleByIndex', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  expect(styleManager.getStyleByIndex(0).name).toBe('styleOne');
  expect(styleManager.getStyleByIndex(20)).toBeUndefined();
});

test('Test StyleManagerBase.renameStyle', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne'}, {name: 'styleTwo'}];

  // check index name
  expect(styleManager.getStyleByIndex(0).name).toBe('styleOne');

  // try and rename to STANDARD
  // styleManager.renameStyle(0, 'STANDARD');
  // expect(styleManager.getStyleByIndex(0).name).toBe('styleOne');

  // valid rename
  styleManager.renameStyle(0, 'styleOneRenamed');
  expect(styleManager.getStyleByIndex(0).name).toBe('styleOneRenamed');

  // try and rename to current name - no change
  styleManager.renameStyle(0, 'styleOneRenamed');
  expect(styleManager.getStyleByIndex(0).name).toBe('styleOneRenamed');

  // try and rename current style
  styleManager.setCstyle('styleTwo');
  styleManager.renameStyle(1, 'styleTwoRenamed');
  expect(styleManager.getStyleByIndex(1).name).toBe('styleTwoRenamed');
  expect(styleManager.getCstyle()).toBe('styleTwoRenamed');
});


test('Test StyleManagerBase.updateStyle', () => {
  // add some style to the styles array property
  styleManager.styles = [{name: 'styleOne', textHeight: 2}, {name: 'styleTwo', textHeight: 3}];

  // update non-existent style index
  expect(() => {
    styleManager.updateStyle(10, 'Non-Existent-property', 'value');
  }).toThrow();


  // update non-existent style property
  expect(() => {
    styleManager.updateStyle(1, 'Non-Existent-property', 'value');
  }).toThrow();

  // update style name
  styleManager.updateStyle(0, 'name', 'styleOneRenamed');
  expect(styleManager.getStyleByIndex(0).name).toBe('styleOneRenamed');


  // update style text height
  styleManager.updateStyle(0, 'textHeight', 20);
  expect(styleManager.getStyleByIndex(0).textHeight).toBe(20);
});
