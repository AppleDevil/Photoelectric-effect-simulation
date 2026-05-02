import { maxKineticEnergy, isAboveThreshold } from "../physics/photoelectric";

const toScientific = (freq: number): string => {
  const thz = freq * 100;
  const mantissa = thz / 1000;
  return `${mantissa.toFixed(2)} × 10<sup>15</sup> Hz`;
};

interface ReadoutProps {
  intensity: number;
  frequency: number;
  thresholdFrequency: number;
  voltage: number;
  stoppingVoltage: number;
}

function Readout({
  intensity,
  frequency,
  thresholdFrequency,
  voltage,
  stoppingVoltage,
}: ReadoutProps) {
  const isEmitting = isAboveThreshold(frequency, thresholdFrequency);
  const kineticEnergy = isEmitting
    ? maxKineticEnergy(frequency, thresholdFrequency)
    : 0;

  // Current calculation – depends on applied voltage
  const baseCurrent = intensity * 12; // maximum current (emission‑limited)
  let current = 0;
  if (isEmitting) {
    if (voltage >= 0) {
      // Accelerating or zero voltage → all emitted electrons reach the anode
      current = baseCurrent;
    } else {
      // Retarding voltage: current decreases linearly and reaches zero at V = V_stop
      const fraction = Math.max(0, 1 - Math.abs(voltage) / stoppingVoltage);
      current = baseCurrent * fraction;
    }
  }

  return (
    <div className="readout">
      <div className="readout-item">
        <span className="readout-label">Kinetic Energy</span>
        <span className={`readout-value ${isEmitting ? "active" : "inactive"}`}>
          {kineticEnergy.toFixed(2)} eV
        </span>
      </div>
      <div className="readout-item">
        <span className="readout-label">Current</span>
        <span className={`readout-value ${isEmitting ? "active" : "inactive"}`}>
          {current.toFixed(1)} mA
        </span>
      </div>
      <div className="readout-item">
        <span className="readout-label">Applied Voltage</span>
        <span className={`readout-value ${isEmitting ? "active" : "inactive"}`}>
          {voltage.toFixed(2)} V
        </span>
      </div>
      <div className="readout-item">
        <span className="readout-label">Stopping Voltage</span>
        <span className={`readout-value ${isEmitting ? "active" : "inactive"}`}>
          {stoppingVoltage.toFixed(2)} V
        </span>
      </div>
      <div className="readout-item">
        <span className="readout-label">Threshold Freq</span>
        <span 
            className="readout-value threshold"
            dangerouslySetInnerHTML={{__html: toScientific(thresholdFrequency)}}
          />
      </div>
    </div>
  );
}

export default Readout;
