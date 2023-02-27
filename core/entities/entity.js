export class Entity {
  constructor(data) {
    this.type = 'Entity';
    this.family = 'Geometry';
    this.showPreview = true; // show preview of item as its being created
    this.helper_geometry = false; // If true a line will be drawn between points when defining geometry
    this.points = [];
    this.lineWidth = 2;
    this.colour = 'BYLAYER';
    this.trueColour;
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

  getColour() {
    if (this.trueColour !== undefined) {
      return this.trueColour;
    }

    return this.colour;
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
