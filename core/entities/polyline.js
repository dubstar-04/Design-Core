import {BasePolyline} from './basePolyline.js';
import {Point} from './point.js';

export class Polyline extends BasePolyline {
  constructor(data) {
    super(data);

    if (data) {
      if (data.children) {
      // remove any points
      // point data comes from the vertices
        if (data.points) {
          this.points = [];
        }

        data.children.forEach((child) => {
          if (child[0] === 'VERTEX') {
            child.points.forEach((point) => {
              const pt = new Point(point.x, point.y);
              if (point.hasOwnProperty('bulge')) {
                pt.bulge = point.bulge;
              }
              this.points.push(pt);
            });
          }
        });
      }
    }
  }

  static register() {
    const command = {command: 'Polyline', shortcut: 'PL', type: 'Entity'};
    return command;
  }

  dxf() {
    const vertices = this.vertices();
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'POLYLINE',
        // "\n", "5", //HANDLE
        // "\n", "DA",
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '10', // X
        '\n', '0',
        '\n', '20', // Y
        '\n', '0',
        '\n', '30', // Z
        '\n', '0',
        '\n', '39', // Line Width
        '\n', this.lineWidth,
        '\n', '70', // Flags
        '\n', this.flags,
        // "\n", "100", //Subclass marker
        // "\n", "AcDb2dPolyline",
        vertices, // Dont use a new line here as the vertex data will start with a new line.
        '\n', '0',
        '\n', 'SEQEND', // END OF SEQUENCE
        '\n', '8', // LAYERNAME
        '\n', this.layer,
    );
    return data;
  }

  vertices() {
    let verticesData = '';
    for (let i = 0; i < this.points.length; i++) {
      verticesData = verticesData.concat(
          '\n', '0',
          '\n', 'VERTEX',
          // "\n", "5", //HANDLE
          // "\n", "DA",
          '\n', '8', // LAYERNAME
          '\n', '0',
          // "\n", "100",
          // "\n", "AcDbVertex",
          // "\n", "100",
          // "\n", "AcDb2dVertex",
          '\n', '10', // X
          '\n', this.points[i].x,
          '\n', '20', // Y
          '\n', this.points[i].y,
          '\n', '30', // Z
          // "\n", "0",
          // "\n", "0",
          '\n', '0',
      );
    }

    return verticesData;
  }
}
