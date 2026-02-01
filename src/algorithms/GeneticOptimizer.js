import { Simulation } from '../engine/Simulation.js';
import { generatePassengers } from '../engine/Passenger.js';
import { RandomGenerator } from '../engine/RandomGenerator.js';

/**
 * Genetic Algorithm to optimize ANY algorithm's numeric parameters
 */
export class GeneticOptimizer {
    /**
     * @param {import('../engine/Aircraft').Aircraft} aircraft
     * @param {Object} algorithm - The algorithm definition object
     */
    constructor(aircraft, algorithm) {
        this.aircraft = aircraft;
        this.algorithm = algorithm;
        this.populationSize = 50;
        this.generations = 20;
        this.mutationRate = 0.1;
        this.elitismCount = 5;

        // Extract optimizable parameters (numeric ones)
        this.paramConfig = {};
        if (algorithm.parameters) {
            for (const [key, config] of Object.entries(algorithm.parameters)) {
                if (config.type === 'number') {
                    this.paramConfig[key] = {
                        min: config.min ?? -100,
                        max: config.max ?? 100,
                        default: config.default ?? 0
                    };
                }
            }
        }
    }

    /**
     * Run optimization
     * @param {function(number, Object)} onProgress - Callback (percent, bestIndividual)
     */
    async optimize(onProgress) {
        // Validation
        if (Object.keys(this.paramConfig).length === 0) {
            throw new Error('No optimizable numeric parameters found for this algorithm.');
        }

        // 1. Initialize Population
        let population = this._initializePopulation();
        let bestSolution = null;

        // Pre-generate passengers
        const testScenarios = [];
        for (let i = 0; i < 3; i++) {
            const rng = new RandomGenerator(12345 + i);
            testScenarios.push(generatePassengers({
                count: 114,
                rows: this.aircraft.rows,
                columns: this.aircraft.columns,
                rng: rng
            }));
        }

        // 2. Evolution Loop
        for (let gen = 0; gen < this.generations; gen++) {
            // Evaluate Fitness
            const evaluatedPop = [];

            for (const individual of population) {
                const fitness = this._evaluateFitness(individual, testScenarios);
                evaluatedPop.push({ weights: individual, fitness });
            }

            // Sort by fitness (lower time is better)
            evaluatedPop.sort((a, b) => a.fitness - b.fitness);

            // Update Best
            if (!bestSolution || evaluatedPop[0].fitness < bestSolution.fitness) {
                bestSolution = evaluatedPop[0];
            }

            // Report Progress
            if (onProgress) {
                const percent = Math.round(((gen + 1) / this.generations) * 100);
                onProgress(percent, bestSolution);
                // Yield to main thread
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Selection & Reproduction
            population = this._evolveNextGeneration(evaluatedPop);
        }

        return bestSolution.weights;
    }

    _initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const individual = {};
            for (const [key, config] of Object.entries(this.paramConfig)) {
                individual[key] = this._randomValue(config);
            }
            population.push(individual);
        }
        return population;
    }

    _randomValue(config) {
        return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    }

    _evaluateFitness(weights, testScenarios) {
        let totalTime = 0;

        // Create priority function with dynamic weights
        const priorityFn = this.algorithm.createPriorityFn(weights);

        for (const passengers of testScenarios) {
            // Calculate priorities
            const info = passengers.map(p => ({
                id: p.id,
                priority: priorityFn(p, {})
            }));

            // Sort
            info.sort((a, b) => b.priority - a.priority);
            const orderedIds = info.map(x => x.id);

            // Run Simulation
            const sim = new Simulation({
                passengers: passengers,
                aircraft: this.aircraft
            });

            sim.setBoardingOrder(orderedIds);
            const steps = sim.runToCompletion(5000);
            totalTime += steps;
        }

        return totalTime / testScenarios.length;
    }

    _evolveNextGeneration(evaluatedPop) {
        const nextGen = [];

        // 1. Elitism
        for (let i = 0; i < this.elitismCount; i++) {
            nextGen.push({ ...evaluatedPop[i].weights });
        }

        // 2. Crossover & Mutation
        while (nextGen.length < this.populationSize) {
            const parentA = this._tournamentSelect(evaluatedPop);
            const parentB = this._tournamentSelect(evaluatedPop);

            let child = this._crossover(parentA.weights, parentB.weights);

            if (Math.random() < this.mutationRate) {
                child = this._mutate(child);
            }

            nextGen.push(child);
        }

        return nextGen;
    }

    _tournamentSelect(evaluatedPop) {
        const k = 3;
        let best = null;
        for (let i = 0; i < k; i++) {
            const ind = evaluatedPop[Math.floor(Math.random() * evaluatedPop.length)];
            if (!best || ind.fitness < best.fitness) {
                best = ind;
            }
        }
        return best;
    }

    _crossover(pA, pB) {
        const child = {};
        for (const key of Object.keys(this.paramConfig)) {
            child[key] = Math.random() < 0.5 ? pA[key] : pB[key];
        }
        return child;
    }

    _mutate(individual) {
        const keys = Object.keys(this.paramConfig);
        const gene = keys[Math.floor(Math.random() * keys.length)];
        const config = this.paramConfig[gene];

        // Mutate
        const range = config.max - config.min;
        const delta = (Math.random() * (range * 0.2)) - (range * 0.1); // +/- 10% of range

        individual[gene] += delta;
        individual[gene] = Math.max(config.min, Math.min(config.max, Math.round(individual[gene])));

        return individual;
    }
}
