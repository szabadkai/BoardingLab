/**
 * Passenger model with immutable attributes.
 * Each passenger has a seat assignment and behavioral characteristics.
 */

export const WalkSpeed = {
    SLOW: 'slow',
    NORMAL: 'normal',
    FAST: 'fast',
};

export const CarryOnSize = {
    NONE: 'none',
    SMALL: 'small',
    LARGE: 'large',
};

export const ComplianceLevel = {
    STRICT: 'strict',     // Always follows rules
    NORMAL: 'normal',     // Usually follows rules  
    OPPORTUNISTIC: 'opportunistic', // May deviate if advantageous
};

// Walk speed multipliers (cells per time step)
const SPEED_MULTIPLIERS = {
    [WalkSpeed.SLOW]: 0.7,
    [WalkSpeed.NORMAL]: 1.0,
    [WalkSpeed.FAST]: 1.3,
};

// Time to stow luggage (in time steps)
const STOW_TIMES = {
    [CarryOnSize.NONE]: 0,
    [CarryOnSize.SMALL]: 3,
    [CarryOnSize.LARGE]: 8,
};

/**
 * Passenger class representing a single passenger
 */
export class Passenger {
    /**
     * @param {Object} config
     * @param {number} config.id - Unique passenger ID
     * @param {number} config.row - Seat row (1-indexed)
     * @param {string} config.column - Seat column (A-F for 3-3 config)
     * @param {string} config.walkSpeed - From WalkSpeed enum
     * @param {string} config.carryOnSize - From CarryOnSize enum
     * @param {string} config.compliance - From ComplianceLevel enum
     * @param {number|null} config.groupId - Optional group identifier
     */
    constructor({
        id,
        row,
        column,
        walkSpeed = WalkSpeed.NORMAL,
        carryOnSize = CarryOnSize.SMALL,
        compliance = ComplianceLevel.NORMAL,
        groupId = null,
    }) {
        // Immutable properties (freeze at end)
        this.id = id;
        this.row = row;
        this.column = column;
        this.walkSpeed = walkSpeed;
        this.carryOnSize = carryOnSize;
        this.compliance = compliance;
        this.groupId = groupId;

        // Derived properties
        this.seatClass = this._computeSeatClass();
        this.speedMultiplier = SPEED_MULTIPLIERS[walkSpeed];
        this.stowTime = STOW_TIMES[carryOnSize];

        // Freeze to enforce immutability
        Object.freeze(this);
    }

    /**
     * Compute seat class (window, middle, aisle) based on column
     * For 3-3 configuration: A=window, B=middle, C=aisle, D=aisle, E=middle, F=window
     * @returns {string}
     */
    _computeSeatClass() {
        const columnIndex = this.column.charCodeAt(0) - 'A'.charCodeAt(0);
        if (columnIndex === 0 || columnIndex === 5) return 'window';
        if (columnIndex === 1 || columnIndex === 4) return 'middle';
        return 'aisle';
    }

    /**
     * Get the aisle column index for this passenger's row
     * Returns the column index they need to reach to access their seat
     */
    get aisleAccessColumn() {
        const columnIndex = this.column.charCodeAt(0) - 'A'.charCodeAt(0);
        // Columns A, B, C access from left aisle position
        // Columns D, E, F access from right aisle position
        return columnIndex < 3 ? 'left' : 'right';
    }

    /**
     * Get number of seats this passenger needs to pass to reach their seat
     * (number of people who might need to stand up)
     */
    get seatsToPass() {
        const columnIndex = this.column.charCodeAt(0) - 'A'.charCodeAt(0);
        // From left: A=2, B=1, C=0
        // From right: D=0, E=1, F=2
        if (columnIndex < 3) {
            return 2 - columnIndex;
        } else {
            return columnIndex - 3;
        }
    }

    /**
     * Serialize passenger for algorithm context
     */
    toContext() {
        return {
            id: this.id,
            row: this.row,
            column: this.column,
            seatClass: this.seatClass,
            walkSpeed: this.walkSpeed,
            carryOnSize: this.carryOnSize,
            compliance: this.compliance,
            groupId: this.groupId,
            seatsToPass: this.seatsToPass,
        };
    }
}

/**
 * Generate passengers for a simulation
 * @param {Object} config
 * @param {number} config.count - Number of passengers
 * @param {number} config.rows - Number of rows in aircraft
 * @param {string[]} config.columns - Column labels
 * @param {import('./RandomGenerator').RandomGenerator} config.rng - Random generator
 * @returns {Passenger[]}
 */
export function generatePassengers({ count, rows, columns, rng }) {
    // Create all possible seats
    const allSeats = [];
    for (let row = 1; row <= rows; row++) {
        for (const column of columns) {
            allSeats.push({ row, column });
        }
    }

    // Shuffle and take the required number
    rng.shuffle(allSeats);
    const selectedSeats = allSeats.slice(0, count);

    // Create passengers with random attributes
    return selectedSeats.map((seat, index) => {
        const walkSpeed = rng.pick([
            WalkSpeed.SLOW,
            WalkSpeed.NORMAL,
            WalkSpeed.NORMAL,  // Normal is more common
            WalkSpeed.NORMAL,
            WalkSpeed.FAST,
        ]);

        const carryOnSize = rng.pick([
            CarryOnSize.NONE,
            CarryOnSize.SMALL,
            CarryOnSize.SMALL,  // Small is most common
            CarryOnSize.SMALL,
            CarryOnSize.LARGE,
        ]);

        const compliance = rng.pick([
            ComplianceLevel.STRICT,
            ComplianceLevel.NORMAL,
            ComplianceLevel.NORMAL,
            ComplianceLevel.NORMAL,
            ComplianceLevel.OPPORTUNISTIC,
        ]);

        return new Passenger({
            id: index + 1,
            row: seat.row,
            column: seat.column,
            walkSpeed,
            carryOnSize,
            compliance,
            groupId: null, // Groups can be added later
        });
    });
}
