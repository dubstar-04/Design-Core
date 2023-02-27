export class Entity {
  constructor(data) {
    Object.defineProperty(this, 'type', {
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    Object.defineProperty(this, 'family', {
      enumerable: false,
      value: 'Geometry',
      writable: true,
    });

    Object.defineProperty(this, 'showPreview', {
      enumerable: false,
      value: true,
      writable: true,
    });

    Object.defineProperty(this, 'helper_geometry', {
      enumerable: false,
      value: false,
      writable: true,
    });

    Object.defineProperty(this, 'points', {
      enumerable: false,
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'minPoints', {
      enumerable: false,
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'trueColour', {
      enumerable: false,
      writable: true,
    });

    this.lineWidth = 2;
    this.colour = 'BYLAYER';
    this.layer = '0';


    if (data) {
      if (data.points) {
        this.points = data.points;
      }

      if (data.colour) {
        this.colour = data.colour;
      }

      if (data.trueColour) {
        this.trueColour = data.trueColour;
      }

      if (data.layer) {
        this.layer = data.layer;
      }
    }
  }

  getColour(core) {
    let colour = this.colour;

    if (this.colour === 'BYLAYER') {
      const layer = core.layerManager.getLayerByName(this.layer);
      colour = layer.getColour();
    }

    if (this.trueColour !== undefined) {
      colour = this.trueColour;
    }

    return colour;
  }


  within(selectionExtremes, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    // determin if this entities is within a the window specified by selectionExtremes
    const extremePoints = this.extremes();
    if ( extremePoints[0] > selectionExtremes[0] &&
         extremePoints[1] < selectionExtremes[1] &&
         extremePoints[2] > selectionExtremes[2] &&
         extremePoints[3] < selectionExtremes[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  extend(points, core) {
    // extend function to be overidden by implementation
  }

  trim(points, core) {
    // trim function to be overidden by implementation
  }
}
