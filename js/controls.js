/**
 * controls.js
 * ---------------------------------------------------------------------------
 * The "Maximum / Minimum" segmented toggle above the chart. It is a second
 * way to switch modes besides clicking the chart itself, and it always shows
 * which mode is active.
 */

/* global d3 */

/**
 * Build the toggle buttons inside `containerSelector`.
 * @param {string} containerSelector  CSS selector of the toggle container
 * @param {object} modeLabels         SHARED_CONFIG.modeLabels ({max: "...", min: "..."})
 * @param {string} initialMode        mode selected on load
 * @param {Function} onSelect         called with "max" or "min" when a button is clicked
 * @returns {{setActive: Function}}   call setActive(mode) to sync the buttons
 */
export function createModeToggle(containerSelector, modeLabels, initialMode, onSelect) {
  const container = d3
    .select(containerSelector)
    .attr("role", "group")
    .attr("aria-label", "Temperature shown in the cells");

  const buttons = container
    .selectAll("button")
    .data(Object.keys(modeLabels))
    .join("button")
    .attr("type", "button")
    .attr("class", "mode-button")
    .text((mode) => modeLabels[mode])
    .on("click", (_, mode) => onSelect(mode));

  /** Highlight the button of the active mode. */
  function setActive(activeMode) {
    buttons
      .classed("is-active", (mode) => mode === activeMode)
      .attr("aria-pressed", (mode) => String(mode === activeMode));
  }

  setActive(initialMode);
  return { setActive };
}

/**
 * Write the active mode into every element matching `selector`
 * (e.g. the subtitle "Showing monthly Maximum temperature").
 */
export function showModeLabel(selector, modeLabels, mode) {
  d3.selectAll(selector).text(modeLabels[mode]);
}
