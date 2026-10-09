/**
 * legend.js
 * ---------------------------------------------------------------------------
 * Vertical color legend: one swatch per color bin, coldest at the top and
 * hottest at the bottom, with the end values labeled (as in the Level 2 reference image).
 */

/* global d3 */

(function (TemperatureHeatmap) {
  "use strict";

  /**
   * Draw the legend inside the given SVG group.
   * @param {d3.Selection} legendGroup  <g> already translated to the legend position
   * @param {d3.ScaleQuantize} colorScale  temperature -> color scale
   * @param {object} legendConfig  SHARED_CONFIG.legend
   */
  function drawColorLegend(legendGroup, colorScale, legendConfig) {
    const { swatchWidth, swatchHeight, labelOffset, fontSize } = legendConfig;
    const swatchColors = colorScale.range(); // ordered cold -> hot
    const legendHeight = swatchColors.length * swatchHeight;

    legendGroup.attr("class", "legend");

    // One rectangle per color bin; the native <title> shows its value range.
    legendGroup
      .selectAll("rect.legend-swatch")
      .data(swatchColors)
      .join("rect")
      .attr("class", "legend-swatch")
      .attr("x", 0)
      .attr("y", (_, index) => index * swatchHeight)
      .attr("width", swatchWidth)
      .attr("height", swatchHeight)
      .attr("fill", (color) => color)
      .append("title")
      .text((color) => describeColorBin(colorScale, color));

    // End labels: low value beside the first swatch, high value under the last.
    legendGroup
      .append("text")
      .attr("class", "legend-label")
      .attr("x", swatchWidth + labelOffset)
      .attr("y", fontSize)
      .attr("font-size", fontSize)
      .text(legendConfig.lowLabel);

    legendGroup
      .append("text")
      .attr("class", "legend-label")
      .attr("x", swatchWidth + labelOffset)
      .attr("y", legendHeight + fontSize)
      .attr("font-size", fontSize)
      .text(legendConfig.highLabel);
  }

  /**
   * Human-readable temperature range covered by one color, e.g. "25.4 – 28.9 °C".
   * @param {d3.ScaleQuantize} colorScale
   * @param {string} color  one value of colorScale.range()
   */
  function describeColorBin(colorScale, color) {
    const [low, high] = colorScale.invertExtent(color);
    return `${low.toFixed(1)} – ${high.toFixed(1)} °C`;
  }

  // Make this file's public functions available to the other scripts.
  Object.assign(TemperatureHeatmap, { drawColorLegend });
})((window.TemperatureHeatmap = window.TemperatureHeatmap || {}));
