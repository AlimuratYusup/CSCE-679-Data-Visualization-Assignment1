/**
 * heatmap.js
 * ---------------------------------------------------------------------------
 * The reusable Year/Month matrix used by both levels.
 *   x axis (top)  -> year
 *   y axis (left) -> month
 *   cell color    -> monthly maximum or minimum temperature
 * Optional mini line charts (Level 2) and the color legend are plugged in
 * from their own modules. The chart is configured entirely by the
 * SHARED_CONFIG / LEVEL*_CONFIG objects from config.js.
 */

/* global d3 */

import { listYears, temperatureForMode } from "./data.js";
import { drawColorLegend } from "./legend.js";
import { createSparklineScales, drawSparklines } from "./sparkline.js";
import { createTooltip, formatTooltipText } from "./tooltip.js";

/**
 * Render the heatmap and return a small controller to change the mode.
 * @param {object} options
 * @param {Array}  options.monthlyRecords  monthly records (see data.js)
 * @param {object} options.sharedConfig    SHARED_CONFIG
 * @param {object} options.levelConfig     LEVEL1_CONFIG or LEVEL2_CONFIG
 * @param {Function} [options.onModeChange]  called with the new mode after every switch
 * @returns {{setMode: Function, toggleMode: Function, getMode: Function}}
 */
export function createTemperatureHeatmap({ monthlyRecords, sharedConfig, levelConfig, onModeChange }) {
  let currentMode = sharedConfig.initialMode;

  // ---- Layout & scales ----------------------------------------------------
  const years = listYears(monthlyRecords);
  const layout = computeLayout(years.length, sharedConfig, levelConfig);
  const monthNumbers = d3.range(1, sharedConfig.monthNames.length + 1); // 1 = January ... 12 = December
  const { yearScale, monthScale } = createPositionScales(years, monthNumbers, layout, levelConfig);
  const colorScale = createColorScale(sharedConfig.color);

  // ---- SVG skeleton -------------------------------------------------------
  const svg = d3
    .select(levelConfig.containerSelector)
    .append("svg")
    .attr("class", "heatmap")
    .attr("viewBox", `0 0 ${layout.totalWidth} ${layout.totalHeight}`)
    // Natural size on wide screens, scales down proportionally on narrow ones.
    .style("max-width", `${layout.totalWidth}px`)
    .attr("role", "img")
    .attr("aria-label", "Hong Kong monthly temperature heatmap by year and month");

  const plotArea = svg
    .append("g")
    .attr("transform", `translate(${levelConfig.margin.left},${levelConfig.margin.top})`);

  drawAxes(plotArea, yearScale, monthScale, sharedConfig);

  // ---- Cells --------------------------------------------------------------
  const tooltip = createTooltip(sharedConfig.tooltip);
  const cellGroups = drawCells(plotArea, monthlyRecords, {
    yearScale,
    monthScale,
    colorScale,
    mode: currentMode,
    levelConfig,
    sharedConfig,
    tooltip,
  });

  // ---- Level 2: mini line charts inside the cells --------------------------
  if (levelConfig.showSparklines) {
    const dailyTemperatureExtent = [
      d3.min(monthlyRecords, (d) => d.minTemperature),
      d3.max(monthlyRecords, (d) => d.maxTemperature),
    ];
    const sparklineScales = createSparklineScales(
      yearScale.bandwidth(),
      monthScale.bandwidth(),
      dailyTemperatureExtent,
      levelConfig.sparkline,
    );
    drawSparklines(cellGroups, sparklineScales, levelConfig.sparkline);
  }

  // ---- Legend --------------------------------------------------------------
  drawColorLegend(
    plotArea
      .append("g")
      .attr("transform", `translate(${layout.innerWidth + sharedConfig.legend.gapFromMatrix},0)`),
    colorScale,
    sharedConfig.legend,
  );

  // ---- Interaction: clicking anywhere on the chart switches max <-> min ------
  svg.on("click", () => toggleMode());

  // ---- Public controller ---------------------------------------------------
  /** Recolor every cell for the given mode ("max" or "min"). */
  function setMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    cellGroups
      .select("rect.cell")
      .transition()
      .duration(sharedConfig.transitionDuration)
      .attr("fill", (d) => colorScale(temperatureForMode(d, currentMode)));
    if (onModeChange) onModeChange(currentMode);
  }

  /** Switch to the other mode. */
  function toggleMode() {
    setMode(currentMode === "max" ? "min" : "max");
  }

  return { setMode, toggleMode, getMode: () => currentMode };
}

/**
 * Size of the plot area and of the whole SVG.
 * The band scales below place `cellPadding` of a step before the first cell
 * and after the last one, so the plot spans (count + padding) steps.
 */
function computeLayout(yearCount, sharedConfig, levelConfig) {
  const monthCount = sharedConfig.monthNames.length;
  const { margin, cellStepX, cellStepY, cellPadding } = levelConfig;
  const legendWidth = sharedConfig.legend.gapFromMatrix + sharedConfig.legend.swatchWidth;

  const innerWidth = cellStepX * (yearCount + cellPadding);
  const innerHeight = cellStepY * (monthCount + cellPadding);
  const legendHeight = sharedConfig.color.colorCount * sharedConfig.legend.swatchHeight;

  return {
    innerWidth,
    innerHeight,
    totalWidth: margin.left + innerWidth + legendWidth + margin.right,
    totalHeight: margin.top + Math.max(innerHeight, legendHeight) + margin.bottom,
  };
}

/** Band scales mapping a year to an x position and a month number to a y position. */
function createPositionScales(years, monthNumbers, layout, levelConfig) {
  const yearScale = d3
    .scaleBand()
    .domain(years)
    .range([0, layout.innerWidth])
    .padding(levelConfig.cellPadding);

  const monthScale = d3
    .scaleBand()
    .domain(monthNumbers)
    .range([0, layout.innerHeight])
    .padding(levelConfig.cellPadding);

  return { yearScale, monthScale };
}

/**
 * Temperature -> color. Reversed "Spectral" so low = purple/blue, high = dark red.
 * @param {object} colorConfig  SHARED_CONFIG.color
 */
function createColorScale(colorConfig) {
  const coldToHotColors = [...d3.schemeSpectral[colorConfig.colorCount]].reverse();
  return d3.scaleQuantize().domain(colorConfig.domain).range(coldToHotColors);
}

/** Year axis along the top edge and month axis along the left edge. */
function drawAxes(plotArea, yearScale, monthScale, sharedConfig) {
  plotArea
    .append("g")
    .attr("class", "axis axis-year")
    .call(d3.axisTop(yearScale))
    .attr("font-size", sharedConfig.axis.fontSize);

  plotArea
    .append("g")
    .attr("class", "axis axis-month")
    .call(d3.axisLeft(monthScale).tickFormat((month) => sharedConfig.monthNames[month - 1]))
    .attr("font-size", sharedConfig.axis.fontSize);
}

/**
 * Draw one <g class="cell-group"> per month with its colored background
 * rectangle, and wire up the hover tooltip.
 * @returns {d3.Selection} the cell groups (so sparklines can be added to them)
 */
function drawCells(plotArea, monthlyRecords, context) {
  const { yearScale, monthScale, colorScale, mode, levelConfig, sharedConfig, tooltip } = context;

  const cellGroups = plotArea
    .append("g")
    .attr("class", "cells")
    .selectAll("g.cell-group")
    .data(monthlyRecords, (d) => `${d.year}-${d.month}`)
    .join("g")
    .attr("class", "cell-group")
    .attr("transform", (d) => `translate(${yearScale(d.year)},${monthScale(d.month)})`);

  cellGroups
    .append("rect")
    .attr("class", "cell")
    .attr("width", yearScale.bandwidth())
    .attr("height", monthScale.bandwidth())
    .attr("rx", levelConfig.cellCornerRadius)
    .attr("fill", (d) => colorScale(temperatureForMode(d, mode)));

  // Hover outline. raise() moves the hovered cell above its neighbours so
  // the outline is never covered by an adjacent cell.
  const highlightCell = (group, isActive) => {
    d3.select(group)
      .raise()
      .select("rect.cell")
      .attr("stroke", isActive ? sharedConfig.hover.strokeColor : null)
      .attr("stroke-width", isActive ? sharedConfig.hover.strokeWidth : null);
  };

  cellGroups
    .on("mouseenter", function (event, monthRecord) {
      highlightCell(this, true);
      tooltip.show(formatTooltipText(monthRecord, levelConfig.tooltipSeparator), event);
    })
    .on("mousemove", (event) => tooltip.move(event))
    .on("mouseleave", function () {
      highlightCell(this, false);
      tooltip.hide();
    });

  return cellGroups;
}
