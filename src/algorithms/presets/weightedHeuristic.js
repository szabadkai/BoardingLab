/**
 * Weighted Heuristic Algorithm
 * Linear combination of passenger attributes
 * Recommended starting point for custom strategies
 */

export const weightedHeuristicAlgorithm = {
    name: 'Weighted Heuristic',
    description: 'Customizable weights for row, seat class, and luggage - best starting point for edits',
    code: `// Weights for different factors
const rowWeight = 10;      // Higher = prioritize back rows
const seatWeight = 50;     // Higher = prioritize window seats
const luggageWeight = -20; // Negative = prioritize less luggage

// Seat class scores
const seatScore = {
  'window': 3,
  'middle': 2,
  'aisle': 1
};

// Luggage scores
const luggageScore = {
  'none': 0,
  'small': 1,
  'large': 2
};

return (passenger.row * rowWeight) +
       (seatScore[passenger.seatClass] * seatWeight) +
       (luggageScore[passenger.carryOnSize] * luggageWeight);`,

    // Configurable parameters
    parameters: {
        rowWeight: {
            label: 'Row Weight',
            type: 'number',
            default: 10,
            min: -100,
            max: 100,
        },
        seatWeight: {
            label: 'Seat Class Weight',
            type: 'number',
            default: 50,
            min: -100,
            max: 100,
        },
        luggageWeight: {
            label: 'Luggage Weight',
            type: 'number',
            default: -20,
            min: -100,
            max: 100,
        },
    },

    createPriorityFn: (params = {}, rng) => {
        const rowWeight = params.rowWeight ?? 10;
        const seatWeight = params.seatWeight ?? 50;
        const luggageWeight = params.luggageWeight ?? -20;

        return (passenger, context) => {
            const seatScore = {
                'window': 3,
                'middle': 2,
                'aisle': 1
            };

            const luggageScore = {
                'none': 0,
                'small': 1,
                'large': 2
            };

            return (passenger.row * rowWeight) +
                (seatScore[passenger.seatClass] * seatWeight) +
                (luggageScore[passenger.carryOnSize] * luggageWeight);
        };
    }
};

export default weightedHeuristicAlgorithm;
