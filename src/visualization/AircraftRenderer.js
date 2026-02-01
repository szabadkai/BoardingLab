/**
 * Aircraft 2D top-down canvas renderer
 * Renders seats, aisle, passengers, and bottleneck highlights
 */

export class AircraftRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {import('../engine/Aircraft').Aircraft} aircraft
     */
    constructor(canvas, aircraft) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.aircraft = aircraft;

        // Visual settings
        this.settings = {
            seatSize: 24,
            seatGap: 4,
            aisleWidth: 32,
            rowLabelWidth: 32,
            padding: 20,

            // Colors (from CSS variables concept)
            // Colors (Matching new CSS Theme)
            colors: {
                background: '#0f0f16', // bg-secondary
                seatEmpty: '#1e1e2d',
                seatOccupied: '#6366f1', // accent
                aisle: '#0f0f16', // same as bg
                aisleBlocked: 'rgba(248, 113, 113, 0.2)', // error with opacity
                passenger: '#818cf8', // accent-light
                passengerWaiting: '#fbbf24', // warning
                passengerStowing: '#fbbf24',
                passengerSeating: '#34d399', // success
                text: '#94a3b8', // text-secondary
                textLight: '#64748b', // text-muted
                border: 'rgba(255, 255, 255, 0.1)',
                grid: 'rgba(255, 255, 255, 0.03)',
            },
        };

        // Animation state
        this.passengerPositions = new Map(); // id -> { x, y, targetX, targetY }

        this._calculateDimensions();
    }

    /**
     * Calculate canvas dimensions based on aircraft
     */
    _calculateDimensions() {
        const { seatSize, seatGap, aisleWidth, rowLabelWidth, padding } = this.settings;
        const { rows, columns } = this.aircraft;

        // Width: label + 3 seats + aisle + 3 seats + padding
        const seatsWidth = columns.length * (seatSize + seatGap) - seatGap;
        const totalWidth = rowLabelWidth + seatsWidth + aisleWidth + padding * 2;

        // Height: rows * (seatSize + gap) + entry area + padding
        const totalHeight = (rows + 2) * (seatSize + seatGap) + padding * 2;

        // Store for calculations
        this.dims = {
            totalWidth,
            totalHeight,
            seatsStartX: padding + rowLabelWidth,
            seatsStartY: padding + (seatSize + seatGap) * 2, // Leave room for entry
            seatSize,
            seatGap,
            aisleWidth,
            aisleX: padding + rowLabelWidth + 3 * (seatSize + seatGap),
        };

        // Set canvas size with DPR handling
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = totalWidth * dpr;
        this.canvas.height = totalHeight * dpr;
        this.canvas.style.width = `${totalWidth}px`;
        this.canvas.style.height = `${totalHeight}px`;

        // Reset transform and apply DPR scaling
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    /**
     * Get screen position for a seat
     */
    getSeatPosition(row, column) {
        const { seatsStartX, seatsStartY, seatSize, seatGap, aisleWidth } = this.dims;
        const colIndex = column.charCodeAt(0) - 'A'.charCodeAt(0);

        let x = seatsStartX + colIndex * (seatSize + seatGap);
        // Add aisle gap after column C
        if (colIndex >= 3) {
            x += aisleWidth;
        }

        const y = seatsStartY + (row - 1) * (seatSize + seatGap);

        return { x, y };
    }

    /**
     * Get screen position for aisle at row
     */
    getAislePosition(row) {
        const { aisleX, seatsStartY, seatSize, seatGap, aisleWidth } = this.dims;

        // Row 0 is entry
        const y = row === 0
            ? this.settings.padding + this.settings.seatSize / 2
            : seatsStartY + (row - 1) * (seatSize + seatGap) + seatSize / 2;

        return {
            x: aisleX + aisleWidth / 2,
            y,
        };
    }

    /**
     * Render the full aircraft
     * @param {Object} snapshot - Simulation snapshot
     */
    render(snapshot = null) {
        const { ctx, dims, settings } = this;
        const { totalWidth, totalHeight } = dims;

        // Debug log
        if (snapshot && snapshot.step > 0 && snapshot.step % 50 === 0) {
            console.log('Render snapshot:', {
                step: snapshot.step,
                inAisle: snapshot.passengersInAisle?.length,
                seated: snapshot.passengersSeated?.length,
                waiting: snapshot.passengersWaiting?.length,
            });
        }

        // Clear
        ctx.fillStyle = settings.colors.background;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Draw Technical Grid
        this._drawGrid();

        // Draw Layers

        // Draw aisle background
        this._drawAisle(snapshot);

        // Draw seats
        this._drawSeats(snapshot);

        // Draw row labels
        this._drawRowLabels();

        // Draw column labels
        this._drawColumnLabels();

        // Draw passengers in aisle
        if (snapshot) {
            this._drawPassengersInAisle(snapshot);
        }

        // Draw entry area
        this._drawEntryArea(snapshot);
    }

    /**
     * Draw subtle background grid
     */
    _drawGrid() {
        const { ctx, dims, settings } = this;
        const gridSize = 32;

        ctx.strokeStyle = settings.colors.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Vertical lines
        for (let x = 0; x <= dims.totalWidth; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, dims.totalHeight);
        }

        // Horizontal lines
        for (let y = 0; y <= dims.totalHeight; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(dims.totalWidth, y);
        }

        ctx.stroke();
    }

    /**
     * Draw the aisle
     */
    _drawAisle(snapshot) {
        const { ctx, dims, settings, aircraft } = this;
        const { aisleX, seatsStartY, seatSize, seatGap, aisleWidth } = dims;

        // Draw aisle background
        ctx.fillStyle = settings.colors.aisle;
        ctx.fillRect(
            aisleX,
            settings.padding,
            aisleWidth,
            dims.totalHeight - settings.padding * 2
        );

        // Highlight blocked aisle sections if snapshot available
        if (snapshot && snapshot.passengersInAisle) {
            for (const p of snapshot.passengersInAisle) {
                if (p.state === 'stowing' || p.state === 'shuffling') {
                    const pos = this.getAislePosition(p.aisleRow);
                    ctx.fillStyle = settings.colors.aisleBlocked;
                    ctx.fillRect(
                        aisleX,
                        pos.y - seatSize / 2 - seatGap / 2,
                        aisleWidth,
                        seatSize + seatGap
                    );
                }
            }
        }
    }

    /**
     * Draw all seats
     */
    _drawSeats(snapshot) {
        const { ctx, dims, settings, aircraft } = this;
        const { seatSize } = dims;

        // Create set of occupied seats from snapshot
        const occupiedSeats = new Set();
        if (snapshot && snapshot.passengersSeated) {
            for (const p of snapshot.passengersSeated) {
                occupiedSeats.add(`${p.row}-${p.column}`);
            }
        }

        for (let row = 1; row <= aircraft.rows; row++) {
            for (const column of aircraft.columns) {
                const { x, y } = this.getSeatPosition(row, column);
                const key = `${row}-${column}`;
                const isOccupied = occupiedSeats.has(key);

                // Seat background
                ctx.fillStyle = isOccupied
                    ? settings.colors.seatOccupied
                    : settings.colors.seatEmpty;
                ctx.beginPath();
                ctx.roundRect(x, y, seatSize, seatSize, 4);
                ctx.fill();

                // Seat border
                ctx.strokeStyle = settings.colors.border;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Column letter for occupied seats
                if (isOccupied) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(column, x + seatSize / 2, y + seatSize / 2);
                }
            }
        }
    }

    /**
     * Draw row labels
     */
    _drawRowLabels() {
        const { ctx, dims, settings, aircraft } = this;
        const { seatsStartY, seatSize, seatGap } = dims;

        ctx.fillStyle = settings.colors.textLight;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let row = 1; row <= aircraft.rows; row++) {
            const y = seatsStartY + (row - 1) * (seatSize + seatGap) + seatSize / 2;
            ctx.fillText(String(row), settings.padding + dims.rowLabelWidth - 8, y);
        }
    }

    /**
     * Draw column labels
     */
    _drawColumnLabels() {
        const { ctx, dims, settings, aircraft } = this;
        const { seatsStartX, seatSize, seatGap, aisleWidth } = dims;

        ctx.fillStyle = settings.colors.text;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const y = settings.padding + seatSize;

        for (let i = 0; i < aircraft.columns.length; i++) {
            const column = aircraft.columns[i];
            let x = seatsStartX + i * (seatSize + seatGap) + seatSize / 2;
            if (i >= 3) x += aisleWidth;
            ctx.fillText(column, x, y);
        }
    }

    /**
     * Draw passengers in aisle
     */
    _drawPassengersInAisle(snapshot) {
        const { ctx, dims, settings } = this;
        const { seatSize } = dims;
        const radius = seatSize / 2 - 2;

        for (const p of snapshot.passengersInAisle) {
            const pos = this.getAislePosition(p.aisleRow);

            // Choose color based on state
            let color = settings.colors.passenger;
            if (p.state === 'stowing' || p.state === 'shuffling') {
                color = settings.colors.passengerWaiting;
            } else if (p.state === 'seating') {
                color = settings.colors.passengerSeating;
            }

            // Draw passenger circle with shadow/glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Remove shadow for text/border
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw passenger ID
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(p.id), pos.x, pos.y);
        }
    }

    /**
     * Draw entry area
     */
    _drawEntryArea(snapshot) {
        const { ctx, dims, settings } = this;
        const { aisleX, aisleWidth, seatSize } = dims;
        const y = settings.padding;

        // Entry label
        ctx.fillStyle = settings.colors.textLight;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ENTRY', aisleX + aisleWidth / 2, y);

        // Queue count
        if (snapshot && snapshot.passengersWaiting) {
            const queueCount = snapshot.passengersWaiting.length;
            if (queueCount > 0) {
                ctx.fillStyle = settings.colors.passengerWaiting;
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillText(`Queue: ${queueCount}`, aisleX + aisleWidth / 2, y + 14);
            }
        }
    }

    /**
     * Resize handler
     */
    handleResize() {
        this._calculateDimensions();
    }
}
