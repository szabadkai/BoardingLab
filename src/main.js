/**
 * Boarding Lab - Main Application
 * Plane Boarding & Unboarding Simulator
 */

import { RandomGenerator } from './engine/RandomGenerator.js';
import { Aircraft } from './engine/Aircraft.js';
import { generatePassengers } from './engine/Passenger.js';
import { Simulation } from './engine/Simulation.js';
import { AircraftRenderer } from './visualization/AircraftRenderer.js';
import { Timeline } from './visualization/Timeline.js';
import { algorithmList } from './algorithms/presets/index.js';
import { createAlgorithmContext } from './algorithms/AlgorithmRunner.js';
import { calculateMetrics, formatTime, formatMetricDiff } from './metrics/MetricsCalculator.js';
import { analyzeDelayCauses, generateSummaryExplanation } from './metrics/ExplanationEngine.js';

class BoardingLab {
    constructor() {
        // State
        this.aircraft = new Aircraft();
        this.rng = new RandomGenerator();
        this.passengers = [];
        this.simulation = null;
        this.renderer = null;
        this.timeline = null;
        this.selectedAlgorithm = algorithmList[0];
        this.snapshots = [];

        // DOM elements
        this.elements = {};

        // Initialize
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.renderAlgorithmList();
        this.initRenderer();
        this.initTimeline();

        // Initial render
        this.renderer.render(null);
    }

    cacheElements() {
        this.elements = {
            algorithmSelector: document.getElementById('algorithm-selector'),
            algorithmDescription: document.getElementById('algorithm-description'),
            parameters: document.getElementById('parameters'),
            passengerCount: document.getElementById('passenger-count'),
            passengerCountValue: document.getElementById('passenger-count-value'),
            seed: document.getElementById('seed'),
            runBtn: document.getElementById('run-btn'),

            canvas: document.getElementById('aircraft-canvas'),

            playPauseBtn: document.getElementById('play-pause-btn'),
            stepBackBtn: document.getElementById('step-back-btn'),
            stepForwardBtn: document.getElementById('step-forward-btn'),
            timelineSlider: document.getElementById('timeline'),
            timeDisplay: document.getElementById('time-display'),
            speedSelect: document.getElementById('speed'),

            metricTotalTime: document.getElementById('metric-total-time'),
            metricAisleBlocked: document.getElementById('metric-aisle-blocked'),
            metricAvgWait: document.getElementById('metric-avg-wait'),
            metricWorstDelay: document.getElementById('metric-worst-delay'),
            explanationText: document.getElementById('explanation-text'),

            advancedToggle: document.getElementById('advanced-toggle'),
            codeEditorModal: document.getElementById('code-editor-modal'),
            codeTextarea: document.getElementById('code-textarea'),
            modalClose: document.getElementById('modal-close'),
            editorCancel: document.getElementById('editor-cancel'),
            editorApply: document.getElementById('editor-apply'),
            validationMessages: document.getElementById('validation-messages'),
        };
    }

    setupEventListeners() {
        // Passenger count slider
        this.elements.passengerCount.addEventListener('input', (e) => {
            this.elements.passengerCountValue.textContent = e.target.value;
        });

        // Run button
        this.elements.runBtn.addEventListener('click', () => this.runSimulation());

        // Timeline controls
        this.elements.playPauseBtn.addEventListener('click', () => this.timeline.toggle());
        this.elements.stepBackBtn.addEventListener('click', () => this.timeline.stepBackward());
        this.elements.stepForwardBtn.addEventListener('click', () => this.timeline.stepForward());

        this.elements.timelineSlider.addEventListener('input', (e) => {
            const step = Math.round((e.target.value / 100) * this.timeline.totalSteps);
            this.timeline.goToStep(step);
        });

        this.elements.speedSelect.addEventListener('change', (e) => {
            this.timeline.setSpeed(parseFloat(e.target.value));
        });

        // Advanced mode
        this.elements.advancedToggle.addEventListener('click', () => this.openCodeEditor());
        this.elements.modalClose.addEventListener('click', () => this.closeCodeEditor());
        this.elements.editorCancel.addEventListener('click', () => this.closeCodeEditor());
        this.elements.editorApply.addEventListener('click', () => this.applyCustomCode());

        // Close modal on backdrop click
        this.elements.codeEditorModal.querySelector('.modal-backdrop')
            .addEventListener('click', () => this.closeCodeEditor());

        // Window resize
        window.addEventListener('resize', () => {
            if (this.renderer) {
                this.renderer.handleResize();
                this.renderer.render(this.timeline?.getCurrentSnapshot());
            }
        });
    }

    renderAlgorithmList() {
        const container = this.elements.algorithmSelector;
        container.innerHTML = '';

        algorithmList.forEach((algo, index) => {
            const btn = document.createElement('button');
            btn.className = `algorithm-btn${index === 0 ? ' active' : ''}`;
            btn.innerHTML = `
        <span class="algo-name">${algo.name}</span>
        <span class="edit-icon">✏️</span>
      `;
            btn.title = algo.description;

            btn.addEventListener('click', (e) => {
                // If clicking edit icon, open editor
                if (e.target.classList.contains('edit-icon')) {
                    this.selectedAlgorithm = algo;
                    this.openCodeEditor();
                    return;
                }

                // Select algorithm
                container.querySelectorAll('.algorithm-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedAlgorithm = algo;
                this.updateAlgorithmDescription();
                this.renderParameters();
            });

            container.appendChild(btn);
        });

        this.updateAlgorithmDescription();
        this.renderParameters();
    }

    updateAlgorithmDescription() {
        this.elements.algorithmDescription.textContent = this.selectedAlgorithm.description;
    }

    renderParameters() {
        const container = this.elements.parameters;
        container.innerHTML = '';

        const params = this.selectedAlgorithm.parameters;
        if (!params) {
            container.innerHTML = '<p class="text-muted">No configurable parameters</p>';
            return;
        }

        for (const [key, config] of Object.entries(params)) {
            const group = document.createElement('div');
            group.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = config.label;
            label.htmlFor = `param-${key}`;

            const input = document.createElement('input');
            input.type = 'number';
            input.id = `param-${key}`;
            input.value = config.default;
            input.min = config.min;
            input.max = config.max;
            input.dataset.param = key;

            group.appendChild(label);
            group.appendChild(input);
            container.appendChild(group);
        }
    }

    initRenderer() {
        this.renderer = new AircraftRenderer(this.elements.canvas, this.aircraft);
    }

    initTimeline() {
        this.timeline = new Timeline({
            onStepChange: (step, snapshot) => {
                this.renderer.render(snapshot);
                this.elements.timelineSlider.value = this.timeline.getProgress();
                this.elements.timeDisplay.textContent = this.timeline.getTimeDisplay();
            },
            onPlayStateChange: (isPlaying) => {
                const icon = this.elements.playPauseBtn.querySelector('.icon');
                icon.textContent = isPlaying ? '⏸' : '▶';
            },
        });
    }

    getAlgorithmParams() {
        const params = {};
        const inputs = this.elements.parameters.querySelectorAll('input[data-param]');
        inputs.forEach(input => {
            params[input.dataset.param] = parseFloat(input.value);
        });
        return params;
    }

    runSimulation() {
        // Update button state
        this.elements.runBtn.disabled = true;
        this.elements.runBtn.innerHTML = '<span class="icon animate-pulse">⏳</span> Running...';

        // Use setTimeout to allow UI update
        setTimeout(() => {
            try {
                this._executeSimulation();
            } catch (error) {
                console.error('Simulation error:', error);
                this.elements.explanationText.textContent = `Error: ${error.message}`;
            } finally {
                this.elements.runBtn.disabled = false;
                this.elements.runBtn.innerHTML = '<span class="icon">▶</span> Run Simulation';
            }
        }, 50);
    }

    _executeSimulation() {
        // Get settings
        const passengerCount = parseInt(this.elements.passengerCount.value);
        const seed = parseInt(this.elements.seed.value);

        // 1. Run Baseline (if modified)
        let baselineMetrics = null;
        if (this.selectedAlgorithm.isModified && this.selectedAlgorithm.baseAlgorithm) {
            console.log('Running baseline for comparison...');
            this.rng.setSeed(seed); // Same seed

            // Create passengers for baseline
            const baselinePassengers = generatePassengers({
                count: passengerCount,
                rows: new Aircraft().rows, // Default rows
                columns: new Aircraft().columns,
                rng: this.rng,
            });
            const baselineAircraft = new Aircraft(); // New aircraft instance

            // Setup baseline simulation
            const baselineSim = new Simulation({
                passengers: baselinePassengers,
                aircraft: baselineAircraft
            });

            // Get baseline priority function
            const params = this.getAlgorithmParams();
            // Use createPriorityFn from base algorithm
            const baseAlgo = this.selectedAlgorithm.baseAlgorithm;
            let basePriorityFn;

            if (baseAlgo.createPriorityFn) {
                // Determine if base algo needs params or not (checking if it matches pattern)
                // But safer to just pass parameters as is
                basePriorityFn = baseAlgo.createPriorityFn(params, this.rng);
            } else {
                // Fallback compilation
                const fn = new Function('passenger', 'context', baseAlgo.code);
                basePriorityFn = () => fn;
            }

            // Execute baseline
            const context = {
                totalRows: baselineAircraft.rows,
                totalPassengers: baselinePassengers.length,
                columns: baselineAircraft.columns
            };

            const passengerContexts = baselinePassengers.map(p => ({
                id: p.id,
                priority: basePriorityFn(p.toContext(), context)
            }));
            passengerContexts.sort((a, b) => b.priority - a.priority);

            baselineSim.setBoardingOrder(passengerContexts.map(p => p.id));
            baselineSim.runToCompletion();
            // We get raw metrics here, formatted ones come from MetricsCalculator
            baselineMetrics = baselineSim.getMetrics();
        }

        // 2. Run Main Simulation
        // Reset RNG with seed
        this.rng.setSeed(seed);

        // Reset aircraft
        this.aircraft.reset();

        // Generate passengers
        this.passengers = generatePassengers({
            count: passengerCount,
            rows: this.aircraft.rows,
            columns: this.aircraft.columns,
            rng: this.rng,
        });

        // Create simulation
        this.simulation = new Simulation({
            passengers: this.passengers,
            aircraft: this.aircraft,
        });

        // Create algorithm context
        const context = createAlgorithmContext({
            totalRows: this.aircraft.rows,
            totalPassengers: this.passengers.length,
            columns: this.aircraft.columns,
        });

        // Get priority function with params
        const params = this.getAlgorithmParams();

        let priorityFn;
        if (this.selectedAlgorithm.isModified) {
            // For modified, we already generated the function
            priorityFn = this.selectedAlgorithm.createPriorityFn(params, this.rng);
        } else {
            const algo = this.selectedAlgorithm;
            priorityFn = algo.createPriorityFn
                ? algo.createPriorityFn(params, this.rng)
                : this._compilePriorityFn();
        }

        // Sort passengers by priority
        const passengerContexts = this.passengers.map(p => ({
            id: p.id,
            priority: priorityFn(p.toContext(), context)
        }));
        passengerContexts.sort((a, b) => b.priority - a.priority);
        const boardingOrder = passengerContexts.map(p => p.id);

        // Set boarding order
        this.simulation.setBoardingOrder(boardingOrder);

        // Record snapshots
        this.snapshots = [];
        this.snapshots.push(this.simulation.getSnapshot());

        // Run simulation step by step
        while (this.simulation.step()) {
            this.snapshots.push(this.simulation.getSnapshot());
        }
        this.snapshots.push(this.simulation.getSnapshot()); // Final state

        console.log('Simulation complete:', {
            totalSnapshots: this.snapshots.length,
            firstSnapshot: this.snapshots[0],
            lastSnapshot: this.snapshots[this.snapshots.length - 1],
        });

        // Load into timeline
        this.timeline.loadSnapshots(this.snapshots);

        // Calculate and display metrics
        this._updateMetrics(baselineMetrics);

        // Auto-play the simulation
        this.timeline.play();
    }

    _compilePriorityFn() {
        // Fallback: use the code string
        const code = this.selectedAlgorithm.code;
        const fn = new Function('passenger', 'context', code);
        return fn;
    }

    _updateMetrics(baselineMetrics = null) {
        const metrics = calculateMetrics(this.simulation);

        // Update DOM with Diff
        const updates = [
            ['totalTime', this.elements.metricTotalTime],
            ['aisleBlockedPercent', this.elements.metricAisleBlocked],
            ['avgWaitTime', this.elements.metricAvgWait],
            ['maxWaitTime', this.elements.metricWorstDelay]
        ];

        updates.forEach(([key, element]) => {
            let valueStr = '';
            // Get formatted string
            if (key === 'totalTime') valueStr = metrics.totalTimeFormatted;
            else if (key === 'aisleBlockedPercent') valueStr = `${metrics.aisleBlockedPercent}%`;
            else valueStr = `${metrics[key]} sec`;

            // Add diff if baseline exists
            if (baselineMetrics) {
                // baselineMetrics is raw from simulation.getMetrics()
                // metrics is from calculateMetrics() which has raw values too
                const diffHtml = formatMetricDiff(key, metrics[key], baselineMetrics[key]);
                element.innerHTML = `${valueStr} ${diffHtml}`;
            } else {
                element.textContent = valueStr;
            }
        });

        // Generate explanation
        const causes = analyzeDelayCauses(
            this.simulation.getEvents(),
            metrics
        );
        const explanation = generateSummaryExplanation(causes, this.selectedAlgorithm.name);
        this.elements.explanationText.textContent = explanation;
    }

    openCodeEditor() {
        this.elements.codeTextarea.value = this.selectedAlgorithm.code;
        this.elements.validationMessages.innerHTML = '';
        this.elements.codeEditorModal.hidden = false;
    }

    closeCodeEditor() {
        this.elements.codeEditorModal.hidden = true;
    }

    applyCustomCode() {
        const code = this.elements.codeTextarea.value;

        // Try to compile and validate
        try {
            const fn = new Function('passenger', 'context', code);

            // Test with a sample passenger
            const testResult = fn({
                id: 1, row: 15, column: 'C', seatClass: 'aisle',
                walkSpeed: 'normal', carryOnSize: 'small', compliance: 'normal',
                groupId: null, seatsToPass: 0
            }, { totalRows: 30, totalPassengers: 150, columns: ['A', 'B', 'C', 'D', 'E', 'F'] });

            if (typeof testResult !== 'number' || !Number.isFinite(testResult)) {
                throw new Error('Priority function must return a finite number');
            }

            // Valid - update algorithm
            this.selectedAlgorithm = {
                ...this.selectedAlgorithm,
                name: this.selectedAlgorithm.name.includes('(Modified)')
                    ? this.selectedAlgorithm.name
                    : this.selectedAlgorithm.name + ' (Modified)',
                code: code,
                createPriorityFn: () => fn,
                isModified: true,
                baseAlgorithm: this.selectedAlgorithm.baseAlgorithm || this.selectedAlgorithm
            };

            this.elements.validationMessages.innerHTML =
                '<div class="validation-success">✓ Valid algorithm</div>';

            setTimeout(() => {
                this.closeCodeEditor();
                this.runSimulation();
            }, 500);

        } catch (error) {
            this.elements.validationMessages.innerHTML =
                `<div class="validation-error">✕ ${error.message}</div>`;
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BoardingLab();
});
