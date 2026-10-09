/**
 * app.js
 * ---------------------------------------------------------------------------
 * Entry point shared by level1.html and level2.html. It wires the pieces
 * together in order: load data -> aggregate -> draw heatmap -> hook up the
 * toggle. Each page only passes its own level config.
 */

/* global d3 */

(function (TemperatureHeatmap) {
  "use strict";

  // Functions provided by the scripts loaded before this one.
  const {
    SHARED_CONFIG,
    loadDailyTemperatures,
    aggregateByMonth,
    filterRecentYears,
    listYears,
    createTemperatureHeatmap,
    createModeToggle,
    showModeLabel,
  } = TemperatureHeatmap;

  /** Page elements the app writes into (ids/classes defined in the HTML). */
  const PAGE_SELECTORS = {
    modeToggle: "#mode-toggle",
    modeLabel: ".js-mode-label",
    yearRange: ".js-year-range",
    status: "#chart-status",
  };

  /**
   * Load the data and render one level of the visualization.
   * @param {object} levelConfig  LEVEL1_CONFIG or LEVEL2_CONFIG
   */
  async function renderLevel(levelConfig) {
    try {
      const dailyRecords = await loadDailyTemperatures(SHARED_CONFIG);
      const monthlyRecords = filterRecentYears(aggregateByMonth(dailyRecords), levelConfig.recentYearCount);
      showYearRange(monthlyRecords);
      syncLineKeyColors(levelConfig);

      // The toggle and the chart keep each other in sync through these callbacks.
      let modeToggle = null;
      const heatmap = createTemperatureHeatmap({
        monthlyRecords,
        sharedConfig: SHARED_CONFIG,
        levelConfig,
        onModeChange: (mode) => {
          modeToggle.setActive(mode);
          showModeLabel(PAGE_SELECTORS.modeLabel, SHARED_CONFIG.modeLabels, mode);
        },
      });
      modeToggle = createModeToggle(
        PAGE_SELECTORS.modeToggle,
        SHARED_CONFIG.modeLabels,
        SHARED_CONFIG.initialMode,
        (mode) => heatmap.setMode(mode),
      );
      showModeLabel(PAGE_SELECTORS.modeLabel, SHARED_CONFIG.modeLabels, SHARED_CONFIG.initialMode);
      d3.select(PAGE_SELECTORS.status).remove();
    } catch (error) {
      showLoadError(error);
    }
  }

  /** Write "1997 – 2017" (first and last year shown) into the page header. */
  function showYearRange(monthlyRecords) {
    const years = listYears(monthlyRecords);
    d3.selectAll(PAGE_SELECTORS.yearRange).text(`${years[0]} – ${years[years.length - 1]}`);
  }

  /**
   * Copy the sparkline colors from config.js into CSS variables so the
   * "Daily maximum / Daily minimum" key above the chart always matches the lines.
   */
  function syncLineKeyColors(levelConfig) {
    if (!levelConfig.sparkline) return;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--line-max", levelConfig.sparkline.maxLineColor);
    rootStyle.setProperty("--line-min", levelConfig.sparkline.minLineColor);
  }

  /**
   * Shown if the data cannot be loaded (e.g. the CSV is missing, or the page
   * is opened from disk without js/temperature-data.js).
   */
  function showLoadError(error) {
    console.error(error);
    d3.select(PAGE_SELECTORS.status)
      .classed("is-error", true)
      .html(
        "Could not load <code>temperature_daily.csv</code>. " +
          "Try serving the folder with <code>python -m http.server 8000</code> " +
          "and opening <code>http://localhost:8000</code>.",
      );
  }

  // Make this file's public functions available to the other scripts.
  Object.assign(TemperatureHeatmap, { renderLevel });
})((window.TemperatureHeatmap = window.TemperatureHeatmap || {}));
