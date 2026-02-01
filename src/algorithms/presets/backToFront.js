/**
 * Back-to-Front Algorithm
 * Higher row number = higher priority (boards first)
 * Demonstrates bin congestion issues
 */

export const backToFrontAlgorithm = {
    name: 'Back-to-Front',
    description: 'Passengers in back rows board first - demonstrates bin congestion',
    code: `// Higher row number = higher priority
return passenger.row;`,

    createPriorityFn: (params, rng) => {
        return (passenger, context) => {
            return passenger.row;
        };
    }
};

export default backToFrontAlgorithm;
