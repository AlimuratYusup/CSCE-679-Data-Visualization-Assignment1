/**
 * tooltip.js
 * ---------------------------------------------------------------------------
 * A small floating tooltip that follows the mouse. It is a plain HTML <div>
 * (not SVG) so the text stays crisp and is never clipped by the chart.
 */

/* global d3 */

/**
 * Text shown when hovering a cell, in the format of the reference images:
 *   "Date: 2002-03; max: 28 min: 14"
 * @param {object} monthRecord  monthly record from data.js
 * @param {string} separator    character after the date (";" or ",")
 */
export function formatTooltipText(monthRecord, separator) {
  const monthText = String(monthRecord.month).padStart(2, "0");
  return (
    `Date: ${monthRecord.year}-${monthText}${separator} ` +
    `max: ${monthRecord.maxTemperature} min: ${monthRecord.minTemperature}`
  );
}

/**
 * Create the tooltip element and return functions to control it.
 * @param {object} tooltipConfig  SHARED_CONFIG.tooltip
 * @returns {{show: Function, move: Function, hide: Function}}
 */
export function createTooltip(tooltipConfig) {
  const tooltipElement = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .attr("role", "tooltip")
    .style("opacity", 0);

  /** Place the tooltip next to the cursor, flipping it if it would leave the window. */
  function move(event) {
    const node = tooltipElement.node();
    const { offsetWidth: width, offsetHeight: height } = node;

    let left = event.clientX + tooltipConfig.offsetX;
    let top = event.clientY + tooltipConfig.offsetY;
    if (left + width > window.innerWidth) left = event.clientX - tooltipConfig.offsetX - width;
    if (top + height > window.innerHeight) top = event.clientY - tooltipConfig.offsetY - height;

    tooltipElement.style("left", `${left}px`).style("top", `${top}px`);
  }

  /** Fill in the text and fade the tooltip in. */
  function show(text, event) {
    tooltipElement.text(text).style("opacity", 1);
    move(event);
  }

  /** Fade the tooltip out. */
  function hide() {
    tooltipElement.style("opacity", 0);
  }

  return { show, move, hide };
}
