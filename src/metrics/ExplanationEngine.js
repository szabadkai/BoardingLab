/**
 * Explanation Engine
 * Analyzes simulation events to identify top delay causes
 * and generate natural-language explanations
 */

import { EventType } from '../engine/Simulation.js';

/**
 * Delay cause types
 */
export const DelayCause = {
    AISLE_CONGESTION: 'aisle_congestion',
    BIN_OVERFLOW: 'bin_overflow',
    SEAT_SHUFFLE: 'seat_shuffle',
    SLOW_STOWING: 'slow_stowing',
};

/**
 * Analyze simulation events and identify delay causes
 * @param {Object[]} events - Simulation events
 * @param {Object} metrics - Simulation metrics
 * @returns {Object[]} Array of delay causes with explanations
 */
export function analyzeDelayCauses(events, metrics) {
    const causes = [];

    // Count events by type
    const eventCounts = {};
    for (const event of events) {
        eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    }

    // Analyze aisle blocking
    const aisleBlockedEvents = events.filter(e => e.type === EventType.AISLE_BLOCKED);
    if (aisleBlockedEvents.length > 0) {
        // Find rows with most blocking
        const blockingByRow = {};
        for (const event of aisleBlockedEvents) {
            const row = event.row;
            blockingByRow[row] = (blockingByRow[row] || 0) + 1;
        }

        // Get top blocking rows
        const topRows = Object.entries(blockingByRow)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([row, count]) => ({ row: parseInt(row), count }));

        const blockingPercent = (aisleBlockedEvents.length / events.length * 100).toFixed(1);

        causes.push({
            type: DelayCause.AISLE_CONGESTION,
            severity: aisleBlockedEvents.length > 100 ? 'high' : 'medium',
            percentage: parseFloat(blockingPercent),
            details: {
                totalBlocked: aisleBlockedEvents.length,
                topRows,
            },
            explanation: generateAisleCongestionExplanation(topRows, blockingPercent),
        });
    }

    // Analyze bin overflow
    const binFullEvents = events.filter(e => e.type === EventType.BIN_FULL);
    if (binFullEvents.length > 0) {
        const rowsAffected = [...new Set(binFullEvents.map(e => e.row))];

        causes.push({
            type: DelayCause.BIN_OVERFLOW,
            severity: binFullEvents.length > 10 ? 'high' : 'low',
            details: {
                count: binFullEvents.length,
                rows: rowsAffected,
            },
            explanation: generateBinOverflowExplanation(rowsAffected),
        });
    }

    // Analyze seat shuffling
    const shuffleEvents = events.filter(e => e.type === EventType.SHUFFLE_START);
    if (shuffleEvents.length > 0) {
        const shufflePercent = (shuffleEvents.length / metrics.totalPassengers * 100).toFixed(1);

        causes.push({
            type: DelayCause.SEAT_SHUFFLE,
            severity: shuffleEvents.length > metrics.totalPassengers * 0.3 ? 'high' : 'medium',
            percentage: parseFloat(shufflePercent),
            details: {
                count: shuffleEvents.length,
            },
            explanation: generateShuffleExplanation(shuffleEvents.length, shufflePercent),
        });
    }

    // Analyze stowing time
    const stowEvents = events.filter(e => e.type === EventType.STOW_START);
    const totalStowTime = stowEvents.reduce((sum, e) => {
        const endEvent = events.find(
            end => end.type === EventType.STOW_END &&
                end.passengerId === e.passengerId
        );
        return sum + (endEvent ? endEvent.step - e.step : 0);
    }, 0);

    if (totalStowTime > metrics.totalTime * 0.3) {
        const stowPercent = (totalStowTime / metrics.totalTime * 100).toFixed(1);

        causes.push({
            type: DelayCause.SLOW_STOWING,
            severity: 'medium',
            percentage: parseFloat(stowPercent),
            details: {
                totalTime: totalStowTime,
            },
            explanation: generateStowingExplanation(stowPercent),
        });
    }

    // Sort by severity/impact
    causes.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
    });

    return causes.slice(0, 2); // Return top 2 causes
}

/**
 * Generate explanation for aisle congestion
 */
function generateAisleCongestionExplanation(topRows, percent) {
    if (topRows.length === 0) return '';

    const rowList = topRows.map(r => r.row).join(', ');
    return `Aisle congestion in rows ${rowList} caused ${percent}% of delays. ` +
        `Passengers waiting to stow luggage blocked following passengers.`;
}

/**
 * Generate explanation for bin overflow
 */
function generateBinOverflowExplanation(rows) {
    const rowRange = rows.length > 2
        ? `rows ${Math.min(...rows)}–${Math.max(...rows)}`
        : `row${rows.length > 1 ? 's' : ''} ${rows.join(' and ')}`;

    return `Overhead bins filled up in ${rowRange}, forcing passengers to search ` +
        `for space elsewhere, adding extra delay.`;
}

/**
 * Generate explanation for seat shuffling
 */
function generateShuffleExplanation(count, percent) {
    return `${count} passengers (${percent}%) had to wait for seated passengers ` +
        `to move before accessing their seats. Window-first boarding can reduce this.`;
}

/**
 * Generate explanation for stowing delays
 */
function generateStowingExplanation(percent) {
    return `Luggage stowing accounted for ${percent}% of total boarding time. ` +
        `Large carry-ons significantly slow down the process.`;
}

/**
 * Generate a summary explanation from top causes
 */
export function generateSummaryExplanation(causes, algorithmName) {
    if (causes.length === 0) {
        return `The ${algorithmName} strategy completed efficiently with minimal delays.`;
    }

    const parts = causes.map(c => c.explanation);
    return parts.join(' ');
}
