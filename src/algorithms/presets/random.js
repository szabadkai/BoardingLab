/**
 * Random Baseline Algorithm
 * Control reference - uniform random priority
 */

export const randomAlgorithm = {
    name: 'Random',
    description: 'Random boarding order - control baseline for comparison',
    code: `// Random priority - no pattern
return Math.random();`,

    // Actual implementation uses deterministic RNG passed through context
    createPriorityFn: (params, rng) => {
        const priorities = new Map();
        return (passenger, context) => {
            if (!priorities.has(passenger.id)) {
                priorities.set(passenger.id, rng.next());
            }
            return priorities.get(passenger.id);
        };
    }
};

export default randomAlgorithm;
