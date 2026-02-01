/**
 * Algorithm execution contract enforcement and runner.
 * Validates and executes boarding priority algorithms.
 */

/**
 * Algorithm validation result
 */
export class ValidationResult {
    constructor(isValid, errors = [], warnings = []) {
        this.isValid = isValid;
        this.errors = errors;
        this.warnings = warnings;
    }

    static success(warnings = []) {
        return new ValidationResult(true, [], warnings);
    }

    static failure(errors, warnings = []) {
        return new ValidationResult(false, errors, warnings);
    }
}

/**
 * Algorithm context passed to priority functions
 */
export function createAlgorithmContext(config) {
    return Object.freeze({
        totalRows: config.totalRows,
        totalPassengers: config.totalPassengers,
        columns: Object.freeze([...config.columns]),
    });
}

/**
 * Validate an algorithm priority function
 * @param {Function} priorityFn - The priority function to validate
 * @param {Object[]} testPassengers - Sample passengers to test with
 * @param {Object} context - Algorithm context
 * @returns {ValidationResult}
 */
export function validateAlgorithm(priorityFn, testPassengers, context) {
    const errors = [];
    const warnings = [];

    // Check if it's a function
    if (typeof priorityFn !== 'function') {
        return ValidationResult.failure(['Priority must be a function']);
    }

    // Test with sample passengers
    const results = [];
    const startTime = performance.now();

    for (const passenger of testPassengers) {
        try {
            const result = priorityFn(passenger, context);

            // Check return type
            if (typeof result !== 'number') {
                errors.push(`Priority function returned ${typeof result}, expected number`);
                break;
            }

            // Check for NaN or Infinity
            if (Number.isNaN(result)) {
                errors.push('Priority function returned NaN');
                break;
            }

            if (!Number.isFinite(result)) {
                errors.push('Priority function returned Infinity');
                break;
            }

            results.push(result);
        } catch (e) {
            errors.push(`Execution error: ${e.message}`);
            break;
        }

        // Time limit check (100ms total)
        if (performance.now() - startTime > 100) {
            errors.push('Execution time exceeded limit');
            break;
        }
    }

    // Check determinism by running twice
    if (errors.length === 0) {
        for (let i = 0; i < Math.min(5, testPassengers.length); i++) {
            const passenger = testPassengers[i];
            const result1 = priorityFn(passenger, context);
            const result2 = priorityFn(passenger, context);
            if (result1 !== result2) {
                errors.push('Priority function is not deterministic');
                break;
            }
        }
    }

    if (errors.length > 0) {
        return ValidationResult.failure(errors, warnings);
    }

    return ValidationResult.success(warnings);
}

/**
 * Run an algorithm to get sorted boarding order
 * @param {Function} priorityFn - Priority function
 * @param {import('../engine/Passenger').Passenger[]} passengers - Passengers to sort
 * @param {Object} context - Algorithm context
 * @returns {number[]} Passenger IDs in boarding order (highest priority first)
 */
export function runAlgorithm(priorityFn, passengers, context) {
    // Calculate priorities
    const withPriority = passengers.map(passenger => ({
        id: passenger.id,
        priority: priorityFn(passenger.toContext(), context),
    }));

    // Sort by priority (descending - higher priority boards first)
    withPriority.sort((a, b) => b.priority - a.priority);

    return withPriority.map(p => p.id);
}

/**
 * Create a sandboxed execute from code string
 * @param {string} code - Code string defining a priority function
 * @returns {{ fn: Function|null, error: string|null }}
 */
export function compileAlgorithm(code) {
    // Forbidden patterns
    const forbidden = [
        /\beval\b/,
        /\bFunction\b/,
        /\bimport\b/,
        /\brequire\b/,
        /\bfetch\b/,
        /\bXMLHttpRequest\b/,
        /\bwindow\b/,
        /\bdocument\b/,
        /\bglobalThis\b/,
        /\bsetTimeout\b/,
        /\bsetInterval\b/,
        /\bPromise\b/,
        /\basync\b/,
        /\bawait\b/,
        /\bwhile\s*\(/,
        /\bfor\s*\(/,
        /\bdo\s*\{/,
    ];

    for (const pattern of forbidden) {
        if (pattern.test(code)) {
            return {
                fn: null,
                error: `Forbidden pattern detected: ${pattern.source}`
            };
        }
    }

    try {
        // Wrap in function that returns the priority function
        const wrappedCode = `
      "use strict";
      return (function(passenger, context) {
        ${code}
      });
    `;

        // Create function in sandbox
        const factory = new Function(wrappedCode);
        const fn = factory();

        return { fn, error: null };
    } catch (e) {
        return { fn: null, error: `Compilation error: ${e.message}` };
    }
}

/**
 * Base algorithm interface
 */
export class Algorithm {
    constructor({ name, description, code, editable = true }) {
        this.name = name;
        this.description = description;
        this.code = code;
        this.editable = editable;
        this._compiledFn = null;
    }

    /**
     * Compile the algorithm
     */
    compile() {
        const { fn, error } = compileAlgorithm(this.code);
        if (error) {
            throw new Error(error);
        }
        this._compiledFn = fn;
        return this;
    }

    /**
     * Get the priority function
     */
    getPriorityFn() {
        if (!this._compiledFn) {
            this.compile();
        }
        return this._compiledFn;
    }

    /**
     * Run the algorithm on passengers
     */
    run(passengers, context) {
        return runAlgorithm(this.getPriorityFn(), passengers, context);
    }

    /**
     * Validate the algorithm
     */
    validate(testPassengers, context) {
        try {
            const fn = this.getPriorityFn();
            return validateAlgorithm(fn, testPassengers, context);
        } catch (e) {
            return ValidationResult.failure([e.message]);
        }
    }
}
