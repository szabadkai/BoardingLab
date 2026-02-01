# ✈️ Boarding Lab

**Boarding Lab** is an interactive educational tool that visualizes and compares airplane boarding strategies. It demonstrates why the standard "Back-to-Front" method is often inefficient and explores how alternative algorithms can significantly speed up the process.

The simulation runs entirely in your browser using **Vanilla JavaScript** and **HTML5 Canvas**, with no backend dependencies.

## ✨ Features

- **5 Base Algorithms**:
  - `Random`: Baseline control group.
  - `Back-to-Front`: Standard airline method (often causes bin congestion).
  - `Window-Middle-Aisle (WMA)`: Ideal theory, reduces seat interference.
  - `Zone-Based`: Configurable zones, mirroring real-world practices.
  - `Weighted Heuristic`: Customizable balance of row, seat, and luggage factors.

- **Real-time Visualization**:
  - Watch passengers navigate the aisle, wait for others, and stow luggage.
  - Visual metrics for aisle blockages and seat shuffling.
  - Playback controls (speed, scrub, step).
  - **Visualization Modes**: Realistic, Blueprint, and Heatmap.

- **🧬 Optimization & Parameters**:
  - **Exposed Weights**: Fine-tune algorithms using slider controls for parameters like:
    - `Row Weight`: Importance of row number (Back-to-Front vs Front-to-Back).
    - `Seat Weight`: Importance of seat position (Window vs Aisle).
    - `Luggage Weight`: Impact of carry-on size.
  - **Genetic Genetic Optimizer**: Automatically evolves the best combination of weights to minimize boarding time using a genetic algorithm.


- **Advanced Mode**:
  - 🛠️ **Code Editor**: Write your own boarding algorithms in JavaScript.
  - **Comparison View**: Modify an algorithm and see a side-by-side performance diff (e.g., `-15s` faster) against the baseline.

- **Detailed Metrics**:
  - Total Boarding Time.
  - Average & Max Wait Times.
  - Aisle Blockage Percentage.
  - "Why This Result?": Automated explanation engine identifying top delay causes.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/boarding-lab.git
   cd boarding-lab
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`.

## 🛠️ Technology Stack

- **Core**: Vanilla JavaScript (ES Modules).
- **Rendering**: HTML5 Canvas API (for high-performance 2D visualization).
- **Styling**: Modern CSS variables, Flexbox/Grid (no CSS framework).
- **Tooling**: [Vite](https://vitejs.dev/) for fast development and building.
- **Testing**: Deterministic RNG for reproducible simulations.

## 📦 Deployment

This project is configured for **GitHub Pages**.

1. **Automated**: A GitHub Action (`.github/workflows/deploy.yml`) automatically builds and deploys to the `gh-pages` branch on every push to `master`.
2. **Manual**:
   ```bash
   npm run build
   # Serve the dist/ folder using any static host
   ```

## 🧪 Advanced: Custom Algorithms

In "Advanced Mode", you can define a priority function:

```javascript
// Parameters
// passenger: { id, row, column, seatClass, carryOnSize, ... }
// context: { totalRows, totalPassengers, columns, ... }

// Return a number (Higher = Boards Earlier)
return passenger.row + (passenger.seatClass === 'window' ? 100 : 0);
```

The simulator validates your code and runs a comparison against the original preset.

## 📄 License

MIT License.
