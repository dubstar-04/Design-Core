import { BaseDimension } from './baseDimension.js';
import { AlignedDimension } from './alignedDimension.js';
import { DiametricDimension } from './diametricDimension.js';
import { AngularDimension } from './angularDimension.js';
import { RadialDimension } from './radialDimension.js';
import { RotatedDimension } from './rotatedDimension.js';

import { Arc } from '../entities/arc.js';
import { Circle } from '../entities/circle.js';
import { Line } from '../entities/line.js';
import { BasePolyline } from '../entities/basePolyline.js';
import { Point } from '../entities/point.js';

import { Strings } from '../lib/strings.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Intersection } from '../lib/intersect.js';

import { DesignCore } from '../designCore.js';
import { SingleSelection } from '../lib/selectionManager.js';
import { Utils } from '../lib/utils.js';
import { DimType } from '../properties/dimType.js';

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
      0: RotatedDimension,
      1: AlignedDimension,
      2: AngularDimension,
      3: DiametricDimension,
      4: RadialDimension,
      5: null, // 5 = Angular 3 point;
      6: null, // 6 = Ordinate;
    };

    this.selectedItems = [];

    if (data) {
      const item = new this.dimensionMap[DimType.getBaseType(this.dimType.getBaseDimType())](data);

      // find the block linked to this dimension
      const linkedBlockIndex = DesignCore.Scene.findItem('BLOCK', 'name', data[2]);

      if (linkedBlockIndex.length) {
        // remove the block from the scene, dimensions manage their block internally
        DesignCore.Scene.removeItem(linkedBlockIndex[0]);
      }

      return item;
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
      this.dimensionStyle = DesignCore.DimStyleManager.getCstyle();

      while (!inputValid) {
        DesignCore.Scene.selectionManager.reset();
        const options = new PromptOptions(`${Strings.Input.START} ${Strings.Strings.OR} ${Strings.Input.SELECT}`, [Input.Type.POINT, Input.Type.SINGLESELECTION]);
        const input1 = await DesignCore.Scene.inputManager.requestInput(options);

        if (input1 instanceof Point) {
          inputValid = true;
          this.dimType.setDimType(1);
          // select a second point to define the dimension
          const op1 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
          const pt14 = await DesignCore.Scene.inputManager.requestInput(op1);
          // Create a temporary line using the selected points
          const tempLine = new Line({ points: [input1, pt14] });
          this.selectedItems.push(tempLine);
        }

        if (input1 instanceof SingleSelection) {
          const selectedItem = DesignCore.Scene.getItem(input1.selectedItemIndex);

          // check the selected entity is supported
          if ([Line, Circle, Arc, BasePolyline].some((entity) => selectedItem instanceof entity)) {
            // set the dimension type
            if (selectedItem instanceof Line) {
              this.dimType.setDimType(1);
              this.selectedItems.push(selectedItem);
              inputValid = true;
            }

            if (selectedItem instanceof Circle) {
              this.dimType.setDimType(3);
              this.selectedItems.push(selectedItem);
              inputValid = true;
            }

            if (selectedItem instanceof Arc) {
              this.dimType.setDimType(4);
              this.selectedItems.push(selectedItem);
              inputValid = true;
            }

            if (selectedItem instanceof BasePolyline) {
              // get the segment closest to the mouse point
              const segment = selectedItem.getClosestSegment(input1.selectedPoint);

              if (segment instanceof Line) {
                this.dimType.setDimType(1);
                this.selectedItems.push(segment);
                inputValid = true;
              }

              if (segment instanceof Arc) {
                this.dimType.setDimType(4);
                this.selectedItems.push(segment);
                inputValid = true;
              }
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
          const options = this.dimType.getBaseDimType() === 3 ? ['Radius'] : ['Diameter'];
          op2 = new PromptOptions(`${Strings.Input.DIMENSION}`, [Input.Type.POINT], options);
        }

        const input2 = await DesignCore.Scene.inputManager.requestInput(op2);

        if (Input.getType(input2) === Input.Type.POINT) {
          const Pt11 = input2;

          // if selected items are available, get the points from the selected items
          // dimensions can be created from point selection only, therefore selected items may not be available
          if (this.selectedItems.length) {
            // for linear dimensions, determine if aligned or rotated based on mouse position
            if (this.dimType.getBaseDimType() === 0 || this.dimType.getBaseDimType() === 1) {
              const Pt13 = this.selectedItems[0].points[0];
              const Pt14 = this.selectedItems[0].points[1];
              const linearDimTypeNumber = this.getLinearDimensionType(Pt13, Pt14, Pt11);
              this.dimType.setDimType(linearDimTypeNumber);
            }

            const dimensionType = this.dimensionMap[this.dimType.getBaseDimType()]; // TODO: use this.dimensionMap.name?
            this.points.push(...dimensionType.getPointsFromSelection(this.selectedItems, Pt11));
          }
        }

        if (Input.getType(input2) === Input.Type.STRING) {
          // options are converted to input in the prompt options class
          if (input2 === 'Diameter') {
            this.dimType.setDimType(3);
          }

          if (input2 === 'Radius') {
            this.dimType.setDimType(4);
          }
        }

        if (Input.getType(input2) === Input.Type.SINGLESELECTION) {
          let selectedItem2 = DesignCore.Scene.getItem(input2.selectedItemIndex);
          if ([Line, BasePolyline].some((entity) => selectedItem2 instanceof entity)) {
            // if a polyline is selected, get the segment closest to the mouse point
            if (selectedItem2 instanceof BasePolyline) {
              // get the segment closest to the mouse point
              const segment = selectedItem2.getClosestSegment(input2.selectedPoint);

              if (segment instanceof Line) {
                selectedItem2 = segment;
              }
            }
            // Check lines intersect
            const line1 = { start: this.selectedItems[0].points[0], end: this.selectedItems[0].points[1] };
            const line2 = { start: selectedItem2.points[0], end: selectedItem2.points[1] };

            // Check the lines are not parallel - Can't dimension parallel lines
            const lineOneSlope = (line1.end.y - line1.start.y) / (line1.end.x - line1.start.x);
            const lineTwoSlope = (line2.end.y - line2.start.y) / (line2.end.x - line2.start.x);

            if (Utils.round(lineOneSlope) !== Utils.round(lineTwoSlope)) {
              const intersect = Intersection.intersectLineLine(line1, line2, true);
              if (intersect.points.length >= 1) {
              // add line to selection
                this.selectedItems.push(selectedItem2);
                // Two lines selected - switch to angular dimension
                this.dimType.setDimType(2);
              }
            } else {
              const msg = `${this.type} - ${Strings.Error.SELECTION}: ${Strings.Error.PARALLELLINES}`;
              DesignCore.Core.notify(msg);
              DesignCore.Scene.selectionManager.removeLastSelection();
            }
          } else {
            const msg = `${this.type} - ${Strings.Error.INVALIDTYPE}: ${selectedItem2.type}`;
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
   * Determine if linear dimension is aligned or rotated
   * @param {Point} Pt13 - start point
   * @param {Point} Pt14 - end point
   * @param {Point} Pt11 - text position
   * @return {number} 0 = rotated, 1 = aligned
   */
  getLinearDimensionType(Pt13, Pt14, Pt11) {
    // generate the x and y delta values
    const dx = Pt14.x - Pt13.x;
    const dy = Pt14.y - Pt13.y;

    const pntPerp = Pt11.perpendicular(Pt13, Pt14);
    const isAligned = pntPerp.isOnLine(Pt13, Pt14);

    if (!isAligned || Utils.round(dx) === 0 || Utils.round(dy) === 0) {
      // Rotated dimension
      return 0;
    } else {
      // Aligned dimension
      return 1;
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (this.selectedItems.length) {
      let dimTypeNumber = this.dimType.getBaseDimType();

      const Pt11 = DesignCore.Mouse.pointOnScene();
      Pt11.sequence = 11;

      if (dimTypeNumber === 0 || dimTypeNumber === 1) {
        // for linear dimensions, determine if aligned or rotated based on mouse position
        const Pt13 = this.selectedItems[0].points[0];
        const Pt14 = this.selectedItems[0].points[1];
        dimTypeNumber = this.getLinearDimensionType(Pt13, Pt14, Pt11);
      }
      // get the dimension class
      const dimensionType = this.dimensionMap[dimTypeNumber];
      // get the dimension type as a string
      const dimensionTypeString = dimensionType.register().command;
      // get the points for the dimension
      const points = dimensionType.getPointsFromSelection(this.selectedItems, Pt11);
      // create the temporary dimension
      DesignCore.Scene.createTempItem(dimensionTypeString, { points: points, dimensionStyle: this.dimensionStyle });
    }
  }
}
