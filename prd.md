**Product:** Plane Boarding & Unboarding Simulator
**Purpose:** Education and demonstration of system-level inefficiencies
**Platform:** Desktop web (primary), mobile web (supported)
**Audience:** Technically literate users, students, educators

---

## 1. Problem Statement

Most people have incorrect intuitions about airplane boarding and unboarding efficiency.

Common myths:

* Back-to-front is efficient.
* Zones solve congestion.
* Delays are caused by “slow people”.

These beliefs persist because cause-and-effect is not observable.

---

## 2. Product Goal

Make boarding and unboarding dynamics **observable, comparable, and explainable**.

Success criteria:

* Users can explain *why* a strategy performs well or poorly.
* Users can modify strategies and predict directional outcomes.

Non-goals:

* Airline-grade operational optimization.
* Real-world certification accuracy.
* Gamification.

---

## 3. Target Users

Primary:

* Engineering-minded users.
* Systems thinkers.
* Students (operations, UX, transport).

Secondary:

* Educators.
* Journalists.

Explicit exclusion:

* Casual users unwilling to engage with abstractions.

---

## 4. Core User Experience

Canonical loop:

1. Select a base algorithm.
2. Run simulation.
3. Observe bottlenecks.
4. Compare against baseline.
5. Optionally modify algorithm.
6. Re-run and compare.

Average session length:

* 3–7 minutes.

---

## 5. Simulation Scope (v1)

### Aircraft Model

Included:

* Single-aisle narrow-body.
* One front boarding door.
* Fixed seat layout.

Excluded:

* Widebody aircraft.
* Dual-door boarding.
* Jet bridge vs stairs distinction.

---

### Passenger Model

Each passenger has immutable attributes:

* Seat (row, column).
* Walk speed (slow / normal / fast).
* Carry-on size (none / small / large).
* Group ID (optional).
* Compliance level (follows rules vs opportunistic).

Explicit simplifications:

* No emotional state.
* No airline status.
* No learning or adaptation.

---

## 6. Algorithms (First-Class)

The system ships with **exactly 5 base algorithms**.

Each algorithm is:

* Fully readable.
* Fully editable in advanced mode.
* Governed by a strict execution contract.

### 6.1 Algorithm Execution Contract (Hard Requirement)

Every algorithm must implement:

```
priority(passenger, context) -> number
```

Constraints:

* Pure function.
* No mutation.
* No global state.
* No time access.
* Randomness only via provided deterministic RNG.
* Sorting and constraints handled by engine only.

Violation = execution blocked.

---

### 6.2 Base Algorithms

#### 1. Random Baseline

Purpose:

* Control reference.

Logic:

* Uniform random priority.

---

#### 2. Back-to-Front

Purpose:

* Demonstrate bin congestion.

Logic:

* Higher row number → higher priority.

---

#### 3. Window–Middle–Aisle (WMA)

Purpose:

* Demonstrate seat interference reduction.

Logic:

* Seat class dominates.
* Row secondary.

Invariant:

* Seat-class ordering present unless explicitly removed by user.

---

#### 4. Zone-Based

Purpose:

* Mirror real airline practice.

Logic:

* Zone assignment.
* Soft or hard enforcement.

Parameters:

* Number of zones.
* Enforcement strictness.

---

#### 5. Weighted Heuristic

Purpose:

* Bridge to custom strategies.

Logic:

* Linear combination of passenger attributes.

This is the recommended starting point for edits.

---

## 7. Advanced Mode: Code Editing

### 7.1 Availability

* Hidden by default.
* Explicit “Advanced / Experimental Mode” toggle.

### 7.2 Language Requirements

* Sandboxed.
* Deterministic.
* Expression-oriented.
* No imports, IO, network, or file access.

Allowed:

* Arithmetic.
* Attribute access.
* Conditionals (limited).
* Provided helper functions only.

Forbidden:

* Loops with unbounded iteration.
* Mutation.
* External state.

---

### 7.3 Editor Features

* Syntax highlighting.
* Static validation before run.
* Inline documentation for passenger schema.
* Warning banner for edited algorithms.

Mobile:

* Read-only editor.
* No editing.

---

## 8. Guardrails and Validation

### 8.1 Static Validation (Pre-Run)

Block execution if:

* Contract violated.
* Non-determinism detected.
* Priority returns NaN or infinity.
* Execution time exceeds limit.

---

### 8.2 Explainability Check (Post-Compile)

System must generate a natural-language summary of the strategy.

If generation fails:

* Show warning:

  > “This strategy cannot be fully explained. Results may be misleading.”

Simulation may still run, but warning persists.

---

### 8.3 Mandatory Comparison

Edited algorithms must be compared against:

* Their original base algorithm.

Comparison cannot be disabled.

---

## 9. Visualization

### View

* 2D top-down aircraft layout.

### Highlights

* Aisle blockage → red overlay.
* Bin contention → icon + counter.
* Seat interference → pause + highlight.

### Timeline

* Scrubbable.
* Speed control.

---

## 10. Metrics Displayed

Shown after every run:

* Total boarding/unboarding time.
* % time aisle blocked.
* Average passenger wait time.
* Worst-case passenger delay.

No composite scores.
No “happiness” metrics.

---

## 11. Explanation Engine (Core Feature)

For each run:

* Identify top 2 delay causes.
* Tie causes to observable events.

Example:

* “Bin congestion in rows 18–24 caused 34% of total delay.”

This is mandatory.
Without this, the product fails its goal.

---

## 12. Desktop vs Mobile

### Desktop (Primary)

* Side-by-side comparison.
* Full metrics.
* Code editor access.

### Mobile (Supported)

* Preset algorithm selection.
* Single comparison view.
* No editing.

---

## 13. Non-Functional Requirements

* Deterministic replay.
* Simulation run < 1 second.
* No backend dependency for core simulation.
* Runs entirely client-side.

---

## 14. Risks and Mitigations

Risk: Users write misleading algorithms.
Mitigation: Guardrails + explainability warnings + mandatory comparison.

Risk: UX overwhelms non-technical users.
Mitigation: Presets-first, advanced mode gated.

Risk: Performance degradation.
Mitigation: Strict execution limits.

---

## 15. Out of Scope (Explicit)

* Multiplayer.
* Real airline data ingestion.
* AI-generated strategies.
* Certification or advisory use.

---

## 16. Launch Criteria

The product is ready when:

* All 5 base algorithms are runnable and editable.
* Explainability engine works for all base algorithms.
* Edited algorithms are safely sandboxed.
* Desktop and mobile behavior match requirements.

---

## 17. Post-v1 Extensions (Not Included)

* Multiple aircraft types.
* Unboarding-only scenarios.
* Strategy sharing links.
* Classroom mode.
