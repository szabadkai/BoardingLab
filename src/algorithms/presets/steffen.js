/**
 * Steffen Method
 * Theoretically the most efficient boarding method
 * Boards in 6 stages: 
 * 1. Window Even rows (back to front)
 * 2. Window Odd rows (back to front)
 * 3. Middle Even rows (back to front)
 * 4. Middle Odd rows (back to front)
 * 5. Aisle Even rows (back to front)
 * 6. Aisle Odd rows (back to front)
 */

export const steffenAlgorithm = {
    name: 'Steffen Method',
    description: 'Perfectly interleaves rows and columns to minimize both aisle and seat interference.',
    code: `// Steffen Method stages
const seatScores = {
  'window': 3000,
  'middle': 2000,
  'aisle': 1000
};

// Even rows (30, 28, ...) board before Odd rows (29, 27, ...) within each class
const parityScore = (passenger.row % 2 === 0) ? 500 : 0;

// High priority for back rows
return seatScores[passenger.seatClass] + parityScore + passenger.row;`,

    createPriorityFn: (params, rng) => {
        return (passenger, context) => {
            const seatScores = {
                'window': 3000,
                'middle': 2000,
                'aisle': 1000
            };
            const parityScore = (passenger.row % 2 === 0) ? 500 : 0;
            return seatScores[passenger.seatClass] + parityScore + passenger.row;
        };
    }
};

export default steffenAlgorithm;
