import { BaseDimension } from './baseDimension.js';
import { AlignedDimension } from './alignedDimension.js';
import { DiametricDimension } from './diametricDimension.js';
import { AngularDimension } from './angularDimension.js';
import { RadialDimension } from './radialDimension.js';

import { Arc } from './arc.js';
import { Circle } from './circle.js';
import { Line } from './line.js';
import { Point } from './point.js';

import { Strings } from '../lib/strings.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';

import { DesignCore } from '../designCore.js';
import { SingleSelection } from '../lib/selectionManager.js';

/**
 * Dimension Entity Class
 * @extends BaseDimension
 */
export class Dimension extends BaseDimension {
  /**
   * Create a Dimension
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // map dimensions type to the class name
    this.dimensionMap = {
      0: AlignedDimension,
      1: AlignedDimension,
      2: AngularDimension,
      3: DiametricDimension,
      4: RadialDimension,
      5: null, // 5 = Angular 3 point;
      6: null, // 6 = Ordinate;
    };

    this.selectedItems = [];

    if (data) {
      const dimType = (data[70] || data.dimType) % 32;

      if (Number.isInteger(dimType) && dimType >= 0 && dimType <= 6) {
        const item = new this.dimensionMap[dimType](data);

        // find the block linked to this dimension
        const linkedBlockIndex = DesignCore.Scene.findItem('BLOCK', 'name', data[2]);

        if (linkedBlockIndex.length) {
          // remove the block from the scene, dimensions manage their block internally
          // const removed =
          DesignCore.Scene.removeItem(linkedBlockIndex[0]);
        }

        return item;
      } else {
        const msg = 'Invalid DimType';
        const err = (`${this.type} - ${msg}`);
        throw Error(err);
      }
    }
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Dimension', shortcut: 'DIM' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      let inputValid = false;

      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle()

      while (!inputValid) {
        const options = new PromptOptions(`${Strings.Input.START} or ${Strings.Input.SELECT}`, [Input.Type.POINT, Input.Type.SINGLESELECTION]);
        const input1 = await DesignCore.Scene.inputManager.requestInput(options);

        if (input1 instanceof Point) {
          inputValid = true;

          this.dimType = 1;

          input1.sequence = 13;
          this.points.push(input1);

          // select a second point to define the dimension
          const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
          const pt14 = await DesignCore.Scene.inputManager.requestInput(op1);
          pt14.sequence = 14;
          this.points.push(pt14);
        }

        if (input1 instanceof SingleSelection) {
          const selectedItem = DesignCore.Scene.getItem(input1.selectedItemIndex);

          // check the selected entity is supported
          if ([Line, Circle, Arc].some((entity) => selectedItem instanceof entity)) {
            this.selectedItems.push(selectedItem);
            inputValid = true;

            // set the dimension type
            if (selectedItem instanceof Line) {
              this.dimType = 1;
            }

            if (selectedItem instanceof Circle) {
              this.dimType = 3;
            }

            if (selectedItem instanceof Arc) {
              this.dimType = 4;
            }
          } else {
            const msg = `${this.type} - Unsupported Type: ${selectedItem.type}`;
            DesignCore.Core.notify(msg);
            DesignCore.Scene.selectionManager.reset();
          }
        }
      }

      // select a second line to make a angular dimension or a point to position the dimension text
      // loop until this.points contains a point with sequence 11 i.e. a text position
      while (!this.points.some((point) => point.sequence === 11)) {
        // default prompt: select a location for the text position
        let op2 = new PromptOptions(Strings.Input.DIMENSION, [Input.Type.POINT]);

        // Angular dimension prompt: select a second line for an angular dimension or location for the text position
        if ((this.selectedItems[0] instanceof Line) && this.selectedItems.length < 2) {
          op2 = new PromptOptions(`${Strings.Input.DIMENSION} or ${Strings.Input.SELECT}`, [Input.Type.POINT, Input.Type.SINGLESELECTION]);
        }

        // diametric prompt: select radial or diametric type dimension or location for the the text position
        if (this.selectedItems[0] instanceof Circle) {
          const options = this.dimType === 3 ? ['Radius'] : ['Diameter'];
          op2 = new PromptOptions(`${Strings.Input.DIMENSION} or ${Strings.Input.OPTION}`, [Input.Type.POINT], options);
        }

        const input2 = await DesignCore.Scene.inputManager.requestInput(op2);

        if (Input.getType(input2) === Input.Type.POINT) {
          const pt11 = input2;
          pt11.sequence = 11;
          this.points.push(pt11);

          // if selected items are available, get the points from the selected items
          // dimensions can be created from point selection only, therefore selected items may not be available
          if (this.selectedItems.length) {
            const dimensionType = this.dimensionMap[this.dimType]; // TODO: use this.dimensionMap.name?
            this.points.push(...dimensionType.getPointsFromSelection(this.selectedItems));
          }
        }

        if (Input.getType(input2) === Input.Type.STRING) {
          // options are converted to input in the prompt options class
          if (input2 === 'Diameter') {
            this.dimType = 3;
          }

          if (input2 === 'Radius') {
            this.dimType = 4;
          }
        }

        if (Input.getType(input2) === Input.Type.SINGLESELECTION) {
          const selectedItem2 = DesignCore.Scene.getItem(input2.selectedItemIndex);
          if ([Line].some((entity) => selectedItem2 instanceof entity)) {
            this.selectedItems.push(selectedItem2);
            // Two lines selected - switch to angular dimension
            this.dimType = 2;
          } else {
            const msg = `${this.type} - Unsupported Type: ${selectedItem2.type}`;
            DesignCore.Core.notify(msg);
            DesignCore.Scene.selectionManager.reset();
          }
        }
      }

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    // get the dimension class
    const dimensionType = this.dimensionMap[this.dimType];
    // get the dimension type as a string
    const dimensionTypeString = dimensionType.register().command;

    if (this.selectedItems.length) {
      const itemPoints = dimensionType.getPointsFromSelection(this.selectedItems);

      const mousePoint = DesignCore.Mouse.pointOnScene();
      mousePoint.sequence = 11;

      const points = [...itemPoints, mousePoint];
      DesignCore.Scene.createTempItem(dimensionTypeString, { points: points, dimensionStyle: this.dimensionStyle });
    }

    if (this.points.length > 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      mousePoint.sequence = 11;
      const points = [...this.points, mousePoint];
      DesignCore.Scene.createTempItem(dimensionTypeString, { points: points, dimensionStyle: this.dimensionStyle });
    }
  }
}
