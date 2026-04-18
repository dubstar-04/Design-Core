import { RendererBase } from './renderers/rendererBase.js';

/**
 * PlotOptions Class
 * Encapsulates all parameters for a plot/export operation.
 */
export class PlotOptions {
  /** Valid plot area modes. */
  static Area = {
    EXTENTS: 'Extents',
    DISPLAY: 'Display',
  };

  static #fileTypes = ['pdf', 'svg'];

  /**
   * @param {number} pageWidth - required, positive number (PDF points)
   * @param {number} pageHeight - required, positive number (PDF points)
   */
  constructor(pageWidth, pageHeight) {
    this.setOption('pageWidth', pageWidth);
    this.setOption('pageHeight', pageHeight);
    this.plotScale = null;
    this.plotArea = PlotOptions.Area.EXTENTS;
    this.style = RendererBase.Styles.NONE;
    this.fileType = 'pdf';
  }

  /**
   * Validate and set a single option.
   * @param {string} key
   * @param {*} value
   */
  setOption(key, value) {
    switch (key) {
      case 'pageWidth':
      case 'pageHeight':
        if (typeof value !== 'number' || value <= 0) {
          throw new Error(`PlotOptions: ${key} must be a positive number`);
        }
        break;
      case 'plotScale':
        if (value !== null && (typeof value !== 'number' || value <= 0)) {
          throw new Error('PlotOptions: plotScale must be a positive number or null');
        }
        break;
      case 'plotArea':
        if (!Object.values(PlotOptions.Area).includes(value)) {
          throw new Error(`PlotOptions: plotArea must be one of: ${Object.values(PlotOptions.Area).join(', ')}`);
        }
        break;
      case 'style':
        if (typeof value !== 'function') {
          throw new Error('PlotOptions: style must be a function');
        }
        break;
      case 'fileType':
        if (!PlotOptions.#fileTypes.includes(value)) {
          throw new Error(`PlotOptions: fileType must be one of: ${PlotOptions.#fileTypes.join(', ')}`);
        }
        break;
      default:
        throw new Error(`PlotOptions: unknown option '${key}'`);
    }
    this[key] = value;
  }
}
