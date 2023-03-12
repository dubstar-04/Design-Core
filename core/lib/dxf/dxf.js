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
        const points = [];
        entity.points.forEach((point) => {
          const pt = new Point(point.x, point.y);
          points.push(pt);
        });
        entity.points = points;
      }

      const type = entity[0].trim().toUpperCase();

      // TODO: Handle LWPOLYLINE properly
      if (type === 'LWPOLYLINE') {
        entity[0] = 'Polyline';
      }

      const entityCommand = core.commandManager.getCommand(entity[0]);
      core.scene.addToScene(entityCommand, entity);
    });
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
