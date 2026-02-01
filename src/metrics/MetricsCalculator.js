/**
 * Metrics calculator and display formatter
 */

import { EventType } from '../engine/Simulation.js';

/**
 * Calculate metrics from simulation results
 * @param {import('../engine/Simulation').Simulation} simulation
 * @returns {Object} Metrics object
 */
export function calculateMetrics(simulation) {
    const events = simulation.getEvents();
    const metrics = simulation.getMetrics();

    // Format total time as minutes:seconds
    const totalMinutes = Math.floor(metrics.totalTime / 60);
    const totalSeconds = metrics.totalTime % 60;
    const totalTimeFormatted = `${totalMinutes}:${String(totalSeconds).padStart(2, '0')}`;

    return {
        totalTime: metrics.totalTime,
        totalTimeFormatted,
        avgWaitTime: metrics.avgWaitTime,
        maxWaitTime: metrics.maxWaitTime,
        aisleBlockedPercent: metrics.aisleBlockedPercent,
        totalPassengers: metrics.totalPassengers,
    };
}

/**
 * Format a time value in seconds to display string
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format metric for display
 */
export function formatMetricValue(key, value) {
    switch (key) {
        case 'totalTime':
            return formatTime(value);
        case 'avgWaitTime':
            return `${value.toFixed(1)} sec`;
        case 'maxWaitTime':
            return `${value} sec`;
        case 'aisleBlockedPercent':
            return `${value.toFixed(1)}%`;
        default:
            return String(value);
    }
}

/**
 * Format metric difference
 * @param {string} key - Metric key
 * @param {number} current - Current value
 * @param {number} base - Baseline value
 * @returns {string} HTML string with difference
 */
export function formatMetricDiff(key, current, base) {
    if (base === undefined || base === null) return '';

    const diff = current - base;
    if (Math.abs(diff) < 0.1) return ''; // Ignore negligible diffs

    let isBetter = false;
    // For time/delay/blocked, lower is better
    if (['totalTime', 'avgWaitTime', 'maxWaitTime', 'aisleBlockedPercent'].includes(key)) {
        isBetter = diff < 0;
    } else {
        // For efficiency metrics (if any), higher is better
        isBetter = diff > 0;
    }

    const colorClass = isBetter ? 'text-success' : 'text-error';
    const sign = diff > 0 ? '+' : '';

    let formattedDiff = '';
    switch (key) {
        case 'totalTime':
            formattedDiff = `${sign}${formatTime(Math.abs(diff)).replace(':', 'm ')}s`.replace('0m ', '');
            if (Math.abs(diff) < 60) formattedDiff = `${sign}${Math.abs(diff)}s`;
            break;
        case 'avgWaitTime':
        case 'maxWaitTime':
            formattedDiff = `${sign}${diff.toFixed(1)}s`;
            break;
        case 'aisleBlockedPercent':
            formattedDiff = `${sign}${diff.toFixed(1)}%`;
            break;
        default:
            formattedDiff = `${sign}${diff}`;
    }

    return `<span class="metric-diff ${colorClass}">(${formattedDiff})</span>`;
}
