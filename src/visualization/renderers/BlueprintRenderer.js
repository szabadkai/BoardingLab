import { BaseRenderer } from './BaseRenderer.js';

/**
 * Blueprint Style Renderer
 * Technical, dark mode, neon accents
 */
export class BlueprintRenderer extends BaseRenderer {
    constructor(canvas, aircraft) {
        super(canvas, aircraft);
    }

    render(snapshot = null) {
        const { ctx, dims, settings } = this;
        const { totalWidth, totalHeight } = dims;

        // Clear
        ctx.fillStyle = settings.colors.background;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Draw Fuselage Outline (Increased visibility)
        // this._drawFuselage();

        // Draw Technical Grid
        this._drawGrid();

        // Draw aisle
        this._drawAisle(snapshot);

        // Draw seats
        this._drawSeats(snapshot);

        // Draw labels
        this._drawRowLabels();
        this._drawColumnLabels();

        // Draw passengers
        if (snapshot) {
            this._drawPassengersInAisle(snapshot);
        }

        // Draw entry
        this._drawEntryArea(snapshot);
    }

    _drawFuselage() {
        const { ctx, dims, settings } = this;
        const { totalWidth, totalHeight } = dims;
        const { padding } = settings;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 10;

        const fuselageWidth = totalWidth - (padding * 0.5);
        const fuselageX = (totalWidth - fuselageWidth) / 2;
        const wingY = totalHeight * 0.45;
        const noseLength = 80;
        const tailLength = 100;

        // --- 1. Wings (Outline) ---
        ctx.beginPath();
        // Left
        ctx.moveTo(fuselageX + 10, wingY);
        ctx.bezierCurveTo(fuselageX - 80, wingY + 40, fuselageX - 140, wingY + 100, fuselageX - 150, wingY + 180);
        ctx.lineTo(fuselageX - 120, wingY + 180);
        ctx.bezierCurveTo(fuselageX - 100, wingY + 120, fuselageX - 60, wingY + 100, fuselageX + 10, wingY + 80);
        // Right
        ctx.moveTo(fuselageX + fuselageWidth - 10, wingY);
        ctx.bezierCurveTo(fuselageX + fuselageWidth + 80, wingY + 40, fuselageX + fuselageWidth + 140, wingY + 100, fuselageX + fuselageWidth + 150, wingY + 180);
        ctx.lineTo(fuselageX + fuselageWidth + 120, wingY + 180);
        ctx.bezierCurveTo(fuselageX + fuselageWidth + 100, wingY + 120, fuselageX + fuselageWidth + 60, wingY + 100, fuselageX + fuselageWidth - 10, wingY + 80);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.stroke();

        // --- 2. Engines ---
        const drawEngineOutline = (x, y) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.rect(-12, 0, 24, 40); // Nacelle
            ctx.stroke();
            ctx.beginPath(); // Inner fan circle
            ctx.arc(0, 4, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        };
        drawEngineOutline(fuselageX - 60, wingY + 80);
        drawEngineOutline(fuselageX + fuselageWidth + 60, wingY + 80);

        // --- 3. Tail Stabilizers ---
        ctx.beginPath();
        const tailY = totalHeight - padding - 40;
        // Left
        ctx.moveTo(fuselageX + 10, tailY);
        ctx.lineTo(fuselageX - 70, tailY + 50);
        ctx.lineTo(fuselageX - 60, tailY + 65);
        ctx.lineTo(fuselageX + 15, tailY + 50);
        // Right
        ctx.moveTo(fuselageX + fuselageWidth - 10, tailY);
        ctx.lineTo(fuselageX + fuselageWidth + 70, tailY + 50);
        ctx.lineTo(fuselageX + fuselageWidth + 60, tailY + 65);
        ctx.lineTo(fuselageX + fuselageWidth - 15, tailY + 50);
        ctx.fill();
        ctx.stroke();

        // --- 4. Main Fuselage ---
        ctx.beginPath();
        ctx.lineWidth = 3; // Thicker main body
        const mainBodyStart = padding + noseLength;
        const mainBodyEnd = totalHeight - padding - tailLength * 0.5;

        // Nose
        ctx.moveTo(fuselageX, mainBodyStart);
        ctx.bezierCurveTo(fuselageX, padding, fuselageX + fuselageWidth, padding, fuselageX + fuselageWidth, mainBodyStart);
        // Body
        ctx.lineTo(fuselageX + fuselageWidth, mainBodyEnd);
        // Tail
        ctx.bezierCurveTo(fuselageX + fuselageWidth, totalHeight, fuselageX, totalHeight, fuselageX, mainBodyEnd);
        ctx.closePath();

        // Fill with glass-like effect
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'; // Red tint maintained
        ctx.fill();
        ctx.stroke();

        // --- 5. Cockpit ---
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const cpY = padding + 45;
        ctx.moveTo(fuselageX + fuselageWidth * 0.2, cpY);
        ctx.bezierCurveTo(fuselageX + fuselageWidth * 0.4, cpY + 15, fuselageX + fuselageWidth * 0.6, cpY + 15, fuselageX + fuselageWidth * 0.8, cpY);
        ctx.quadraticCurveTo(fuselageX + fuselageWidth * 0.5, cpY - 10, fuselageX + fuselageWidth * 0.2, cpY);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // ... Implement specific draw methods or reuse base ...
    // For Blueprint, we use the base methods essentially, 
    // but we can override them if we want specific "blueprint" flair

    _drawSeats(snapshot) {
        // Reuse base implementation for now, it matches the blueprint style
        // We could copy-paste and modify if we want distinct look per renderer
        // But for now, extending BaseRenderer's logic is fine as BaseRenderer 
        // was built from the original "Blueprint-ish" code.

        // To be safe and self-contained, let's copy the logic or ensure BaseRenderer has it.
        // BaseRenderer DOES NOT have the drawing logic in the file I just wrote?
        // Ah, I wrote BaseRenderer WITHOUT the draw methods in the previous turn?
        // Let me check BaseRenderer content again.

        // Wait, I check the previous turn's write_to_file.
        // I put `render(snapshot) { ... }` but NO draw methods in BaseRenderer!
        // I must add them to BaseRenderer or implement them here.
        // Better to put shared logic in BaseRenderer to avoid code duplication.
        // But since I already wrote BaseRenderer, I should probably update it 
        // OR just implement everything here. 
        // Given I need 3 renderers, shared logic in Base is best.

        // Let's implement drawing logic here for now to be safe and ensure it works.

        const { ctx, dims, settings, aircraft } = this;
        const { seatSize } = dims;

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

                ctx.fillStyle = isOccupied ? settings.colors.seatOccupied : settings.colors.seatEmpty;
                ctx.beginPath();
                ctx.roundRect(x, y, seatSize, seatSize, 4);
                ctx.fill();

                ctx.strokeStyle = settings.colors.border;
                ctx.lineWidth = 1;
                ctx.stroke();

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

    _drawGrid() {
        const { ctx, dims, settings } = this;
        const gridSize = 32;

        ctx.strokeStyle = settings.colors.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= dims.totalWidth; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, dims.totalHeight);
        }
        for (let y = 0; y <= dims.totalHeight; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(dims.totalWidth, y);
        }
        ctx.stroke();
    }

    _drawAisle(snapshot) {
        const { ctx, dims, settings } = this;
        const { aisleX, seatSize, seatGap, aisleWidth } = dims;

        ctx.fillStyle = settings.colors.aisle;
        ctx.fillRect(aisleX, settings.padding, aisleWidth, dims.totalHeight - settings.padding * 2);

        if (snapshot && snapshot.passengersInAisle) {
            for (const p of snapshot.passengersInAisle) {
                if (p.state === 'stowing' || p.state === 'shuffling') {
                    const pos = this.getAislePosition(p.aisleRow);
                    ctx.fillStyle = settings.colors.aisleBlocked;
                    ctx.fillRect(aisleX, pos.y - seatSize / 2 - seatGap / 2, aisleWidth, seatSize + seatGap);
                }
            }
        }
    }

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

    _drawPassengersInAisle(snapshot) {
        const { ctx, dims, settings } = this;
        const { seatSize } = dims;
        const radius = seatSize / 2 - 2;

        for (const p of snapshot.passengersInAisle) {
            const pos = this.getAislePosition(p.aisleRow);
            let color = settings.colors.passenger;

            if (p.state === 'stowing' || p.state === 'shuffling') color = settings.colors.passengerWaiting;
            else if (p.state === 'seating') color = settings.colors.passengerSeating;

            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(p.id), pos.x, pos.y);
        }
    }

    _drawEntryArea(snapshot) {
        const { ctx, dims, settings } = this;
        const { aisleX, aisleWidth } = dims;
        const y = settings.padding;

        ctx.fillStyle = settings.colors.textLight;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ENTRY', aisleX + aisleWidth / 2, y);

        if (snapshot && snapshot.passengersWaiting) {
            const queueCount = snapshot.passengersWaiting.length;
            if (queueCount > 0) {
                ctx.fillStyle = settings.colors.passengerWaiting;
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillText(`Queue: ${queueCount}`, aisleX + aisleWidth / 2, y + 14);
            }
        }
    }
}
