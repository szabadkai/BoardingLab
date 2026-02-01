/**
 * Core simulation engine that runs the boarding simulation step by step.
 * Handles passenger movement, stowing, seating, and event recording.
 */

import { Aircraft } from './Aircraft.js';
import { CarryOnSize } from './Passenger.js';

/**
 * Passenger state during simulation
 */
export const PassengerState = {
    WAITING: 'waiting',      // In queue, not yet in aircraft
    WALKING: 'walking',      // Walking down aisle
    STOWING: 'stowing',      // Stowing luggage in overhead bin
    SHUFFLING: 'shuffling',  // Waiting for seated passengers to move
    SEATING: 'seating',      // Moving into seat
    SEATED: 'seated',        // Seated and done
};

/**
 * Event types recorded during simulation
 */
export const EventType = {
    ENTER: 'enter',              // Passenger enters aircraft
    MOVE: 'move',                // Passenger moves in aisle
    STOW_START: 'stow_start',    // Starts stowing luggage
    STOW_END: 'stow_end',        // Finishes stowing luggage
    SHUFFLE_START: 'shuffle_start',  // Waiting for seat access
    SHUFFLE_END: 'shuffle_end',  // Gets seat access
    SEAT: 'seat',                // Sits in seat
    AISLE_BLOCKED: 'aisle_blocked',  // Blocked by passenger ahead
    BIN_FULL: 'bin_full',        // Overflow bin at target row
};

/**
 * Simulation class that manages the boarding process
 */
export class Simulation {
    /**
     * @param {Object} config
     * @param {import('./Passenger').Passenger[]} config.passengers
     * @param {Aircraft} config.aircraft
     */
    constructor({ passengers, aircraft }) {
        this.aircraft = aircraft;
        this.originalPassengers = passengers;

        // Reset and initialize
        this.reset();
    }

    /**
     * Reset simulation to initial state
     */
    reset() {
        this.aircraft.reset();
        this.currentStep = 0;
        this.isComplete = false;
        this.events = [];

        // Create mutable passenger states
        this.passengerStates = new Map();
        this.queue = [];

        for (const passenger of this.originalPassengers) {
            this.passengerStates.set(passenger.id, {
                passenger,
                state: PassengerState.WAITING,
                aisleRow: -1,      // -1 = not in aisle yet
                stowRemaining: 0,  // Steps remaining to finish stowing
                shuffleRemaining: 0,  // Steps remaining for shuffle
                waitTime: 0,       // Total time waiting (blocked)
                enteredAt: -1,     // Step when entered aircraft
                seatedAt: -1,      // Step when seated
            });
        }
    }

    /**
     * Set boarding order based on algorithm priority
     * @param {number[]} orderedIds - Passenger IDs in boarding order
     */
    setBoardingOrder(orderedIds) {
        this.queue = orderedIds.map(id => this.passengerStates.get(id));
    }

    /**
     * Run a single simulation step
     * @returns {boolean} Whether the simulation is still running
     */
    step() {
        if (this.isComplete) return false;

        this.currentStep++;

        // Process passengers from back to front (so front passengers move into space)
        const aislePassengers = this._getAislePassengersSorted();

        for (const ps of aislePassengers) {
            this._processPassengerInAisle(ps);
        }

        // Try to add next passenger from queue
        this._tryAddFromQueue();

        // Check completion
        this._checkCompletion();

        return !this.isComplete;
    }

    /**
     * Run simulation to completion
     * @param {number} maxSteps - Maximum steps to prevent infinite loops
     * @returns {number} Number of steps taken
     */
    runToCompletion(maxSteps = 10000) {
        while (!this.isComplete && this.currentStep < maxSteps) {
            this.step();
        }
        return this.currentStep;
    }

    /**
     * Get passengers in aisle sorted by row (back to front)
     */
    _getAislePassengersSorted() {
        const inAisle = [];
        for (const ps of this.passengerStates.values()) {
            if (ps.state !== PassengerState.WAITING &&
                ps.state !== PassengerState.SEATED &&
                ps.aisleRow >= 0) {
                inAisle.push(ps);
            }
        }
        // Sort by row descending (process back passengers first)
        return inAisle.sort((a, b) => b.aisleRow - a.aisleRow);
    }

    /**
     * Process a passenger currently in the aisle
     */
    _processPassengerInAisle(ps) {
        const { passenger, state, aisleRow } = ps;

        switch (state) {
            case PassengerState.WALKING:
                this._processWalking(ps);
                break;

            case PassengerState.STOWING:
                this._processStowing(ps);
                break;

            case PassengerState.SHUFFLING:
                this._processShuffling(ps);
                break;

            case PassengerState.SEATING:
                this._processSeating(ps);
                break;
        }
    }

    /**
     * Process walking passenger
     */
    _processWalking(ps) {
        const { passenger, aisleRow } = ps;
        const targetRow = passenger.row;

        // Check if we've reached our row
        if (aisleRow === targetRow) {
            // Check if we need to stow luggage
            if (passenger.carryOnSize !== CarryOnSize.NONE) {
                ps.state = PassengerState.STOWING;
                ps.stowRemaining = passenger.stowTime;
                this._recordEvent(EventType.STOW_START, passenger, { row: aisleRow });

                // Check bin capacity
                if (!this.aircraft.hasBinCapacity(aisleRow, passenger.carryOnSize)) {
                    this._recordEvent(EventType.BIN_FULL, passenger, { row: aisleRow });
                }
            } else {
                // No luggage, move to shuffling/seating
                this._startSeating(ps);
            }
            return;
        }

        // Try to move forward
        const nextRow = aisleRow + 1;
        if (nextRow <= this.aircraft.rows && !this.aircraft.isAisleOccupied(nextRow)) {
            // Move forward
            this.aircraft.removeFromAisle(aisleRow);
            this.aircraft.placeInAisle(passenger, nextRow);
            ps.aisleRow = nextRow;
            this._recordEvent(EventType.MOVE, passenger, { from: aisleRow, to: nextRow });
        } else {
            // Blocked
            ps.waitTime++;
            this._recordEvent(EventType.AISLE_BLOCKED, passenger, { row: aisleRow, blockedBy: nextRow });
        }
    }

    /**
     * Process stowing passenger
     */
    _processStowing(ps) {
        ps.stowRemaining--;

        if (ps.stowRemaining <= 0) {
            // Done stowing
            this.aircraft.useBinCapacity(ps.aisleRow, ps.passenger.carryOnSize);
            this._recordEvent(EventType.STOW_END, ps.passenger, { row: ps.aisleRow });
            this._startSeating(ps);
        } else {
            // Still stowing, blocking aisle
            ps.waitTime++;
        }
    }

    /**
     * Start seating process (check for shuffle)
     */
    _startSeating(ps) {
        const blocking = this.aircraft.getBlockingSeats(ps.passenger.row, ps.passenger.column);

        if (blocking.length > 0) {
            // Need to shuffle - seats blocking our access
            ps.state = PassengerState.SHUFFLING;
            ps.shuffleRemaining = blocking.length * 3; // 3 steps per person
            this._recordEvent(EventType.SHUFFLE_START, ps.passenger, {
                row: ps.aisleRow,
                blocking
            });
        } else {
            // Direct access to seat
            ps.state = PassengerState.SEATING;
        }
    }

    /**
     * Process shuffling passenger
     */
    _processShuffling(ps) {
        ps.shuffleRemaining--;
        ps.waitTime++;

        if (ps.shuffleRemaining <= 0) {
            this._recordEvent(EventType.SHUFFLE_END, ps.passenger, { row: ps.aisleRow });
            ps.state = PassengerState.SEATING;
        }
    }

    /**
     * Process seating passenger
     */
    _processSeating(ps) {
        // Remove from aisle and seat
        this.aircraft.removeFromAisle(ps.aisleRow);
        this.aircraft.seatPassenger(ps.passenger);
        ps.state = PassengerState.SEATED;
        ps.seatedAt = this.currentStep;
        this._recordEvent(EventType.SEAT, ps.passenger, {
            row: ps.passenger.row,
            column: ps.passenger.column
        });
    }

    /**
     * Try to add next passenger from queue
     */
    _tryAddFromQueue() {
        if (this.queue.length === 0) return;

        // Check if row 0 (entrance) is free
        if (this.aircraft.isAisleOccupied(0)) return;

        // Get next passenger from queue
        const ps = this.queue.shift();
        ps.state = PassengerState.WALKING;
        ps.aisleRow = 0;
        ps.enteredAt = this.currentStep;
        this.aircraft.placeInAisle(ps.passenger, 0);
        this._recordEvent(EventType.ENTER, ps.passenger, {});
    }

    /**
     * Check if simulation is complete
     */
    _checkCompletion() {
        for (const ps of this.passengerStates.values()) {
            if (ps.state !== PassengerState.SEATED) {
                return;
            }
        }
        this.isComplete = true;
    }

    /**
     * Record an event
     */
    _recordEvent(type, passenger, data) {
        this.events.push({
            step: this.currentStep,
            type,
            passengerId: passenger.id,
            passengerRow: passenger.row,
            passengerColumn: passenger.column,
            ...data,
        });
    }

    /**
     * Get current snapshot of simulation state
     * @returns {Object}
     */
    getSnapshot() {
        const passengersInAisle = [];
        const passengersSeated = [];
        const passengersWaiting = [];

        for (const ps of this.passengerStates.values()) {
            const entry = {
                id: ps.passenger.id,
                row: ps.passenger.row,
                column: ps.passenger.column,
                state: ps.state,
                aisleRow: ps.aisleRow,
                waitTime: ps.waitTime,
            };

            if (ps.state === PassengerState.SEATED) {
                passengersSeated.push(entry);
            } else if (ps.state === PassengerState.WAITING) {
                passengersWaiting.push(entry);
            } else {
                passengersInAisle.push(entry);
            }
        }

        return {
            step: this.currentStep,
            isComplete: this.isComplete,
            passengersInAisle,
            passengersSeated,
            passengersWaiting,
            queueLength: this.queue.length,
            seatedCount: passengersSeated.length,
            totalPassengers: this.passengerStates.size,
        };
    }

    /**
     * Get all events
     */
    getEvents() {
        return this.events;
    }

    /**
     * Get simulation metrics
     */
    getMetrics() {
        const totalTime = this.currentStep;

        // Calculate wait times
        let totalWaitTime = 0;
        let maxWaitTime = 0;
        let aisleBlockedSteps = 0;

        for (const ps of this.passengerStates.values()) {
            totalWaitTime += ps.waitTime;
            maxWaitTime = Math.max(maxWaitTime, ps.waitTime);
        }

        // Count aisle blocked events
        const blockedEvents = this.events.filter(e => e.type === EventType.AISLE_BLOCKED);
        aisleBlockedSteps = blockedEvents.length;

        const avgWaitTime = totalWaitTime / this.passengerStates.size;
        const aisleBlockedPercent = (aisleBlockedSteps / (totalTime * this.passengerStates.size)) * 100;

        return {
            totalTime,
            avgWaitTime: Math.round(avgWaitTime * 10) / 10,
            maxWaitTime,
            aisleBlockedPercent: Math.round(aisleBlockedPercent * 10) / 10,
            totalPassengers: this.passengerStates.size,
        };
    }
}
