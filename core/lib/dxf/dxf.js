import {DXFReader} from './dxfRead.js';
import {DXFWriter} from './dxfWrite.js';
import {Point} from '../../entities/point.js';

export class DXF {
  constructor() {
    this.reader;
    this.writer;
  }

  read(data) {
    this.reader = new DXFReader();
    this.reader.read(data);
  }

  write(core) {
    const writer = new DXFWriter();
    const data = writer.write(core);
    return data;
  }

  loadDxf(core, data) {
    this.read(data);
    this.loadTables(core);
    this.loadEntities(core);
  }

  loadEntities(core) {
    const entities = this.reader.entities;

    entities.forEach((entity) => {
      if (entity.hasOwnProperty('points')) {
        entity.points = this.parsePoints(entity.points);
      }

      const entityCommand = core.commandManager.getCommand(entity[0]);
      core.scene.addToScene(entityCommand, entity);
    });
  }

  parsePoints(dxfPoints) {
    const points = [];
    dxfPoints.forEach((point) => {
      const pt = new Point(point.x, point.y);
      if (point.hasOwnProperty('bulge')) {
        console.log('WARNING: Bulge not handled');
        pt.bulge = point.bulge;
      }
      points.push(pt);
    });
    return points;
  }

  loadTables(core) {
    const tables = this.reader.tables;

    tables.forEach((table) => {
      if (table[2] === 'LAYER') {
        table.children.forEach((layer) => {
          core.layerManager.addLayer(layer);
        });
      }
    });
  }
}
