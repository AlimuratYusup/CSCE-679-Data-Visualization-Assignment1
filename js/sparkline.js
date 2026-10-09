/**
 * sparkline.js
 * ---------------------------------------------------------------------------
 * Mini line charts drawn inside each matrix cell (Level 2).
 * x = day of the month, y = temperature. Two lines per cell:
 *   green      -> daily maximum temperature
 *   light blue -> daily minimum temperature
 * All cells share the same y scale, so a line's height can be compared
 * across months and years (summer lines sit higher than winter lines).
 */

/* global d3 */

(function (TemperatureHeatmap) {
  "use strict";

  /**
   * Build the x/y scales used by every sparkline.
   * @param {number} cellWidth   width of one matrix cell (px)
   * @param {number} cellHeight  height of one matrix cell (px)
   * @param {[number, number]} temperatureExtent  [lowest, highest] daily temperature shown
   * @param {object} sparklineConfig  LEVEL2_CONFIG.sparkline
   */
  function createSparklineScales(cellWidth, cellHeight, temperatureExtent, sparklineConfig) {
    const { innerPadding, daysInLongestMonth } = sparklineConfig;

    const dayScale = d3
      .scaleLinear()
      .domain([1, daysInLongestMonth])
      .range([innerPadding, cellWidth - innerPadding]);

    const temperatureScale = d3
      .scaleLinear()
      .domain(temperatureExtent)
      .range([cellHeight - innerPadding, innerPadding]); // SVG y grows downward

    return { dayScale, temperatureScale };
  }

  /**
   * Draw the min and max lines inside every cell group.
   * @param {d3.Selection} cellGroups  one <g> per monthly record (bound data = monthly record)
   * @param {{dayScale: Function, temperatureScale: Function}} scales
   * @param {object} sparklineConfig  LEVEL2_CONFIG.sparkline
   */
  function drawSparklines(cellGroups, scales, sparklineConfig) {
    const lineSeries = [
      { key: "min", valueOf: (d) => d.minTemperature, color: sparklineConfig.minLineColor },
      { key: "max", valueOf: (d) => d.maxTemperature, color: sparklineConfig.maxLineColor },
    ];

    lineSeries.forEach((series) => {
      const lineGenerator = d3
        .line()
        .x((day) => scales.dayScale(day.day))
        .y((day) => scales.temperatureScale(series.valueOf(day)));

      cellGroups
        .append("path")
        .attr("class", `sparkline sparkline-${series.key}`)
        .attr("fill", "none")
        .attr("stroke", series.color)
        .attr("stroke-width", sparklineConfig.lineWidth)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", (monthRecord) => lineGenerator(monthRecord.days));
    });
  }

  // Make this file's public functions available to the other scripts.
  Object.assign(TemperatureHeatmap, { createSparklineScales, drawSparklines });
})((window.TemperatureHeatmap = window.TemperatureHeatmap || {}));
