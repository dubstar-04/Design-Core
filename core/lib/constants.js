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
  };

  /**
   * Numeric precision values used for rounding and output formatting.
   */
  static Precision = {
    /** Number of decimal places used by Utils.round(). */
    DECIMALPLACES: 5,
  };
}
