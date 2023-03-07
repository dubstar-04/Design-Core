import {DXF} from './dxf/dxf.js';
import {Strings} from './strings.js';

import {DXFReader} from './dxf/dxfRead.js';
import {Point} from '../entities/point.js';
import {Colours} from '../lib/colours.js';

export class FileIO {
  static saveDxf(core) {
    const dxfWriter = new DXF();
    const data = dxfWriter.write(core);
    return data;
  }

  static openFile(core, data) {
    const dxfReader = new DXFReader();
    dxfReader.read(data);
    this.loadDxf(core, dxfReader);


    core.canvas.requestPaint();
    core.notify(Strings.Message.FILEOPEN);
  }

  static loadDxf(core, dxfReader) {
    const tables = dxfReader.tables.tables;

    tables.forEach((table) => {
      // console.log('Entity:', entity);

      if (table[0] === 'LAYER') {
        const layer = {};

        for (const [code, value] of Object.entries(table)) {
        // console.log(`${code}: ${value}`);

          this.parseGroupCode(code, value, layer);
        }

        log(layer);

        core.layerManager.addLayer(layer);
      }
    });

    const entities = dxfReader.entities.entities;

    entities.forEach((entity) => {
      // console.log('Entity:', entity);

      const data = {points: []};

      for (const [code, value] of Object.entries(entity)) {
        // console.log(`${code}: ${value}`);
        this.parseGroupCode(code, value, data);
      }

      if (entity.hasOwnProperty('points')) {
        entity.points.forEach((point) => {
          const pt = new Point(point.x, point.y);
          data.points.push(pt);
        });
      }


      const type = entity[0].trim().toLowerCase();
      let formattedType = type.charAt(0).toUpperCase() + type.slice(1);


      if (formattedType === 'Lwpolyline') {
        formattedType = 'Polyline';
      }

      log('addToScene:', formattedType, data);

      core.scene.addToScene(formattedType, data);
    });
  }

  static parseGroupCode(code, value, data) {
    const groupCode = parseInt(code);
    switch (groupCode) {
      case -1: // Entity Name (changes each time a drawing is opened)
        break;
      case 0: // Entity Type
        break;
      case 1: // default string
        break;
      case 2: // name follows
        data.name = value.trim();
        break;
      case 3: // prompt string
        break;
      case 5: // handle name
        break;
      case 6: // Linetype name (if not BYLAYER) (Optional)
        break;
      case 7: // Text style name (optional, default = STANDARD)
        break;
      case 8: // Layer name
        data.layer = value.trim();
        break;
      case 10: // primary point X
        break;
      case 11: // secondary  point X
        break;
      case 12: // tertiary  point X
        break;
      case 13: // quaternary point X
        break;
      case 20: // primary point Y
        break;
      case 21: // secondary point Y
        break;
      case 22: // tertiary point Y
        break;
      case 23: // quaternary point Y
        break;
      case 30: // primary point Z
        break;
      case 31: // secondary point Z
        break;
      case 32: // tertiary point Z
        break;
      case 33: // quaternary point Z
        break;
      case 39: // Thickness (optional; default = 0)
        break;
      case 40: // Start width (optional; default = 0;) Not used if 43 set
        data.radius = parseFloat(value);
        break;
      case 41: // End width (optional; default = 0;) Not used if 43 set
        break;
      case 42: // Bulge (optional; default = 0)
        break;
      case 43: // Constant width (optional; default = 0). Not used if 40 /41 set
        break;
      case 48: // Linetype scale (optional)
        break;
      case 50: // start angle
        break;
      case 51: // end angle
        break;
      case 60: // Visibility 0 = Visible; 1 = Invisible (optional)
        break;
      case 62: // color index if not BYLAYER); 0 = BYBLOCK, 256 = BYLAYER; negative = off (optional)
        data.colour = Colours.getHexColour(parseInt(value));
        break;
      case 70: // flags
        break;
      case 71: // Attachment point
        break;
      case 72: // Drawing direction
        break;
      case 73: // control points
        break;
      case 90: // Background fill (0 = off, 1 = Use fill color, 2 = Use drawing window color
        break;
      case 91: // Vertex id
        break;
      case 92: // Bytes in subsequent 310 groups (optional)
        break;
      case 100: // Subclass marker (AcDbEntity)
        break;
      case 102: // start / end of group (optional)
        break;
      case 210: // Extrusion direction X
        break;
      case 220: // Extrusion direction Y
        break;
      case 230: // Extrusion direction Z
        break;
      case 284: // shadow mode 0 = Casts and receives shadows 1 = Casts shadows 2 = Receives shadows 3 = Ignores shadows
        break;
      case 310: // Proxy entity graphics (optional)
        break;
      case 330: // Dictionary id (optional)
        break;
      case 347: // Material id (if not BYLAYER)
        break;
      case 360: // Owner id (optional)
        break;
      case 370: // Line weight
        break;
      case 390: // Plot style id
        break;
      case 410: // Layout tabname
        break;
      case 420: // True color
        break;
      case 430: // Color name
        break;
      case 440: // Transparency
        break;
      default:
        // console.log(`unknown group code: ${code}`);
        break;
    }
  }
}
