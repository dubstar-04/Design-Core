import {Core} from '../../core/core/core.js';
import {DesignCore} from '../../core/designCore.js';
import {Point} from '../../core/entities/point.js';
import {Rotate} from '../../core/tools/rotate.js';

const core = new Core();

test('Test Rotate.action', () => {
  // Add items to scene
  DesignCore.Scene.addItem('Line', {points: [new Point(10, 0), new Point(20, 0)]});
  DesignCore.Scene.addItem('Circle', {points: [new Point(10, 0), new Point(20, 0)]});
  DesignCore.Scene.addItem('Polyline', {points: [new Point(10, 0), new Point(20, 0)]});
  DesignCore.Scene.addItem('Arc', {points: [new Point(10, 0), new Point(10, 10), new Point(0, 10)]});
  DesignCore.Scene.addItem('Rectangle', {points: [new Point(10, 0), new Point(0, 10)]});
  DesignCore.Scene.addItem('Text', {points: [new Point(10, 0), new Point(0, 10)], height: 10, rotation: 0, string: 'text test'});

  // Add items to selection set
  for (let i = 0; i < DesignCore.Scene.items.length; i++) {
    DesignCore.Scene.selectionManager.addToSelectionSet(i);
  }

  /**
   * rotate by 90
   */

  const rotate = new Rotate();

  // set base point
  rotate.points.push(new Point());

  // set rotation reference point
  rotate.points.push(new Point(10, 0));

  // set rotation destination point
  rotate.points.push(new Point(0, 10));

  // Perform rotate
  rotate.action();

  for (let i = 0; i < DesignCore.Scene.items.length; i++) {
    expect(DesignCore.Scene.items[i].points[0].x).toBeCloseTo(0);
    expect(DesignCore.Scene.items[i].points[0].y).toBeCloseTo(10);
  }

  /**
   * rotate by -90
   */

  // reset points
  rotate.points = [];

  // set base point
  rotate.points.push(new Point());

  // set rotation reference point
  rotate.points.push(new Point(0, 10));

  // set rotation destination point
  rotate.points.push(new Point(10, 0));

  // Perform rotate
  rotate.action();

  for (let i = 0; i < DesignCore.Scene.items.length; i++) {
    expect(DesignCore.Scene.items[i].points[0].x).toBeCloseTo(10);
    expect(DesignCore.Scene.items[i].points[0].y).toBeCloseTo(0);
  }
});
