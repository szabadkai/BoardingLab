/**
 * Base Renderer for shared coordinate logic
 */
export class BaseRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {import('../../engine/Aircraft').Aircraft} aircraft
     */
    constructor(canvas, aircraft) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.aircraft = aircraft;

        this.settings = {
            seatSize: 24,
            seatGap: 4,
            aisleWidth: 32,
            rowLabelWidth: 32,
            padding: 60, // Increased for wings
            colors: {
                background: '#0f0f16',
                seatEmpty: '#1e1e2d',
                seatOccupied: '#6366f1',
                aisle: '#0f0f16',
                aisleBlocked: 'rgba(248, 113, 113, 0.2)',
                passenger: '#818cf8',
                passengerWaiting: '#fbbf24',
                passengerStowing: '#fbbf24',
                passengerSeating: '#34d399',
                text: '#94a3b8',
                textLight: '#64748b',
                border: 'rgba(255, 255, 255, 0.1)',
                grid: 'rgba(255, 255, 255, 0.03)',
            }
        };

        this._calculateDimensions();
    }

    _calculateDimensions() {
        const { seatSize, seatGap, aisleWidth, rowLabelWidth, padding } = this.settings;
        const { rows, columns } = this.aircraft;

        const seatsWidth = columns.length * (seatSize + seatGap) - seatGap;
        const totalWidth = rowLabelWidth + seatsWidth + aisleWidth + padding * 2;
        const totalHeight = (rows + 2) * (seatSize + seatGap) + padding * 2;

        this.dims = {
            totalWidth,
            totalHeight,
            seatsStartX: padding + rowLabelWidth,
            seatsStartY: padding + (seatSize + seatGap) * 2,
            seatSize,
            seatGap,
            aisleWidth,
            aisleX: padding + rowLabelWidth + 3 * (seatSize + seatGap),
        };

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = totalWidth * dpr;
        this.canvas.height = totalHeight * dpr;
        this.canvas.style.width = `${totalWidth}px`;
        this.canvas.style.height = `${totalHeight}px`;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    getSeatPosition(row, column) {
        const { seatsStartX, seatsStartY, seatSize, seatGap, aisleWidth } = this.dims;
        const colIndex = column.charCodeAt(0) - 'A'.charCodeAt(0);
        let x = seatsStartX + colIndex * (seatSize + seatGap);
        if (colIndex >= 3) x += aisleWidth;
        const y = seatsStartY + (row - 1) * (seatSize + seatGap);
        return { x, y };
    }

    getAislePosition(row) {
        const { aisleX, seatsStartY, seatSize, seatGap, aisleWidth } = this.dims;
        const y = row === 0
            ? this.settings.padding + this.settings.seatSize / 2
            : seatsStartY + (row - 1) * (seatSize + seatGap) + seatSize / 2;
        return { x: aisleX + aisleWidth / 2, y };
    }

    handleResize() {
        this._calculateDimensions();
    }

    render(snapshot) {
        // To be implemented by subclasses
        // Clear logic is common
        this.ctx.fillStyle = this.settings.colors.background;
        this.ctx.fillRect(0, 0, this.dims.totalWidth, this.dims.totalHeight);
    }
}
