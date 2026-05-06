# Photoelectric Effect Simulation

An interactive physics simulation demonstrating the **photoelectric effect** — the phenomenon where light ejects electrons from a metal surface. Built with React, TypeScript, and HTML5 Canvas.

## Live Demo

Hosted on GitHub Pages: **[https://AppleDevil.github.io/photoelectric-effect-simulation/](https://appledevil.github.io/Photoelectric-effect-simulation/)**

---

## How to Run Locally

### Prerequisites
- Node.js installed on your computer

### Commands

```bash
# Navigate to the project folder
cd photoelectric-prototype

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## What is the Photoelectric Effect?

The photoelectric effect is how light can eject electrons from a metal. Key observations:

1. **Threshold Frequency**: Light below a certain frequency won't eject any electrons, no matter how bright
2. **Electron Energy**: Higher light frequency = more energetic electrons (faster)
3. **Current**: More light intensity = more electrons ejected (higher current)
4. **Stopping Voltage**: A negative voltage can slow and stop electrons

This simulation lets you explore all these relationships interactively.

---

## How to Use the Simulation

### The Setup
The simulation shows two metal plates (cathode and anode) inside a vacuum tube, connected by wires to a battery.

- **Cathode (left plate)**: The metal that light shines on
- **Anode (right plate)**: The plate that collects electrons

### Controls

| Control | What It Does |
|---------|------------|
| **Light Intensity** | How bright the light is (0-100%). More intensity = more electrons ejected. |
| **Light Frequency** | The energy of the light photons. Higher frequency = more energy per electron. Displayed in scientific notation (×10¹⁵ Hz). |
| **Battery Voltage** | Can be positive (accelerates electrons) or negative (slows/stops them). Range: -5V to +5V. |
| **Metal Type** | Different metals have different threshold frequencies. |

### Understanding the Readout

| Value | Meaning |
|-------|---------|
| **Kinetic Energy** | Maximum energy of ejected electrons (in eV) |
| **Current** | How many electrons reach the anode per second (in mA) |
| **Applied Voltage** | The voltage you set on the battery |
| **Stopping Voltage** | The voltage needed to stop ALL electrons |
| **Threshold Freq** | The minimum frequency needed to eject electrons |

---

## The Graphs

### 1. Current vs Voltage (I-V Curve)
Shows how current changes as you sweep voltage from negative to positive.
- At negative voltages: electrons are slowed/stopped
- At positive voltages: electrons are accelerated
- The point where current drops to zero is the **stopping voltage**

### 2. Current vs Intensity
Shows the linear relationship between light intensity and current.
- Current is directly proportional to intensity
- The marker shows your current intensity setting

### 3. Kinetic Energy vs Frequency
Shows the key photoelectric effect relationship.
- Below threshold: no electrons (flat line at zero)
- Above threshold: KE increases linearly with frequency
- The slope relates to Planck's constant

---

## Physics Formulas Used

```
Photon Energy: E = h × f
Electron KE: KE = h × f - φ (work function)
Stopping Voltage: V₀ = KE / e
Electron Velocity: v = √(2 × KE / mₑ)
```

Where:
- h = Planck's constant (6.626 × 10⁻³⁴ J·s)
- f = frequency
- φ = work function (metal-specific)
- e = electron charge (1.602 × 10⁻¹⁹ C)
- mₑ = electron mass (9.109 × 10⁻³¹ kg)

---

## Metals Available

| Metal | Threshold Frequency (×10¹⁵ Hz) | Work Function (eV) |
|-------|-------------------------------|---------------------|
| Sodium | 4.4 | 1.82 |
| Zinc | 9.0 | 3.72 |
| Copper | 12.3 | 5.08 |
| Platinum | 14.7 | 6.08 |

---

## Technical Details

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Rendering**: HTML5 Canvas API
- **Hosting**: GitHub Pages

The simulation uses accurate physical constants and formulas. The visual animation is slowed down so electrons are visible to the human eye, but the physics relationships (stopping voltage, threshold behavior, etc.) are preserved.

---

## License

Copyright © 2026 Wahhaj. All rights reserved.

This simulation code belongs to Wahhaj. You are free to view and use this for learning purposes, but you may not claim it as your own work.
