import {Colours} from '../colours.js';
import {Utils} from '../utils.js';
import {Point} from '../../entities/point.js';

export class DXFReader {
  constructor() {
    this.line = '';
    this.lines = [];
    this.lineNum = 0;
    this.core = {};
    this.processed = 0;
    this.blockName = '';
  }

  read(core, data) {
    this.core = core;
    this.lines = data.split('\n');
    this.processData();
  }

  getDXFLine() {
    this.line = this.lines[this.lineNum].replace(/\s+/, '');
    this.lineNum = this.lineNum + 1;
    if (Math.round((this.lineNum / this.lines.length) * 100) > this.processed) {
      this.processed = Math.round((this.lineNum / this.lines.length) * 100);
      // console.log('Progress:' + this.processed + '%');
    }
  }

  addElementToScene(type, data) {
    if (this.blockName !== '' || type == 'Insert') {
      const name = data.name ? data.name : this.blockName;
      this.core.scene.addItemToBlock(type, data, name);
    } else {
      this.core.scene.addToScene(type, data);
    }
  }

  previewNextLine() {
    // Read the next available line - NOTE: getDXFLine increments this.LineNum, therefore this.lineNum is the next line.
    return this.lines[this.lineNum].replace(/\s+/, '');
  }

  processData() {
    while (this.lineNum < this.lines.length) {
      this.getDXFLine();

      switch (this.line) {
        case '$CLAYER':
          // Current layer name
          // debugLog("Found " + this.line)
          const clayer = this.readHeader(8);
          this.core.layerManager.setCLayer(clayer);
          break;

        case '$LIMMIN':
          // X, Y drawing extents lower-left corner (in WCS)
          // debugLog("Found " + this.line)
          break;

        case '$LIMMAX':
          // X, Y drawing extents upper-right corner (in WCS)
          // debugLog("Found " + this.line)
          break;

        case '$FILLETRAD':
          // Fillet radius
          // debugLog("Found " + this.line)
          break;

        case '$MEASUREMENT':
          // Sets drawing units: 0 = English; 1 = Metric
          // debugLog("Found " + this.line)
          break;

        case '$ORTHOMODE':
          // Ortho mode on if nonzero
          // debugLog("Found " + this.line)
          break;

        case '$ANGDIR':
          // 1 = Clockwise angles, 0 = Counterclockwise
          // debugLog("Found " + this.line)
          break;

        case '$CELWEIGHT':
          // Lineweight of new objects
          // debugLog("Found " + this.line)
          break;

        case '$CEPSNTYPE':
          // Plotstyle type of new objects:
          // 0 = PlotStyle by layer
          // 1 = PlotStyle by block
          // 2 = PlotStyle by dictionary default
          // 3 = PlotStyle by object ID/handle
          // debugLog("Found " + this.line)
          break;

        case '$ENDCAPS':
          // Lineweight endcaps setting for new objects:
          // 0 = none; 1 = round; 2=angle; 3=square
          // debugLog("Found " + this.line);
          break;

        case '$MEASUREMENT':
          break;

        case 'AcDbBlockBegin':
          break;

        case '0':
          break;

        case 'SECTION':
          // debugLog("Found " + this.line)
          break;

        case 'TABLE':
          // debugLog("Found " + this.line)
          break;

        case 'LAYER':
          // ////// console.log("Found " + this.line)
          this.readLayer();
          break;

        case 'BLOCKS':
          // debugLog("Found " + this.line)
          break;

        case 'BLOCK':
          // debugLog("Found " + this.line)
          this.readBlock();
          break;

        case 'INSERT':
          this.readInsert();
          break;

        case 'ENDBLK':
          // //// console.log("Close Block:", this.blockName);
          this.blockName = '';
          break;

        case 'ENDSEC':
          // debugLog("Found " + this.line)
          break;

        case 'VPORT':
          // debugLog("found " + this.line)
          this.readVPort();
          break;

        case 'EOF':
          // debugLog("Found " + this.line)
          return;

          //
          // //////// ENTITIES //////////
          // Listed in alphabetical order

        case 'ARC':
          // debugLog("Found " + this.line)
          this.readArc();
          break;

        case 'ARCALIGNEDTEXT':
          // debugLog("Found " + this.line)
          // this.readArcAlignedText();
          break;

        case 'CIRCLE':
          // debugLog("Found " + this.line)
          this.readCircle();
          break;

        case 'DIMENSION':
          // debugLog("Found " + this.line)
          this.readDimension();
          break;

        case 'DIMSTYLE':
          // debugLog("Found " + this.line)
          this.readDimStyle();
          break;

        case 'ELLIPSE':
          // debugLog("Found " + this.line)
          this.readEllipse();
          break;

        case 'IMAGE':
          // debugLog("Found " + this.line)
          // this.readImage();
          break;

        case 'LINE':
          // debugLog("Found " + this.line)
          this.readLine();
          break;

        case 'LWPOLYLINE':
          // debugLog("Found " + this.line)
          this.readLwpolyline();
          break;

        case 'MTEXT':
          // debugLog("Found " + this.line)
          // this.readText();
          break;

        case 'POINT':
          // debugLog("Found " + this.line)
          this.readPoint();
          break;

        case 'POLYLINE':
          // debugLog("Found " + this.line)
          this.readPolyline();
          break;

        case 'SPLINE':
          // debugLog("Found " + this.line)
          this.readSpline();
          break;

        case 'TEXT':
          // debugLog("Found " + this.line)
          this.readText();
          break;

        case 'STYLE':
          // debugLog("Found " + this.line)
          this.readStyle();
          break;
      }
    }

    // Finished reading entities.
    // TODO: dxf shouldn't access the app, it should work as an external lib.
  }

  readHeader(groupCode) {
    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      switch (n) {
        case groupCode:
          this.getDXFLine();
          // debugLog("Group Code " + groupCode + ": " + this.line);
          return this.line;
        case 9:
          return;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }

  readBlock() {
    // Create the points required for a circle
    const points = [];
    const point = new Point();
    let flags = '';
    let name = '';
    let colour = 'BYLAYER';
    let layer = '0';


    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("readCircle: " + n)
      switch (n) {
        case 0:
          // next item found, so finish with Block
          // Push the points to the points array and pass it to the Scene
          points.push(point); // TO DO: Check the points are valid before they are pushed.


          const block = {
            name: name,
            points: points,
            flags: flags,
            colour: colour,
            layer: layer,
          };

          this.addElementToScene('Block', block);

          // set the current block name to add to preceeding elements;
          this.blockName = name;
          // //// console.log("Open Block:", this.blockName)

          return;
        case 2: // name follows
          this.getDXFLine();
          name = this.line;
          break;
        case 5: // handle name follows
          this.getDXFLine();
          // debugLog("Handle name: " + this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          layer = this.line;
          break;
        case 10: // X
          this.getDXFLine();
          point.x = Number(this.line);
          break;
        case 20: // Y
          this.getDXFLine();
          point.y = Number(this.line);
          break;
        case 30: // Z
          this.getDXFLine();
          break;
        case 62: // color index
          this.getDXFLine();
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 70:
          this.getDXFLine();
          flags = this.line;
          break;
        default:
          // skip the next line
          // this.getDXFLine();
          break;
      }
    }
  }

  readInsert() {
    // Create the points required for a circle
    const points = [];
    const point = new Point();
    let block = '';
    let colour = 'BYLAYER';
    let layer = '0';


    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("readCircle: " + n)
      switch (n) {
        case 0:
          // next item found, so finish with Circle
          // Push the points to the points array and pass it to the Scene
          points.push(point); // TO DO: Check the points are valid before they are pushed.


          const insert = {
            name: block,
            points: points,
            colour: colour,
            layer: layer,
          };

          this.addElementToScene('Insert', insert);

          return;
        case 2: // name follows
          this.getDXFLine();
          block = this.line;
          break;
        case 5: // handle name follows
          this.getDXFLine();
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          layer = this.line;
          break;
        case 10: // X
          this.getDXFLine();
          point.x = Number(this.line);
          break;
        case 20: // Y
          this.getDXFLine();
          point.y = Number(this.line);
          break;
        case 30: // Z
          this.getDXFLine();
          break;
        case 62: // color index
          this.getDXFLine();
          colour = Colours.getHexColour(Number(this.line));
          break;
        default:
          // skip the next line
          // this.getDXFLine();
          break;
      }
    }
  }


  readLayer() {
    let name = '';
    // const handle = "";
    let flags = 0;
    let colour = '#ffffff';
    let lineType = 'Continuous';
    let lineWeight = 'Default';
    let plotting = true;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line); // what if its not an int? (layername or handle)
      // debugLog("readLine: " + n)
      switch (n) {
        case 0:
          // next item found, so finish with line

          // ////// console.log(name, colour)
          const layer = {
            name: name,
            flags: flags,
            colour: colour,
            lineType: lineType,
            lineWeight: lineWeight,
            plotting: plotting,
          };

          if (name) {
            this.core.layerManager.addLayer(layer);
          }
          return;
        case 2: // Layer name follows
          this.getDXFLine(); ;
          // debugLog("Layer name: " + this.line);
          name = this.line;
          break;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine();
          // debugLog("Line Type: " + this.line);
          lineType = this.line;
          break;
        case 62:
          // color index
          this.getDXFLine();
          // colour = Colours.getHexColour(Number(this.line));
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 70:
          // Standard flags (bit-coded values):
          // 1 = Layer is frozen; otherwise layer is thawed.
          // 2 = Layer is frozen by default in new viewports.
          // 4 = Layer is locked.
          // 16 = If set, table entry is externally dependent on an xref.
          // 32 = If this bit and bit 16 are both set, the externally dependent xref has been successfully resolved.
          // 64 = If set, the table entry was referenced by at least one entity in the drawing the last time the drawing was edited. (This flag is for the benefit of AutoCAD commands. It can be ignored by most programs that read DXF files and need not be set by programs that write DXF files.)
          this.getDXFLine();
          // debugLog("Flags:" + this.line);
          flags = Number(this.line);
          break;
        case 100:
          this.getDXFLine();
          // debugLog("DXF Readline 100");
          break;
        case 39:
          this.getDXFLine();
          // debugLog("DXF Readline 39");
          break;
        case 210:
          this.getDXFLine();
          // debugLog("DXF Readline 210");
          break;
        case 220:
          this.getDXFLine();
          // debugLog("DXF Readline 220");
          break;
        case 230:
          // skip the next line
          this.getDXFLine();
          break;
        case 330:
          // Plotting
          this.getDXFLine();
          // debugLog("Plotting: " + this.line);
          plotting = Number(this.line);
          break;
        case 370:
          // Line weight
          this.getDXFLine();
          // debugLog("Line Weight: " + this.line);
          lineWeight = this.line;
          break;
        case 390:
          // skip the next line
          this.getDXFLine();
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }

  readLine() {
    // Create the points required for a line
    const points = [];
    const pointStart = new Point();
    const pointEnd = new Point();
    let colour = 'BYLAYER';
    let layer = '0';

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line); // what if its not an int? (layername or handle)
      // debugLog("readLine: " + n)
      switch (n) {
        case 0:
          // next item found, so finish with line
          // Push the points to the points array and pass it to the Scene
          points.push(pointStart); // TO DO: Check the points are valid before they are pushed.
          points.push(pointEnd);

          const line = {
            points: points,
            colour: colour,
            layer: layer,
          };

          this.addElementToScene('Line', line);
          return;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine();
          // debugLog(this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("Layer name: " + this.line);
          layer = this.line;
          break;
        case 10:
          // start x
          this.getDXFLine();
          pointStart.x = Number(this.line);
          // debugLog("startx: " + this.line);
          break;
        case 20:
          // start y
          this.getDXFLine();
          pointStart.y = Number(this.line);
          // debugLog("starty: " + this.line);
          break;
        case 30:
          // start z
          this.getDXFLine();
          // debugLog("startz: " + this.line);
          break;
        case 11:
          // end x
          this.getDXFLine();
          pointEnd.x = Number(this.line);
          // debugLog("endx: " + this.line);
          break;
        case 21:
          // end y
          this.getDXFLine();
          pointEnd.y = Number(this.line);
          // debugLog("endy: " + this.line);
          break;
        case 31:
          // end z
          this.getDXFLine();
          // debugLog("endz: " + this.line);
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 100:
          this.getDXFLine();
          // debugLog("DXF Readline 100");
          break;
        case 39:
          this.getDXFLine();
          // debugLog("DXF Readline 39");
          break;
        case 210:
          this.getDXFLine();
          // debugLog("DXF Readline 210");
          break;
        case 220:
          this.getDXFLine();
          // debugLog("DXF Readline 220");
          break;
        case 230:
          // skip the next line
          this.getDXFLine();
          break;
        default:
          // skip the next line
          // this.getDXFLine();
          break;
      }
    }
  }


  readCircle() {
    // Create the points required for a circle
    const points = [];
    const pointCentre = new Point();
    const pointRadius = new Point();
    let colour = 'BYLAYER';
    let layer = '0';

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("readCircle: " + n)
      switch (n) {
        case 0:
          // next item found, so finish with Circle
          // Push the points to the points array and pass it to the Scene
          points.push(pointCentre); // TO DO: Check the points are valid before they are pushed.
          points.push(pointRadius);
          // alsothis.addElementToScene("Circle", points, colour);

          const circle = {
            points: points,
            colour: colour,
            layer: layer,
          };

          this.addElementToScene('Circle', circle);

          return;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine(); ;
          // debugLog(this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine(); ;
          // debugLog("Layer name: " + this.line);
          layer = this.line;
          break;
        case 10:
          // centre x
          this.getDXFLine();
          // debugLog("centre x: " + this.line);
          pointCentre.x = Number(this.line);
          break;
        case 20:
          // centre y
          this.getDXFLine();
          // debugLog("centre y: " + this.line);
          pointCentre.y = Number(this.line);
          break;
        case 30:
          // centre z
          this.getDXFLine();
          // debugLog("centre z: " + this.line);
          break;
        case 40:
          // radius
          this.getDXFLine();
          // debugLog("radius: " + this.line);
          pointRadius.x = Number(pointCentre.x) + Number(this.line);
          // debugLog("\npointRadius " + pointRadius.x)
          pointRadius.y = pointCentre.y;
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog(this.line);
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 100:
          this.getDXFLine();
          // debugLog("DXF Readline 100");
          break;
        case 39:
          this.getDXFLine();
          // debugLog("DXF Readline 39");
          break;
        case 210:
          this.getDXFLine();
          // debugLog("DXF Readline 210");
          break;
        case 220:
          this.getDXFLine();
          // debugLog("DXF Readline 200");
          break;
        case 230:
          // skip the next line
          this.getDXFLine(); ;
          break;
        default:
          // skip the next line
          // this.getDXFLine();;
          break;
      }
    }
  }

  readDimension() {
    // Create the points required for a dimension
    const points = [];
    const point102030 = new Point();
    const point112131 = new Point(); // pt3
    const point132333 = new Point(); // pt1
    const point142434 = new Point(); // pt2
    const point152535 = new Point();
    let dimType = 0;
    let leaderLength = 0;
    let angle = 0;
    let blockName = '';
    const colour = 'BYLAYER';
    let layer = '0';

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      switch (n) {
        case 0:
          // next item found, so finish with dimension
          // Push the points to the points array and pass it to the Scene
          points.push(point132333); // TO DO: Check the points are valid before they are pushed.
          points.push(point142434);
          points.push(point112131);
          points.push(point102030);
          points.push(point152535);

          const dimension = {
            points: points,
            colour: colour,
            layer: layer,
            blockName: blockName,
            dimType: dimType,
            leaderLength: leaderLength,
            angle: angle,
          };

          this.addElementToScene('Dimension', dimension);
          return;
        case 1: // Dimension Text String
          this.getDXFLine();
          break;
        case 2: // BLOCK name follows
          this.getDXFLine();
          blockName = this.line;
          break;
        case 5: // handle name follows
          this.getDXFLine();
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          layer = this.line;
          break;
        case 10: // X - DEFINITION / ARROW POINT
          this.getDXFLine();
          point102030.x = Number(this.line);
          break;
        case 20: // Y - DEFINITION / ARROW POINT
          this.getDXFLine();
          point102030.y = Number(this.line);
          break;
        case 30:
          // centre z
          this.getDXFLine();
          break;
        case 11: // x - TEXT MIDPOINT
          this.getDXFLine();
          point112131.x = Number(this.line);
          break;
        case 21: // Y - TEXT MIDPOINT
          this.getDXFLine();
          point112131.y = Number(this.line);
          break;
        case 31: // Z - TEXT MIDPOINT
          this.getDXFLine();
          break;
        case 13: // X - START POINT OF FIRST EXTENSION LINE
          this.getDXFLine();
          point132333.x = Number(this.line);
          break;
        case 23: // Y - START POINT OF FIRST EXTENSION LINE
          this.getDXFLine();
          point132333.y = Number(this.line);
          break;
        case 33: // Z - START POINT OF FIRST EXTENSION LINE
          this.getDXFLine();
          break;
        case 14: // X - START POINT OF SECOND EXTENSION LINE
          this.getDXFLine();
          point142434.x = Number(this.line);
          break;
        case 24: // Y - START POINT OF SECOND EXTENSION LINE
          this.getDXFLine();
          point142434.y = Number(this.line);
          break;
        case 34: // Z - START POINT OF SECOND EXTENSION LINE
          this.getDXFLine();
          break;
        case 15: // X
          this.getDXFLine();
          point152535.x = Number(this.line);
          // //// console.log("pt 15", this.line)
          break;
        case 25: // Y
          this.getDXFLine();
          point152535.y = Number(this.line);
          break;
        case 35: // Z
          this.getDXFLine();
          break;
        case 40: // Leader length for radius and diameter dimensions
          this.getDXFLine();
          leaderLength = Number(this.line);
          break;
        case 50: // Angle of rotated, horizontal or vertical linear dimensions
          this.getDXFLine();
          angle = Number(this.line);
          break;
        case 70: // //DIMENSION TYPE
          this.getDXFLine();
          dimType = Number(this.line);
          break;
        default:
          // skip the next line
          // this.getDXFLine();;
          break;
      }
    }
  }


  readPoint() {
    // let colour = 'BYLAYER';
    // const layer = '0';

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("readPoint: " + n)

      switch (n) {
        case 0:
          // next item found, so finish with Point
          return;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine(); ;
          // debugLog(this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("Layer name: " + this.line);
          // layer = this.line;
          break;
        case 10:
          // start x
          this.getDXFLine();
          // debugLog("Start x: " + this.line);
          break;
        case 20:
          // start y
          this.getDXFLine();
          // debugLog("Start y: " + this.line);
          break;
        case 30:
          // start z
          this.getDXFLine();
          // debugLog("Start Z: " + this.line);
          break;

        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: " + this.line);
          colour = Colours.getHexColour(Number(this.line));
          break;

        case 100:
          this.getDXFLine();
          // debugLog("DXF Readline 100");
          break;
        case 39:
          this.getDXFLine();
          // debugLog("DXF Readline 39");
          break;
        case 210:
          this.getDXFLine();
          // debugLog("DXF Readline 210");
          break;
        case 220:
          this.getDXFLine();
          // debugLog("DXF Readline 220");
          break;
        case 230:
          // skip the next line
          this.getDXFLine();
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }

  readArc() {
    // Create the points required for an Arc
    const points = [];
    const pointCentre = new Point();
    let colour = 'BYLAYER';
    let layer = '0';
    // const point_start = new Point();
    // const point_end = new Point();

    let startAngle = 0;
    let endAngle = 0;
    let radius = 0;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("readArc: " + n)

      switch (n) {
        case 0:
          // next item found, so finish with arc

          const pointStart = new Point(pointCentre.x + (radius * Math.cos(startAngle)), pointCentre.y + (radius * Math.sin(startAngle)));
          const pointEnd = new Point(pointCentre.x + (radius * Math.cos(endAngle)), pointCentre.y + (radius * Math.sin(endAngle)));

          // Push the points to the points array and pass it to the Scene
          points.push(pointCentre); // TO DO: Check the points are valid before they are pushed.
          points.push(pointStart);
          points.push(pointEnd);
          // alsothis.addElementToScene("Arc", points, colour);

          const arc = {
            points: points,
            colour: colour,
            layer: layer,
          };

          this.addElementToScene('Arc', arc);

          return;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine(); ;
          // debugLog(this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("Layer name: " + this.line);
          layer = this.line;
          break;
        case 10:
          // centre x
          this.getDXFLine();
          pointCentre.x = Number(this.line);
          // debugLog("centre X: " + this.line);
          break;
        case 20:
          // centre y
          this.getDXFLine();
          pointCentre.y = Number(this.line);
          // debugLog("centre y: " + this.line);
          break;
        case 30:
          // centre z
          this.getDXFLine();
          // debugLog("centre z: " + this.line);
          break;
        case 40:
          // radius
          this.getDXFLine();
          radius = Number(this.line);
          // debugLog("radius: " + this.line);
          break;
        case 50:
          // start angle
          this.getDXFLine();
          startAngle = Utils.degrees2radians(Number(this.line));
          // debugLog("start angle: " + this.line);
          break;
        case 51:
          // end angle
          this.getDXFLine();
          endAngle = Utils.degrees2radians(Number(this.line));
          // debugLog("end angle: " + this.line);
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 100:
          this.getDXFLine();
          // debugLog("DXF Readline 100");
          break;
        case 39:
          this.getDXFLine();
          // debugLog("DXF Readline 100");
          break;
        case 210:
          this.getDXFLine();
          // debugLog("DXF Readline 100");
          break;
        case 220:
          // skip the next line
          this.getDXFLine();
          break;
        case 230:
          // Z extrusion direction for arc
          this.getDXFLine();
          // debugLog("z extrusion: " + this.line);
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }

  readEllipse() {
    const points = [];
    const pointCentre = new Point();
    let pointMajor = new Point();
    let colour = 'BYLAYER';
    let layer = '0';

    let ratio = 0;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("Group Code: " + n)

      switch (n) {
        case 0:
          // next item found, so finish with Ellipse

          pointMajor = pointMajor.add(pointCentre);
          const angle = pointCentre.angle(pointMajor);
          const distance = pointCentre.distance(pointMajor);
          const pointMinor = new Point();
          pointMinor.x = pointCentre.x + (distance * ratio);
          pointMinor.y = pointCentre.y;
          pointMinor = pointMinor.rotate(pointCentre, angle + (Math.PI / 2));

          // Push the points to the points array and pass it to the Scene
          points.push(pointCentre); // TO DO: Check the points are valid before they are pushed.
          // points.push(point_second);
          points.push(pointMajor);
          points.push(pointMinor);

          const ellipse = {
            points: points,
            colour: colour,
            layer: layer,
          };

          this.addElementToScene('Ellipse', ellipse);

          // alsothis.addElementToScene("Ellipse", points, colour);

          return;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine(); ;
          // debugLog(this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("layer: " + this.line);
          layer = this.line;
          break;
        case 10:
          // centre x
          this.getDXFLine();
          pointCentre.x = Number(this.line);
          // debugLog("centre x: " + this.line);
          break;
        case 20:
          // centre y
          this.getDXFLine();
          pointCentre.y = Number(this.line);
          // debugLog("centre y: " + this.line);
          break;
        case 30:
          // centre z
          this.getDXFLine();
          // debugLog("centre z: " + this.line);
          break;
        case 11:
          // major x
          this.getDXFLine();
          pointMajor.x = Number(this.line);
          // debugLog("major x: " + this.line);
          break;
        case 21:
          // major y
          this.getDXFLine();
          pointMajor.y = Number(this.line);
          // debugLog("major y: " + this.line);
          break;
        case 31:
          // major z
          this.getDXFLine();
          // debugLog("major z: " + this.line);
          break;
        case 40:
          // ratio
          this.getDXFLine();
          ratio = this.line;
          // debugLog("ratio: " + this.line);
          break;
        case 41:
          // start
          this.getDXFLine();
          // debugLog("start: " + this.line);
          break;
        case 42:
          // end
          this.getDXFLine();
          // debugLog("end: " + this.line);
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 100:
          // debugLog("DXF Readline 100");
          this.getDXFLine();
          break;
        case 39:
          // debugLog("DXF Readline 39");
          this.getDXFLine();
          break;
        case 210:
          // debugLog("DXF Readline 210");
          this.getDXFLine();
          break;
        case 220:
          // debugLog("DXF Readline 220");
          this.getDXFLine();
          break;
        case 230:
          // skip the next line
          this.getDXFLine();
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }

  readVertex() {
    const vertex = new Point();
    // debugLog("In VERTEX");
    // let colour = 'BYLAYER';
    // const layer = '0';

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("Group Code: " + n)

      switch (n) {
        case 0:
          this.lineNum = this.lineNum - 1; // read one line too many.  put it back.
          return vertex;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("Layer: " + this.line);
          // layer = this.line;
          break;
        case 10:
          // x
          this.getDXFLine();
          vertex.x = Number(this.line);
          // debugLog("x: " + this.line);
          break;
        case 20:
          // y
          this.getDXFLine();
          vertex.y = Number(this.line);
          // debugLog("y: " + this.line);
          break;
        case 30:
          // z
          this.getDXFLine();
          // debugLog("z: " + this.line);
          break;
        case 40:
          // Starting width (optional; default is 0)
          this.getDXFLine();
          // debugLog("Starting Width: " + this.line);
          break;
        case 41:
          // Ending width (optional; default is 0)
          this.getDXFLine();
          // debugLog("Ending Width: " + this.line);
          break;
        case 42:
          // Bulge (optional; default is 0).
          this.getDXFLine();
          // debugLog("Bulge: " + this.line);
          break;
        case 42:
          // Curve fit tangent direction
          this.getDXFLine();
          // debugLog("Curve fit tangent direction: " + this.line);
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          // colour = Colours.getHexColour(Number(this.line));
          break;
        case 70:
          this.getDXFLine();
          // debugLog("Flags: " + this.line);
          break;
        case 100:
          this.getDXFLine();
          // debugLog("Subclass marker: " + this.line);
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }


  readPolyline() {
    const points = [];
    let colour = 'BYLAYER';
    let layer = '0';
    let vertexFound = false;
    let flags;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("Group Code: " + n)

      switch (n) {
        case 0:
          // next item found

          // debugLog("Preview Next Line: " + this.previewNextLine())

          if (this.previewNextLine() === 'VERTEX') {
            // The next line in the DXF file is a vertex
            this.getDXFLine(); // This Line will be === VERTEX

            if (!vertexFound) {
              vertexFound = true;
            }

            // debugLog("In Polyline - handle VERTEX");
            points.push(this.readVertex());
          } else if (this.previewNextLine() === 'SEQEND') {
            // debugLog("In Polyline - handle SEQEND");
            this.getDXFLine();
          } else if (vertexFound) {
            if (flags === 1) {
              // Flag 1 signifies a closed shape. Copy the first point to the last index.
              const point = new Point();
              point.x = points[0].x;
              point.y = points[0].y;
              points.push(point);
            }

            // debugLog("Polyline points: " + points.length)

            const polyline = {
              points: points,
              colour: colour,
              layer: layer,

            };

            this.addElementToScene('Polyline', polyline);
            // alsothis.addElementToScene("Polyline", points, colour)
            return;
          }
          break;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine(); ;
          // debugLog(this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("layer: " + this.line);
          layer = this.line;
          break;
        case 10:
          // x
          this.getDXFLine();
          // debugLog("x: " + this.line);
          break;
        case 20:
          // y
          this.getDXFLine();
          // debugLog("y: " + this.line);
          break;
        case 30:
          // z
          this.getDXFLine();
          // debugLog("z: " + this.line);
          break;
        case 39:
          // Thickness (optional; default = 0)
          this.getDXFLine();
          // debugLog("Global Width: " + this.line);
          break;
        case 40:
          // Starting width (multiple entries; one entry for each vertex) (optional; default = 0; multiple entries). Not used if constant width (code 43) is se
          this.getDXFLine();
          // debugLog("Start Width: " + this.line);
          break;
        case 41:
          // End width (multiple entries; one entry for each vertex) (optional; default = 0; multiple entries). Not used if constant width (code 43) is set
          this.getDXFLine();
          // debugLog("End Width: " + this.line);
          break;
        case 70:
          // flags
          this.getDXFLine();
          flags = Number(this.line);
          // debugLog("flags: " + this.line);
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 100:
          this.getDXFLine();
          // debugLog("Subclass marker: " + this.line);
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }


  readLwpolyline() {
    const points = [];
    const xArray = [];
    const yArray = [];
    let vertices = 0; // store the number of points contained in the LWpolyline
    let colour = 'BYLAYER';
    let layer = '0';
    let flags;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("Group Code: " + n)

      switch (n) {
        case 0:
          // next item found

          if (vertices > 0 && xArray.length === vertices && yArray.length === vertices) {
            for (let i = 0; i < vertices; i++) {
              const point = new Point();
              point.x = xArray[i];
              point.y = yArray[i];

              points.push(point);

              // //debugLog(i);
              // //debugLog(xArray[i], yArray[i]);
            }

            if (flags === 1) {
              // Flag 1 signifies a closed shape. Copy the first point to the last index.
              const point = new Point();
              point.x = points[0].x;
              point.y = points[0].y;
              points.push(point);
            }

            const polyline = {
              points: points,
              colour: colour,
              layer: layer,
            };

            this.addElementToScene('Polyline', polyline);

            // alsothis.addElementToScene("Polyline", points, colour) //////////////////////////////////////////////  LWPOLYLINE is being represented as a POLYLINE in DESIGN. Does this affect anything?
          }

          return;
        case 5: // handle name follows
          this.getDXFLine(); ;
          // debugLog("Handle name: " + this.line);
          break;
        case 6: // line style name follows
          this.getDXFLine(); ;
          // debugLog("line Style: " + this.line);
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("layer: " + this.line);
          layer = this.line;
          break;
        case 10:
          // x
          this.getDXFLine();
          xArray.push(Number(this.line));
          // debugLog("x: " + this.line);
          break;
        case 20:
          // y
          this.getDXFLine();
          yArray.push(Number(this.line));
          // debugLog("y: " + this.line);
          break;
        case 30:
          // z
          this.getDXFLine();
          // debugLog("z: " + this.line);
          break;
        case 40:
          // Starting width (multiple entries; one entry for each vertex) (optional; default = 0; multiple entries). Not used if constant width (code 43) is se
          this.getDXFLine();
          // debugLog("Start Width: " + this.line);
          break;
        case 41:
          // End width (multiple entries; one entry for each vertex) (optional; default = 0; multiple entries). Not used if constant width (code 43) is set
          this.getDXFLine();
          // debugLog("End Width: " + this.line);
          break;
        case 43:
          // constant width - not use if 40 and/or 41 are set
          this.getDXFLine();
          // debugLog("Global Width: " + this.line);
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 70:
          // flags Polyline flag (bit-coded); default is 0: 1 = Closed; 128 = Plinegen
          this.getDXFLine();
          flags = Number(this.line);
          // debugLog("flags: " + this.line);
          break;
        case 90:
          // number of vertices
          this.getDXFLine();
          vertices = Number(this.line);
          // debugLog("Number of Vertices: " + this.line);
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }


  readSpline() {
    const points = [];
    const xCtrlPoints = [];
    const yCtrlPoints = [];
    // let xFitPoints = [];
    // let yFitPoints = [];
    const knotValues = [];
    // const vertices = 0; // store the number of points contained in the Spline
    // let knots = 0;
    let controlPoints = 0;
    // let fitPoints = 0;
    let colour = 'BYLAYER';
    let layer = '0';
    let flags;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("Group Code: " + n)

      switch (n) {
        case 0:
          // next item found, so finish with Spline

          // debugLog("Knots: " + knots);
          // debugLog("Control Points: " + controlPoints);
          // debugLog("Vertices: " + vertices);
          // debugLog("Control Points array length: " + xCtrlPoints.length);
          // debugLog("Fit points array length: " + xFitPoints.length);

          if (controlPoints > 0 && xCtrlPoints.length === yCtrlPoints.length) {
            for (let i = 0; i < controlPoints; i++) {
              const point = new Point();
              point.x = xCtrlPoints[i];
              point.y = yCtrlPoints[i];

              points.push(point);
            }

            if (flags === 1) {
              // Flag 1 signifies a closed shape. Copy the first point to the last index.
              points.push(points[0]);
            }

            const spline = {
              points: points,
              colour: colour,
              layer: layer,
            };

            this.addElementToScene('Spline', spline);
            // alsothis.addElementToScene("Spline", points, colour);
          }

          return true;
        case 8: // Layer name follows
          this.getDXFLine();
          // debugLog("Layer: " + this.line);
          layer = this.line;
          break;
        case 10:
          // control x
          this.getDXFLine();
          xCtrlPoints.push(Number(this.line));
          // debugLog("Control X: " + this.line);
          break;
        case 20:
          // control y
          this.getDXFLine();
          yCtrlPoints.push(Number(this.line));
          // debugLog("Control Y: " + this.line);
          break;
        case 30:
          // control z
          this.getDXFLine();
          // debugLog("Control Z: " + this.line);
          break;
        case 11:
          // fit x
          this.getDXFLine();
          xFitPoints = Number(this.line);
          // debugLog("Fit X: " + this.line);
          break;
        case 21:
          // fit y
          this.getDXFLine();
          yFitPoints = Number(this.line);
          // debugLog("Fit Y: " + this.line);
          break;
        case 31:
          // fit z
          this.getDXFLine();
          // debugLog("Fit Z: " + this.line);
          break;
        case 62:
          // color index
          this.getDXFLine();
          // debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 210:
          // normal x
          this.getDXFLine();
          // debugLog("Normal X: " + this.line);
          break;
        case 220:
          // normal y
          this.getDXFLine();
          // debugLog("Normal Y: " + this.line);
          break;
        case 230:
          // normal z
          this.getDXFLine();
          // debugLog("Normal Z: " + this.line);
          break;
        case 70:
          // flags
          this.getDXFLine();
          flags = Number(this.line);
          // debugLog("flags: " + this.line);
          break;
        case 71:
          // degree
          this.getDXFLine();
          // debugLog("Degree: " + this.line);
          break;
        case 72:
          // knots
          this.getDXFLine();
          knots = Number(this.line);
          // debugLog("Knots: " + this.line);
          break;
        case 73:
          // control points
          this.getDXFLine();
          controlPoints = Number(this.line);
          // debugLog("Control Points: " + this.line);
          break;
        case 74:
          // fit points
          this.getDXFLine();
          fitPoints = Number(this.line);
          // debugLog("Fit Points: " + this.line);
          break;
        case 12:
          // starttan x
          this.getDXFLine();
          // debugLog("StartTan X: " + this.line);
          break;
        case 22:
          // starttan y
          this.getDXFLine();
          // debugLog("StartTan Y: " + this.line);
          break;
        case 32:
          // starttan z
          this.getDXFLine();
          // debugLog("StartTan Z: " + this.line);
          break;
        case 13:
          // endtan x
          this.getDXFLine();
          // debugLog("EndTan X: " + this.line);
          break;
        case 23:
          // endtan y
          this.getDXFLine();
          // debugLog("EndTan Y: " + this.line);
          break;
        case 33:
          // endtan z
          this.getDXFLine();
          // debugLog("EndTan Z: " + this.line);
          break;
        case 40:
          // knot value
          this.getDXFLine();
          knotValues.push(Number(this.line));
          // debugLog("Knot Value: " + this.line);
          break;
        case 41:
          // weight
          this.getDXFLine();
          // debugLog("Weight: " + this.line);
          break;
        case 42:
          this.getDXFLine();
          // debugLog("DXF Readline 42");
          break;
        case 43:
          this.getDXFLine();
          // debugLog("DXF Readline 43");
          break;
        case 44:
          // skip the next line
          this.getDXFLine();
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }


  readText() {
    const points = [];

    const firstAlignmentPoint = new Point();
    const secondAlignmentPoint = new Point();

    let string = '';
    let height = 2.5;
    let rotation = 0;
    let horizontalAlignment = 0;
    let verticalAlignment = 0;
    let styleName = 'STANDARD';
    let colour = 'BYLAYER';
    let layer = '0';
    let widthFactor = 1;
    let flags;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);

      switch (n) {
        case 0:

          points.push(firstAlignmentPoint);

          if (secondAlignmentPoint.x && secondAlignmentPoint.y) {
            points.push(secondAlignmentPoint);
          }

          const text = {
            points: points,
            colour: colour,
            layer: layer,
            styleName: styleName,
            string: string,
            height: height,
            rotation: rotation,
            horizontalAlignment: horizontalAlignment,
            verticalAlignment: verticalAlignment,
            widthFactor: widthFactor,
            flags: flags,
          };

          this.addElementToScene('Text', text);

          return true;
        case 1: // Text string follows
          this.getDXFLine();
          string = this.line;
          break;
        case 7: // Style Name
          this.getDXFLine();
          styleName = this.line;
          break;
        case 8: // Layer name follows
          this.getDXFLine();
          layer = this.line;
          break;
        case 10: // x
          this.getDXFLine();
          firstAlignmentPoint.x = Number(this.line);
          break;
        case 20: // y
          this.getDXFLine();
          firstAlignmentPoint.y = Number(this.line);
          break;
        case 30: // z
          this.getDXFLine();
          break;
        case 11: // x
          this.getDXFLine();
          secondAlignmentPoint.x = Number(this.line);
          break;
        case 21: // y
          this.getDXFLine();
          secondAlignmentPoint.y = Number(this.line);
          break;
        case 31: // z
          this.getDXFLine();
          break;
        case 40: // height
          this.getDXFLine();
          height = Number(this.line);
          break;
        case 41: // width factor
          this.getDXFLine();
          widthFactor = Number(this.line);
          break;
        case 50: // rotation
          this.getDXFLine();
          rotation = Number(this.line);
          break;
        case 62: // color index
          this.getDXFLine();
          colour = Colours.getHexColour(Number(this.line));
          break;
        case 71:
          // Text generation flags (optional, default = 0):
          // 2 = Text is backward (mirrored in X).
          // 4 = Text is upside down (mirrored in Y).
          this.getDXFLine();
          flags = Number(this.line);
          break;
        case 72:
          // Horizontal text justification type (optional, default = 0) integer codes (not bit-coded)
          // 0 = Left; 1= Center; 2 = Right
          // 3 = Aligned (if vertical alignment = 0)
          // 4 = Middle (if vertical alignment = 0)
          // 5 = Fit (if vertical alignment = 0)
          this.getDXFLine();
          horizontalAlignment = Number(this.line);
          break;
        case 73:
          // Vertical text justification type (optional, default = 0): integer codes (not bit- coded):
          // 0 = Baseline; 1 = Bottom; 2 = Middle; 3 = Top
          this.getDXFLine();
          verticalAlignment = Number(this.line);
          // //// console.log("dxf vertical align:", verticalAlignment)
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }

  /*
    readText(){

        const colour = "BYLAYER";
        const layer = "0"

        while( this.lineNum < this.lines.length){

            this.getDXFLine();
            const n = parseInt(this.line);
            //debugLog("Group Code: " + n)

            switch(n){
            case 0:
                // next item found, so finish with text
                return;
            case 5: // handle name follows
                this.getDXFLine();;
                //debugLog("Handle name: " + this.line);
                break;
            case 6: // line style name follows
                this.getDXFLine();;
                //debugLog(this.line);
                break;
            case 8: // Layer name follows
                this.getDXFLine();
                //debugLog("layer: " + this.line);
                layer = this.line;
                break;
            case 10:
                // centre x
                this.getDXFLine();
                //debugLog("centre x: " + this.line);
                break;
            case 20:
                // centre y
                this.getDXFLine();
                //debugLog("centre y: " + this.line);
                break;
            case 30:
                // centre z
                this.getDXFLine();
                //debugLog("centre z: " + this.line);
                break;
            case 40:
                // text height
                this.getDXFLine();
                //debugLog("text height: " + this.line);
                break;
            case 1:
                // text
                this.getDXFLine();
                //debugLog("text string: " + this.line);
                return(true);

            case 62:
                // color index
                this.getDXFLine();
                //debugLog("Colour: ACAD:" + this.line + " HEX: " + Colours.getHexColour(Number(this.line)));
                colour = Colours.getHexColour(Number(this.line));
                break;

            case 100:
                this.getDXFLine();
                //debugLog("DXF Readline 100");
                break;
            case 39:
                this.getDXFLine();
                //debugLog("DXF Readline 39");
                break;
            case 210:
                this.getDXFLine();
                //debugLog("DXF Readline 210");
                break;
            case 220:
                this.getDXFLine();
                //debugLog("DXF Readline 220");
                break;
            case 230:
                // skip the next line
                this.getDXFLine();
                break;
            default:
                // skip the next line
                this.getDXFLine();
                break;
            }
        }
    }*/

  readStyle() {
    let name = '';
    let font = '';
    let bigFont = 0;
    let textHeight = 2.5;
    let lastTextHeight = 2.5;
    let obliqueAngle = 0;
    let flags = 0;
    let standardFlags = 0;
    let widthFactor = 1;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);

      switch (n) {
        case 0:

          const style = {
            name: name,
            font: font,
            bigFont: bigFont,
            textHeight: textHeight,
            lastTextHeight: lastTextHeight,
            obliqueAngle: obliqueAngle,
            flags: flags,
            standardFlags: standardFlags,
            widthFactor: widthFactor,
          };

          if (name !== '') {
            // TODO: I'm not proud of this...
            this.core.styleManager.addStyle(style);
          }

          return true;
        case 2: // Style Name follows
          this.getDXFLine();
          name = this.line;
          break;
        case 3: // Font Name
          this.getDXFLine();
          font = this.line;
          break;
        case 4: // Big font name
          this.getDXFLine();
          bigFont = this.line;
          break;
        case 40: // height
          this.getDXFLine();
          textHeight = Number(this.line);
          break;
        case 41: // height
          this.getDXFLine();
          widthFactor = Number(this.line);
          break;
        case 42: // last height
          this.getDXFLine();
          lastTextHeight = Number(this.line);
          break;
        case 50: // oblique angle
          this.getDXFLine();
          obliqueAngle = Number(this.line);
          break;
        case 70: // Standard Flags
          this.getDXFLine();
          standardFlags = Number(this.line);
          break;
        case 71: // Text generation flags (optional, default = 0):
          // 2 = Text is backward (mirrored in X).
          // 4 = Text is upside down (mirrored in Y).
          this.getDXFLine();
          flags = Number(this.line);
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }

  readDimStyle() {
    let name = '';
    const standardFlags = 0;
    let DIMPOST = ''; // 3
    let DIMAPOST = ''; // 4
    let DIMBLK = ''; // 5
    let DIMBLK1 = ''; // 6
    let DIMBLK2 = ''; // 8
    let DIMSCALE = '1.0'; // 40
    let DIMASZ = '0.18'; // 41
    let DIMEXO = '0.0625'; // 42
    let DIMDLI = '0.38'; // 43
    let DIMEXE = '0.18'; // 44
    let DIMRND = '0.0'; // 45
    let DIMDLE = '0.0'; // 46
    let DIMTP = '0.0'; // 47
    let DIMTM = '0.0'; // 48
    let DIMTXT = '0.18'; // 140
    let DIMCEN = '0.09'; // 141
    let DIMTSZ = '0.0'; // 142
    let DIMALTF = '25.39'; // 143
    let DIMLFAC = '1.0'; // 144
    let DIMTVP = '0.0'; // 145
    let DIMTFAC = '1.0'; // 146
    let DIMGAP = '0.09'; // 147
    let DIMTOL = '0'; // 71
    let DIMLIM = '0'; // 72
    let DIMTIH = '1'; // 73
    let DIMTOH = '1'; // 74
    let DIMSE1 = '0'; // 75
    let DIMSE2 = '0'; // 76
    let DIMTAD = '0'; // 77
    let DIMZIN = '0'; // 78
    let DIMALT = '0'; // 170
    let DIMALTD = '2'; // 171
    let DIMTOFL = '0'; // 172
    let DIMSAH = '0'; // 173
    let DIMTIX = '0'; // 174
    let DIMSOXD = '0'; // 175
    let DIMCLRD = '0'; // 176
    let DIMCLRE = '0'; // 177
    let DIMCLRT = '0';

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);

      switch (n) {
        case 0:

          const dimstyle = {
            name: name,
            standardFlags: standardFlags,
            DIMPOST: DIMPOST,
            DIMAPOST: DIMAPOST,
            DIMBLK: DIMBLK,
            DIMBLK1: DIMBLK1,
            DIMBLK2: DIMBLK2,
            DIMSCALE: DIMSCALE,
            DIMASZ: DIMASZ,
            DIMEXO: DIMEXO,
            DIMDLI: DIMDLI,
            DIMEXE: DIMEXE,
            DIMRND: DIMRND,
            DIMDLE: DIMDLE,
            DIMTP: DIMTP,
            DIMTM: DIMTM,
            DIMTXT: DIMTXT,
            DIMCEN: DIMCEN,
            DIMTSZ: DIMTSZ,
            DIMALTF: DIMALTF,
            DIMLFAC: DIMLFAC,
            DIMTVP: DIMTVP,
            DIMTFAC: DIMTFAC,
            DIMGAP: DIMGAP,
            DIMTOL: DIMTOL,
            DIMLIM: DIMLIM,
            DIMTIH: DIMTIH,
            DIMTOH: DIMTOH,
            DIMSE1: DIMSE1,
            DIMSE2: DIMSE2,
            DIMTAD: DIMTAD,
            DIMZIN: DIMZIN,
            DIMALT: DIMALT,
            DIMALTD: DIMALTD,
            DIMTOFL: DIMTOFL,
            DIMSAH: DIMSAH,
            DIMTIX: DIMTIX,
            DIMSOXD: DIMSOXD,
            DIMCLRD: DIMCLRD,
            DIMCLRE: DIMCLRE,
            DIMCLRT: DIMCLRT,
          };

          if (name !== '') {
            this.core.dimStyleManager.addStyle(dimstyle);
          }

          return true;
        case 2: // Style Name follows
          this.getDXFLine();
          name = this.line;
          break;
        case 3:
          this.getDXFLine();
          DIMPOST = Number(this.line);
          break;
        case 4:
          this.getDXFLine();
          DIMAPOST = Number(this.line);
          break;
        case 5:
          this.getDXFLine();
          DIMBLK = Number(this.line);
          break;
        case 6:
          this.getDXFLine();
          DIMBLK1 = Number(this.line);
          break;
        case 8:
          this.getDXFLine();
          DIMBLK2 = Number(this.line);
          break;
        case 40:
          this.getDXFLine();
          DIMSCALE = Number(this.line);
          break;
        case 41:
          this.getDXFLine();
          DIMASZ = Number(this.line);
          break;
        case 42:
          this.getDXFLine();
          DIMEXO = Number(this.line);
          break;
        case 43:
          this.getDXFLine();
          DIMDLI = Number(this.line);
          break;
        case 44:
          this.getDXFLine();
          DIMEXE = Number(this.line);
          break;
        case 45:
          this.getDXFLine();
          DIMRND = Number(this.line);
          break;
        case 46:
          this.getDXFLine();
          DIMDLE = Number(this.line);
          break;
        case 47:
          this.getDXFLine();
          DIMTP = Number(this.line);
          break;
        case 48:
          this.getDXFLine();
          DIMTM = Number(this.line);
          break;
        case 140:
          this.getDXFLine();
          DIMTXT = Number(this.line);
          break;
        case 141:
          this.getDXFLine();
          DIMCEN = Number(this.line);
          break;
        case 142:
          this.getDXFLine();
          DIMTSZ = Number(this.line);
          break;
        case 143:
          this.getDXFLine();
          DIMALTF = Number(this.line);
          break;
        case 144:
          this.getDXFLine();
          DIMLFAC = Number(this.line);
          break;
        case 145:
          this.getDXFLine();
          DIMTVP = Number(this.line);
          break;
        case 146:
          this.getDXFLine();
          DIMTFAC = Number(this.line);
          break;
        case 147:
          this.getDXFLine();
          DIMGAP = Number(this.line);
          break;
        case 71:
          this.getDXFLine();
          DIMTOL = Number(this.line);
          break;
        case 72:
          this.getDXFLine();
          DIMLIM = Number(this.line);
          break;
        case 73:
          this.getDXFLine();
          DIMTIH = Number(this.line);
          break;
        case 74:
          this.getDXFLine();
          DIMTOH = Number(this.line);
          break;
        case 75:
          this.getDXFLine();
          DIMSE1 = Number(this.line);
          break;
        case 76:
          this.getDXFLine();
          DIMSE2 = Number(this.line);
          break;
        case 77:
          this.getDXFLine();
          DIMTAD = Number(this.line);
          break;
        case 78:
          this.getDXFLine();
          DIMZIN = Number(this.line);
          break;
        case 170:
          this.getDXFLine();
          DIMALT = Number(this.line);
          break;
        case 171:
          this.getDXFLine();
          DIMALTD = Number(this.line);
          break;
        case 172:
          this.getDXFLine();
          DIMTOFL = Number(this.line);
          break;
        case 173:
          this.getDXFLine();
          DIMSAH = Number(this.line);
          break;
        case 174:
          this.getDXFLine();
          DIMTIX = Number(this.line);
          break;
        case 175:
          this.getDXFLine();
          DIMSOXD = Number(this.line);
          break;
        case 176:
          this.getDXFLine();
          DIMCLRD = Number(this.line);
          break;
        case 177:
          this.getDXFLine();
          DIMCLRE = Number(this.line);
          break;
        case 178:
          this.getDXFLine();
          DIMCLRT = Number(this.line);
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }


  readVPort() {
    const centre = new Point();
    // const width = 0;
    let height = 0;
    let ratio = 0;

    while (this.lineNum < this.lines.length) {
      this.getDXFLine();
      const n = parseInt(this.line);
      // debugLog("Group Code: " + n)
      // ////// console.log("Group Code: " + n)

      switch (n) {
        case 0:

          if (height !== 0 && ratio !== 0) {
            // width = height * ratio;
            // ////// console.log("Vport Width: ", width)
          }

          /*   const vport = {
                           centre: centre,
                           height: height,
                           width: width
                       }*/
          // ////// console.log("TODO: Implement Centring the data")
          // centreVPORT(centre, width, height);

          return true;
        case 2:
          // name
          this.getDXFLine();
          // ////// console.log("VPORT Name: " + this.line);
          break;
        case 10:
          // x
          this.getDXFLine();
          // ////// console.log("Bottom Left X: " + this.line);
          break;
        case 20:
          // y
          this.getDXFLine();
          // ////// console.log("Bottom Left Y: " + this.line);
          break;
        case 11:
          // x
          this.getDXFLine();
          // ////// console.log("Top Right X: " + this.line);
          break;
        case 21:
          // y
          this.getDXFLine();
          // ////// console.log("Top Right Y: " + this.line);
          break;
        case 12:
          // x
          this.getDXFLine();
          // ////// console.log("Centre X: " + this.line);
          centre.x = Number(this.line);
          break;
        case 22:
          // y
          this.getDXFLine();
          // ////// console.log("Centre Y: " + this.line);
          centre.y = Number(this.line);
          break;
        case 40:
          // View Height
          this.getDXFLine();
          // ////// console.log("Viewport Height: " + this.line);
          height = Number(this.line);
          break;
        case 41:
          // Viewport ratio
          this.getDXFLine();
          // ////// console.log("Viewport ratio: " + this.line);
          ratio = this.line;
          break;
        case 70:
          // flags
          this.getDXFLine();
          // ////// console.log("Viewport Flags: " + this.line);
          break;
        case 76:
          // grid on/off
          this.getDXFLine();
          // ////// console.log("Grid ON/OFF: " + this.line);
          break;
        default:
          // skip the next line
          this.getDXFLine();
          break;
      }
    }
  }
}
