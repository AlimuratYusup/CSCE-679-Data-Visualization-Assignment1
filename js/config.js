/**
 * config.js
 * ---------------------------------------------------------------------------
 * Every tunable setting of the visualization lives here: data location,
 * color mapping, sizes, spacing, fonts, and the per-level options.
 * Change a value here and both Level 1 and Level 2 pick it up; no other
 * file contains magic numbers for layout or styling.
 */

/* global d3 */

(function (TemperatureHeatmap) {
  "use strict";

  /** Settings shared by both levels. */
  const SHARED_CONFIG = {
    /** Path of the daily temperature CSV (relative to the HTML pages). */
    dataUrl: "temperature_daily.csv",

    /** Column names in the CSV. */
    columns: {
      date: "date",
      maxTemperature: "max_temperature",
      minTemperature: "min_temperature",
    },

    /** Month labels shown on the y axis, January first. */
    monthNames: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],

    /**
     * Temperature -> color mapping.
     * The reference images use the 11-step ColorBrewer "Spectral" scheme,
     * reversed so cold = purple/blue and hot = dark red. The scale is a
     * quantize scale (11 equal-width bins); `domain` was calibrated against
     * the reference images so that every cell lands in the exact same color
     * bin as in level1.png / level2.png.
     */
    color: {
      colorCount: 11,
      domain: [0, 39],
    },

    /** Temperature mode that the page opens with ("max" or "min"). */
    initialMode: "max",

    /** Labels for the two temperature modes (used by the toggle and titles). */
    modeLabels: {
      max: "Maximum",
      min: "Minimum",
    },

    /** Duration (ms) of the color fade when switching max <-> min. */
    transitionDuration: 450,

    /** Vertical color legend drawn to the right of the matrix. */
    legend: {
      gapFromMatrix: 22,   // horizontal gap between last column and legend
      swatchWidth: 20,
      swatchHeight: 22,
      labelOffset: 6,      // space between swatch column and its text label
      lowLabel: "0 Celsius",
      highLabel: "40 Celsius",
      fontSize: 12,
    },

    /** Axis text styling. */
    axis: {
      fontSize: 11,
    },

    /** Hover tooltip. */
    tooltip: {
      offsetX: 14,         // distance from the cursor, in px
      offsetY: 18,
    },

    /** Outline drawn around the hovered cell. */
    hover: {
      strokeColor: "#1f2328",
      strokeWidth: 2,
    },
  };

  /**
   * Level 1: Year/Month heatmap of the whole data set.
   * Cell steps and padding were measured from level1.png.
   */
  const LEVEL1_CONFIG = {
    containerSelector: "#chart",
    recentYearCount: null,          // null = show every year in the data
    cellStepX: 40.6,                // horizontal distance between columns (px)
    cellStepY: 37,                  // vertical distance between rows (px)
    cellPadding: 0.18,              // fraction of a step left empty between cells
    cellCornerRadius: 2,
    margin: { top: 30, right: 80, bottom: 12, left: 82 },
    tooltipSeparator: ";",          // "Date: 2002-03; max: 28 min: 14"
    showSparklines: false,
  };

  /**
   * Level 2: same matrix for the most recent years, with a mini line chart
   * of the daily max/min temperature inside every cell.
   * Cell steps and padding were measured from level2.png.
   */
  const LEVEL2_CONFIG = {
    containerSelector: "#chart",
    recentYearCount: 10,            // last 10 years of the data (2008-2017)
    cellStepX: 97,
    cellStepY: 72,
    cellPadding: 0.19,
    cellCornerRadius: 0,
    margin: { top: 30, right: 80, bottom: 12, left: 82 },
    tooltipSeparator: ",",          // "Date: 2012-04, max: 31 min: 19"
    showSparklines: true,

    /** Mini line chart drawn inside each cell. */
    sparkline: {
      maxLineColor: "#31a354",      // green line  = daily maximum
      minLineColor: "#9ecae1",      // light blue  = daily minimum
      lineWidth: 2,
      innerPadding: 4,              // space between cell edge and the lines (px)
      daysInLongestMonth: 31,       // x domain is always day 1..31
    },
  };

  // Make this file's public functions available to the other scripts.
  Object.assign(TemperatureHeatmap, { SHARED_CONFIG, LEVEL1_CONFIG, LEVEL2_CONFIG });
})((window.TemperatureHeatmap = window.TemperatureHeatmap || {}));
