import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Constants } from '../../core/lib/constants.js';
import { PlotOptions } from '../../core/lib/plotOptions.js';
import { BoundingBox } from '../../core/lib/boundingBox.js';
import { SvgRenderer } from '../../core/lib/renderers/svgRenderer.js';

// smallest -> largest; each rectangle fully contains all previous ones when aligned at the origin
const PAGE_NAMES_ASC = ['A4', 'A3', 'A2', 'A1', 'A0'];

// Portrait uses the raw (width < height) page size; Landscape swaps the two axes,
// matching the orientation toggle in the GTK plot dialog (plotWindow.js)
const ORIENTATIONS = {
  Portrait: (size) => ({ pageWidth: size.width, pageHeight: size.height }),
  Landscape: (size) => ({ pageWidth: size.height, pageHeight: size.width }),
};

/**
 * Build a closed 4-corner loop, mirroring Rectangle.rectPoints()
 * @param {Point} pt1
 * @param {Point} pt2
 * @return {Array}
 */
function rectPoints(pt1, pt2) {
  return [
    new Point(pt1.x, pt1.y),
    new Point(pt2.x, pt1.y),
    new Point(pt2.x, pt2.y),
    new Point(pt1.x, pt2.y),
    new Point(pt1.x, pt1.y),
  ];
}

describe.each(Object.keys(ORIENTATIONS))('%s orientation', (orientation) => {
  const toPage = ORIENTATIONS[orientation];

  test.each(PAGE_NAMES_ASC)('Extents matches %s page size exactly', (name) => {
    const { pageWidth, pageHeight } = toPage(Constants.PageSizes[name]);
    const core = new Core();
    core.activate();
    core.scene.addEntity('Polyline', { points: rectPoints(new Point(0, 0), new Point(pageWidth, pageHeight)) });

    const area = core.scene.boundingBox();
    expect(area.xLength).toBeCloseTo(pageWidth, 5);
    expect(area.yLength).toBeCloseTo(pageHeight, 5);

    const matrix = core.canvas.buildExportMatrix({
      area, pageWidth, pageHeight, plotScale: 1, margin: 0,
    });
    expect(matrix.a).toBe(1);
    expect(matrix.e).toBeCloseTo(0, 5);
    expect(matrix.f).toBeCloseTo(0, 5);
  });

  test('Extents grows to match each page size as rectangles are added smallest to largest', () => {
    const core = new Core();
    core.activate();

    for (const name of PAGE_NAMES_ASC) {
      const { pageWidth, pageHeight } = toPage(Constants.PageSizes[name]);
      core.scene.addEntity('Polyline', { points: rectPoints(new Point(0, 0), new Point(pageWidth, pageHeight)) });

      const area = core.scene.boundingBox();
      expect(area.xLength).toBeCloseTo(pageWidth, 5);
      expect(area.yLength).toBeCloseTo(pageHeight, 5);
    }
  });

  test('Window area isolates each nested rectangle regardless of surrounding sizes', () => {
    const core = new Core();
    core.activate();

    const rects = {};
    for (const name of PAGE_NAMES_ASC) {
      const { pageWidth, pageHeight } = toPage(Constants.PageSizes[name]);
      rects[name] = { p1: new Point(0, 0), p2: new Point(pageWidth, pageHeight) };
      core.scene.addEntity('Polyline', { points: rectPoints(rects[name].p1, rects[name].p2) });
    }

    for (const name of PAGE_NAMES_ASC) {
      const { pageWidth, pageHeight } = toPage(Constants.PageSizes[name]);
      const { p1, p2 } = rects[name];

      const windowArea = new BoundingBox(p1, p2);
      expect(windowArea.xLength).toBeCloseTo(pageWidth, 5);
      expect(windowArea.yLength).toBeCloseTo(pageHeight, 5);

      // full exportTo path: WINDOW plotArea must isolate only this rectangle's bounds,
      // not the full-scene extents (which would be A0 for every iteration)
      const plotOptions = new PlotOptions(pageWidth, pageHeight);
      plotOptions.setOption('plotArea', PlotOptions.Area.WINDOW);
      plotOptions.setOption('windowArea', { point1: p1, point2: p2 });
      plotOptions.setOption('plotScale', 1);
      plotOptions.setOption('margin', 0);

      const renderer = new SvgRenderer(pageWidth, pageHeight);
      expect(core.canvas.exportTo(renderer, plotOptions)).toBe(true);
    }
  });
});
