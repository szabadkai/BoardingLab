/**
 * Zone-Based Algorithm
 * Mirrors real airline practice - aircraft divided into zones
 * Configurable number of zones and enforcement
 */

export const zoneBasedAlgorithm = {
    name: 'Zone-Based',
    description: 'Zones board from back to front - mirrors real airline practice',
    code: `// Divide aircraft into zones (default 5)
const numZones = 5;
const rowsPerZone = Math.ceil(context.totalRows / numZones);
const zone = Math.floor((passenger.row - 1) / rowsPerZone);

// Higher zone number = higher priority (back zones first)
return zone * 1000 + passenger.row;`,

    // Configurable parameters
    parameters: {
        numZones: {
            label: 'Number of Zones',
            type: 'number',
            default: 5,
            min: 2,
            max: 10,
        },
    },

    createPriorityFn: (params = {}, rng) => {
        const numZones = params.numZones || 5;

        return (passenger, context) => {
            const rowsPerZone = Math.ceil(context.totalRows / numZones);
            const zone = Math.floor((passenger.row - 1) / rowsPerZone);

            // Higher zone number = higher priority (back zones first)
            return zone * 1000 + passenger.row;
        };
    }
};

export default zoneBasedAlgorithm;
