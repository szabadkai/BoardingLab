/**
 * Window-Middle-Aisle (WMA) Algorithm
 * Also known as WILMA (Window, Interior, Lateral, Middle, Aisle)
 * Seat class dominates, row is secondary
 * Demonstrates seat interference reduction
 */

export const windowMiddleAisleAlgorithm = {
    name: 'Window-Middle-Aisle',
    description: 'Window seats first, then middle, then aisle - reduces seat shuffling',
    code: `// Seat class priority: window=3, middle=2, aisle=1
const seatPriority = {
  'window': 300,
  'middle': 200,
  'aisle': 100
};

// Primary: seat class, Secondary: row (back first)
return seatPriority[passenger.seatClass] + passenger.row;`,

    createPriorityFn: (params, rng) => {
        return (passenger, context) => {
            const seatPriority = {
                'window': 300,
                'middle': 200,
                'aisle': 100
            };
            // Primary: seat class, Secondary: row (back first)
            return seatPriority[passenger.seatClass] + passenger.row;
        };
    }
};

export default windowMiddleAisleAlgorithm;
