/**
 * Deterministic random number generator using a seeded approach.
 * Implements a simple Linear Congruential Generator (LCG).
 */
export class RandomGenerator {
    /**
     * @param {number} seed - Initial seed value
     */
    constructor(seed = 12345) {
        this.seed = seed;
        this.initialSeed = seed;
    }

    /**
     * Reset the generator to its initial seed
     */
    reset() {
        this.seed = this.initialSeed;
    }

    /**
     * Set a new seed value
     * @param {number} seed
     */
    setSeed(seed) {
        this.seed = seed;
        this.initialSeed = seed;
    }

    /**
     * Generate the next pseudo-random number between 0 and 1
     * @returns {number}
     */
    next() {
        // LCG parameters (same as MINSTD)
        const a = 48271;
        const m = 2147483647; // 2^31 - 1
        this.seed = (a * this.seed) % m;
        return this.seed / m;
    }

    /**
     * Generate a random integer between min (inclusive) and max (inclusive)
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Pick a random element from an array
     * @template T
     * @param {T[]} array
     * @returns {T}
     */
    pick(array) {
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * Shuffle an array in place (Fisher-Yates)
     * @template T
     * @param {T[]} array
     * @returns {T[]}
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Default singleton instance
export const defaultRng = new RandomGenerator();
