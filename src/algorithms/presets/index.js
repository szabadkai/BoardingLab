/**
 * Algorithm presets index
 */

import randomAlgorithm from './random.js';
import backToFrontAlgorithm from './backToFront.js';
import windowMiddleAisleAlgorithm from './windowMiddleAisle.js';
import zoneBasedAlgorithm from './zoneBased.js';
import weightedHeuristicAlgorithm from './weightedHeuristic.js';

export const algorithms = {
    random: randomAlgorithm,
    backToFront: backToFrontAlgorithm,
    windowMiddleAisle: windowMiddleAisleAlgorithm,
    zoneBased: zoneBasedAlgorithm,
    weightedHeuristic: weightedHeuristicAlgorithm,
};

export const algorithmList = [
    { id: 'random', ...randomAlgorithm },
    { id: 'backToFront', ...backToFrontAlgorithm },
    { id: 'windowMiddleAisle', ...windowMiddleAisleAlgorithm },
    { id: 'zoneBased', ...zoneBasedAlgorithm },
    { id: 'weightedHeuristic', ...weightedHeuristicAlgorithm },
];

export default algorithms;
