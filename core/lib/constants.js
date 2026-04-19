/**
 * Constants
 * Shared numeric constants used across the codebase.
 */
export class Constants {
  /**
   * Geometric tolerance values.
   * Values whose absolute magnitude falls below the relevant threshold
   * are treated as zero for that comparison.
   */
  static Tolerance = {
    /** Near-zero threshold for floating-point geometric comparisons (1e-10). */
    EPSILON: 1e-10,
    /** Small relative offset for geometric offsets (1e-9).
     * Suitable where a nudge must be negligible compared to the scale of
     * the geometry but larger than floating-point noise. */
    DELTA: 1e-9,
  };

  /**
   * Numeric precision values used for rounding and output formatting.
   */
  static Precision = {
    /** Number of decimal places used by Utils.round(). */
    DECIMALPLACES: 5,
  };

  /**
   * Standard paper sizes in PDF points (portrait orientation).
   * 1 PDF point = 1/72 inch = 25.4/72 mm.
   * Swap width and height for landscape.
   *
   * ISO sizes are defined by ISO 216: A4 = 210×297mm, A3 = 297×420mm, etc.
   * ANSI sizes follow ANSI/ASME Y14.1.
   */
  static PageSizes = {
    // ISO A-series (portrait)
    'A4': { width: 595, height: 842 },
    'A3': { width: 842, height: 1191 },
    'A2': { width: 1191, height: 1684 },
    'A1': { width: 1684, height: 2384 },
    'A0': { width: 2384, height: 3370 },
    // ANSI sizes (portrait)
    'Letter': { width: 612, height: 792 },
    'Legal': { width: 612, height: 1008 },
    'Tabloid': { width: 792, height: 1224 },
    'ANSI C': { width: 1224, height: 1584 },
    'ANSI D': { width: 1584, height: 2448 },
    'ANSI E': { width: 2448, height: 3168 },
  };
}
