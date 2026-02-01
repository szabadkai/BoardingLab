/**
 * Timeline controls for simulation playback
 */

export class Timeline {
    constructor(options = {}) {
        this.totalSteps = 0;
        this.currentStep = 0;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.snapshots = [];

        // Callbacks
        this.onStepChange = options.onStepChange || (() => { });
        this.onPlayStateChange = options.onPlayStateChange || (() => { });

        // Animation frame ID
        this.animationId = null;
        this.lastFrameTime = 0;
        this.msPerStep = 50; // Base: 50ms per step at 1x speed
    }

    /**
     * Load simulation snapshots for playback
     * @param {Object[]} snapshots - Array of simulation snapshots
     */
    loadSnapshots(snapshots) {
        this.snapshots = snapshots;
        this.totalSteps = snapshots.length - 1;
        this.currentStep = 0;
        this.isPlaying = false;
        this.onStepChange(this.currentStep, this.snapshots[0]);
    }

    /**
     * Get current snapshot
     */
    getCurrentSnapshot() {
        return this.snapshots[this.currentStep] || null;
    }

    /**
     * Set playback speed
     * @param {number} speed - Speed multiplier (0.5, 1, 2, 4)
     */
    setSpeed(speed) {
        this.playbackSpeed = speed;
    }

    /**
     * Go to specific step
     * @param {number} step
     */
    goToStep(step) {
        this.currentStep = Math.max(0, Math.min(step, this.totalSteps));
        this.onStepChange(this.currentStep, this.snapshots[this.currentStep]);
    }

    /**
     * Step forward
     */
    stepForward() {
        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        }
    }

    /**
     * Step backward
     */
    stepBackward() {
        if (this.currentStep > 0) {
            this.goToStep(this.currentStep - 1);
        }
    }

    /**
     * Start playback
     */
    play() {
        if (this.isPlaying) return;
        if (this.currentStep >= this.totalSteps) {
            this.currentStep = 0;
        }

        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.onPlayStateChange(true);
        this._animate();
    }

    /**
     * Pause playback
     */
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.onPlayStateChange(false);
    }

    /**
     * Toggle play/pause
     */
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Animation loop
     */
    _animate() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        const targetMs = this.msPerStep / this.playbackSpeed;

        if (elapsed >= targetMs) {
            this.lastFrameTime = now;

            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.onStepChange(this.currentStep, this.snapshots[this.currentStep]);
            } else {
                this.pause();
                return;
            }
        }

        this.animationId = requestAnimationFrame(() => this._animate());
    }

    /**
     * Get progress as percentage
     */
    getProgress() {
        if (this.totalSteps === 0) return 0;
        return (this.currentStep / this.totalSteps) * 100;
    }

    /**
     * Format current time display
     */
    getTimeDisplay() {
        const currentSec = Math.floor(this.currentStep / 20); // Assuming ~20 steps per second
        const totalSec = Math.floor(this.totalSteps / 20);

        const formatTime = (sec) => {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m}:${String(s).padStart(2, '0')}`;
        };

        return `${formatTime(currentSec)} / ${formatTime(totalSec)}`;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.pause();
        this.snapshots = [];
    }
}
