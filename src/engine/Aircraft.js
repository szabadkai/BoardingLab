/**
 * Aircraft model for single-aisle narrow-body configuration.
 * Represents the physical layout including seats, aisle, and overhead bins.
 */

/**
 * Default aircraft configuration (similar to Boeing 737 / Airbus A320)
 */
export const DEFAULT_CONFIG = {
    rows: 30,
    columns: ['A', 'B', 'C', 'D', 'E', 'F'],  // 3-3 configuration
    aislePosition: 3,  // Aisle is between columns C and D (index 3)
    binCapacityPerRow: 6,  // Overhead bin capacity per row (bags)
    boardingDoor: 'front',  // Front door boarding
};

/**
 * Aircraft class representing the physical aircraft layout
 */
export class Aircraft {
    /**
     * @param {Object} config - Aircraft configuration
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.rows = this.config.rows;
        this.columns = this.config.columns;
        this.aislePosition = this.config.aislePosition;

        // Initialize overhead bins (tracks remaining capacity per row)
        this.binCapacity = new Map();
        for (let row = 1; row <= this.rows; row++) {
            this.binCapacity.set(row, this.config.binCapacityPerRow);
        }

        // Seat occupancy map: "row-column" -> passenger or null
        this.seats = new Map();
        for (let row = 1; row <= this.rows; row++) {
            for (const column of this.columns) {
                this.seats.set(`${row}-${column}`, null);
            }
        }

        // Aisle state: row -> passenger in aisle at that row, or null
        this.aisle = new Map();
        for (let row = 0; row <= this.rows; row++) {
            this.aisle.set(row, null);  // Row 0 is entry point
        }

        Object.freeze(this.config);
    }

    /**
     * Reset aircraft state to empty
     */
    reset() {
        for (let row = 1; row <= this.rows; row++) {
            this.binCapacity.set(row, this.config.binCapacityPerRow);
            for (const column of this.columns) {
                this.seats.set(`${row}-${column}`, null);
            }
        }
        for (let row = 0; row <= this.rows; row++) {
            this.aisle.set(row, null);
        }
    }

    /**
     * Get total number of seats
     */
    get totalSeats() {
        return this.rows * this.columns.length;
    }

    /**
     * Check if a seat is occupied
     * @param {number} row 
     * @param {string} column 
     * @returns {boolean}
     */
    isSeatOccupied(row, column) {
        return this.seats.get(`${row}-${column}`) !== null;
    }

    /**
     * Get passenger in a seat
     * @param {number} row 
     * @param {string} column 
     * @returns {import('./Passenger').Passenger|null}
     */
    getPassengerInSeat(row, column) {
        return this.seats.get(`${row}-${column}`);
    }

    /**
     * Seat a passenger
     * @param {import('./Passenger').Passenger} passenger 
     */
    seatPassenger(passenger) {
        this.seats.set(`${passenger.row}-${passenger.column}`, passenger);
    }

    /**
     * Check if aisle position is occupied
     * @param {number} row 
     * @returns {boolean}
     */
    isAisleOccupied(row) {
        return this.aisle.get(row) !== null;
    }

    /**
     * Get passenger in aisle at row
     * @param {number} row 
     * @returns {import('./Passenger').Passenger|null}
     */
    getPassengerInAisle(row) {
        return this.aisle.get(row);
    }

    /**
     * Place passenger in aisle
     * @param {import('./Passenger').Passenger} passenger 
     * @param {number} row 
     */
    placeInAisle(passenger, row) {
        this.aisle.set(row, passenger);
    }

    /**
     * Remove passenger from aisle
     * @param {number} row 
     */
    removeFromAisle(row) {
        this.aisle.set(row, null);
    }

    /**
     * Check if bin has capacity at row
     * @param {number} row 
     * @param {string} carryOnSize 
     * @returns {boolean}
     */
    hasBinCapacity(row, carryOnSize) {
        if (carryOnSize === 'none') return true;
        const required = carryOnSize === 'small' ? 1 : 2;
        return this.binCapacity.get(row) >= required;
    }

    /**
     * Use bin capacity at row
     * @param {number} row 
     * @param {string} carryOnSize 
     * @returns {boolean} Success
     */
    useBinCapacity(row, carryOnSize) {
        if (carryOnSize === 'none') return true;
        const required = carryOnSize === 'small' ? 1 : 2;
        const current = this.binCapacity.get(row);
        if (current >= required) {
            this.binCapacity.set(row, current - required);
            return true;
        }
        return false;
    }

    /**
     * Find nearest row with bin capacity
     * @param {number} startRow 
     * @param {string} carryOnSize 
     * @returns {number|null}
     */
    findNearestBinCapacity(startRow, carryOnSize) {
        for (let offset = 0; offset <= this.rows; offset++) {
            const rowAbove = startRow - offset;
            const rowBelow = startRow + offset;
            if (rowAbove >= 1 && this.hasBinCapacity(rowAbove, carryOnSize)) {
                return rowAbove;
            }
            if (rowBelow <= this.rows && this.hasBinCapacity(rowBelow, carryOnSize)) {
                return rowBelow;
            }
        }
        return null;
    }

    /**
     * Check if seats in the way to reach target seat are occupied
     * @param {number} row 
     * @param {string} targetColumn 
     * @returns {string[]} Columns with occupied seats blocking access
     */
    getBlockingSeats(row, targetColumn) {
        const blocking = [];
        const targetIndex = targetColumn.charCodeAt(0) - 'A'.charCodeAt(0);

        if (targetIndex < this.aislePosition) {
            // Left side: check seats between aisle and target
            for (let i = this.aislePosition - 1; i > targetIndex; i--) {
                const col = String.fromCharCode('A'.charCodeAt(0) + i);
                if (this.isSeatOccupied(row, col)) {
                    blocking.push(col);
                }
            }
        } else {
            // Right side: check seats between aisle and target
            for (let i = this.aislePosition; i < targetIndex; i++) {
                const col = String.fromCharCode('A'.charCodeAt(0) + i);
                if (this.isSeatOccupied(row, col)) {
                    blocking.push(col);
                }
            }
        }

        return blocking;
    }

    /**
     * Get the number of seated passengers
     * @returns {number}
     */
    getSeatedCount() {
        let count = 0;
        for (const passenger of this.seats.values()) {
            if (passenger !== null) count++;
        }
        return count;
    }

    /**
     * Get all passengers currently in aisle
     * @returns {Array<{row: number, passenger: import('./Passenger').Passenger}>}
     */
    getAislePassengers() {
        const passengers = [];
        for (const [row, passenger] of this.aisle.entries()) {
            if (passenger !== null) {
                passengers.push({ row, passenger });
            }
        }
        return passengers;
    }
}
