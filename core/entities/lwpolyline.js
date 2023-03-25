import {BasePolyline} from './basePolyline.js';

export class Lwpolyline extends BasePolyline {
  constructor(data) {
    super(data);

    if (data) {
      if (data[90]) {
        // DXF Groupcode 90 - Number of vertices
        if (this.points.length !== data[90]) {
          log(`ERROR: LWPOLYLINE Vertices Count`);
        }
      }
    }
  }

  static register() {
    const command = {command: 'Lwpolyline', shortcut: 'PL', type: 'Entity'};
    return command;
  }

  dxf() {
    let pointData = '';
    this.points.forEach((point) => {
      pointData = pointData.concat(
          '\n', '10', // X
          '\n', point.x,
          '\n', '20', // Y
          '\n', point.y,
          '\n', '30', // Z
          '\n', '0',
      );
    });

    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'LWPOLYLINE',
        // "\n", "5", //HANDLE
        // "\n", "DA",
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '39', // Line Width
        '\n', this.lineWidth,
        '\n', '70', // Flags
        '\n', this.flags,
        '\n', '90', // Vertex count
        '\n', this.points.length,
        pointData,

    );
    console.log(' lwpolyline.js - DXF Data:' + data);
    return data;
  }
}
