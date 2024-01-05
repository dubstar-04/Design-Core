
import {Layer} from './layer.js';
import {Strings} from '../lib/strings.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';

import {DesignCore} from '../designCore.js';

export class LayerManager {
  constructor() {
    this.layers = [];
    this.currentLayer = '0';

    this.addStandardLayers();
  }


  getLayers() {
    return this.layers;
  }

  layerCount() {
    return this.layers.length;
  }

  newLayer() {
    this.addLayer({
      'name': this.getUniqueName('NEW_LAYER'),
    });
  }

  getUniqueName(name) {
    let count = 0;
    let layStr = name.replace(/ /g, '_').toUpperCase();
    for (let i = 0; i < this.layerCount(); i++) {
      if (this.layers[i].name.includes(layStr)) {
        count = count + 1;
      }
    }
    if (count > 0) {
      layStr = layStr + '_' + count;
    }

    return layStr;
  };

  addLayer(layer) {
    const newLayer = new Layer(layer);
    // This is called multiple times from the check layers function when opening files
    if (!this.layerExists(newLayer)) {
      this.layers.push(newLayer);
      // DesignCore.Scene.saveRequired();
    }
  }

  deleteLayerName(layerName) {
    // delete layer for layerName
    this.deleteLayer(this.getLayerIndex(layerName));
  }

  deleteLayer(layerIndex) {
    // delete layer for layerIndex
    const layerToDelete = this.getLayerByIndex(layerIndex).name;

    if (layerToDelete.toUpperCase() === 'DEFPOINTS') {
      // DEFPOINTS layer cannot be deleted
      DesignCore.Core.notify(Strings.Message.DEFPOINTSDELETE);
      return;
    }

    if (layerToDelete === this.currentLayer) {
      // cLayer cannot be deleted
      DesignCore.Core.notify(Strings.Message.CLAYERDELETE);
      return;
    }

    const selectionSet = [];

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      if (DesignCore.Scene.items[i].layer === layerToDelete) {
        selectionSet.push(i);
      }
    }

    selectionSet.sort();
    for (let j = 0; j < selectionSet.length; j++) {
      DesignCore.Scene.items.splice((selectionSet[j] - j), 1);
    }

    // Delete The Layer
    this.layers.splice(layerIndex, 1);
  }

  getCLayer() {
    return this.currentLayer;
  }

  setCLayer(clayer) {
    if (this.getLayerIndex(clayer) !== -1) {
      this.currentLayer = clayer;
    }
  }

  layerExists(layer) {
    const layerExists = this.layers.some((el) => el.name.toUpperCase() === layer.name.toUpperCase());
    return layerExists;
  }

  checkLayers() {
    if (!this.layerCount()) {
      this.addStandardLayers();
    }

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      const layer = (DesignCore.Scene.items[i].layer);
      this.addLayer({
        'name': layer,
      });
    }
  }

  addStandardLayers() {
    this.addLayer({'name': '0', 'colour': '#00BFFF'});
    this.addLayer({'name': 'DEFPOINTS', 'plotting': false});
    this.addLayer({'name': 'CENTERLINE', 'colour': '#FFFF00', 'lineType': 'CENTER'});
    this.addLayer({'name': 'HIDDEN', 'colour': '#D6D6D6', 'lineType': 'HIDDEN'});
    // DesignCore.Scene.saveRequired();
  }

  getLayerIndex(layerName) {
    const index = this.layers.findIndex((el) => el.name === layerName);
    return index;
  }

  getLayerByName(layerName) {
    const index = this.getLayerIndex(layerName);
    if (this.layers[index] !== undefined) {
      return this.layers[index];
    }

    return;
  }

  getLayerByIndex(layerIndex) {
    if (this.layers[layerIndex] !== undefined) {
      return this.layers[layerIndex];
    }

    return;
  }


  renameLayer(layerIndex, newName) {
    const newUniqueName = this.getUniqueName(newName);

    if (this.layers[layerIndex] === undefined) {
      return;
    }

    if (this.getLayerByIndex(layerIndex).name.toUpperCase() !== 'DEFPOINTS') {
      if (this.getLayerByIndex(layerIndex).name === this.getCLayer()) {
        this.setCLayer(newUniqueName);
      }

      this.layers[layerIndex].name = newUniqueName;
    }
  }


  dxf(file) {
    // Create table data for layers
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'LAYER');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.layerCount());

    for (let i = 0; i < this.layerCount(); i++) {
      if (this.getLayerByIndex(i).name !== 'DEFPOINTS') {
        this.getLayerByIndex(i).dxf(file);
      }
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
