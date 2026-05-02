import { useState } from "react";
import SimulationCanvas from "./components/SimulationCanvas";
import Controls from "./components/Controls";
import Readout from "./components/Readout";
import Graph from "./components/Graph";
import { METAL_THRESHOLDS, stoppingVoltage } from "./physics/photoelectric";
import "./App.css";

function App() {
  const [intensity, setIntensity] = useState(0.3);
  const [frequency, setFrequency] = useState(10); // 1000 THz
  const [selectedMetal, setSelectedMetal] = useState("Sodium");
  const [voltage, setVoltage] = useState(0); // battery voltage

  const thresholdFrequency = METAL_THRESHOLDS[selectedMetal];
  const stoppingV = stoppingVoltage(frequency, thresholdFrequency);

  return (
    <div className="app">
      <header className="header">
        <h1>Photoelectric Effect Simulation</h1>
        <p className="subtitle">Interactive Physics Visualization</p>
      </header>

      <main className="main-content">
        {/* Row 1: Canvas + Controls side by side, same height */}
        <div className="top-row">
          <div className="canvas-wrapper">
            <SimulationCanvas
              intensity={intensity}
              frequency={frequency}
              thresholdFrequency={thresholdFrequency}
              voltage={voltage}
            />
          </div>
          <div className="controls-wrapper">
            <Controls
              intensity={intensity}
              setIntensity={setIntensity}
              frequency={frequency}
              setFrequency={setFrequency}
              selectedMetal={selectedMetal}
              setSelectedMetal={setSelectedMetal}
              voltage={voltage}
              setVoltage={setVoltage}
            />
          </div>
        </div>

        {/* Row 2: Readout (full width of canvas) */}
        <div className="readout-row">
          <Readout
            intensity={intensity}
            frequency={frequency}
            thresholdFrequency={thresholdFrequency}
            voltage={voltage}
            stoppingVoltage={stoppingV}
          />
        </div>

        {/* Row 3: Graphs (same width as readout, 3 in a row) */}
        <div className="graphs-row">
          <Graph
            intensity={intensity}
            frequency={frequency}
            thresholdFrequency={thresholdFrequency}
            voltage={voltage}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
