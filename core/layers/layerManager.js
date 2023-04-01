
import {Layer} from './layer.js';

export class LayerManager {
  constructor(core) {
    this.layers = [];
    this.currentLayer = '0';
    this.core = core;

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
    // console.log('New Layer Name:' + layStr);
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
    // TODO: investigate why this gets called so many times when loading drawings
    // console.log(' layermanager.js - addlayer() - New Layer Added:' + layer.name);
    if (!this.layerExists(newLayer)) {
      // console.log(' layermanager.js - addlayer() - New Layer Added:' + newLayer.name);
      this.layers.push(newLayer);
      this.core.scene.saveRequired();
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
      // console.log('Warning: DEFPOINTS layer cannot be deleted');
      return;
    }

    const selectionSet = [];

    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (this.core.scene.items[i].layer === layerToDelete) {
        selectionSet.push(i);
      }
    }

    // console.log(selectionSet.length, ' Item(s) to be deleted from ', layerToDelete);

    selectionSet.sort();
    for (let j = 0; j < selectionSet.length; j++) {
      this.core.scene.items.splice((selectionSet[j] - j), 1);
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
      // console.log('layermanager.js - Check Layers -> Add Standard Layers');
      this.addStandardLayers();
    }

    for (let i = 0; i < this.core.scene.items.length; i++) {
      const layer = (this.core.scene.items[i].layer);
      this.addLayer({
        'name': layer,
      });
    }
  }

  addStandardLayers() {
    this.addLayer({
      'name': '0',
      'colour': '#00BFFF',
    });
    this.addLayer({
      'name': 'DEFPOINTS',
      'plotting': false,
    });
    this.core.scene.saveRequired();
  }


  layerVisible(layer) {
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name === layer) {
        if (this.layers[i].on || this.layers[i].frozen) {
          return true;
        }

        return false;
        break;
      }
    }
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

    if (this.getLayerByIndex(layerIndex).name.toUpperCase() !== 'DEFPOINTS') {
      if (this.getLayerByIndex(layerIndex).name === this.getCLayer()) {
        this.setCLayer(newUniqueName);
        // console.log('[Layernamanger.renameLayer] - set new Clayer name');
      }

      this.layers[layerIndex].name = newUniqueName;
    }
  }
}
