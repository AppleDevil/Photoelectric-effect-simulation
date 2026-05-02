interface Props {
  intensity: number;
  setIntensity: (value: number) => void;
  frequency: number;
  setFrequency: (value: number) => void;
  selectedMetal: string;
  setSelectedMetal: (metal: string) => void;
  voltage: number;
  setVoltage: (value: number) => void;
}

const metals = ["Sodium", "Zinc", "Copper", "Platinum"];

const toScientific = (freq: number): string => {
  const thz = freq * 100;
  const mantissa = thz / 1000;
  return `${mantissa.toFixed(2)} × 10<sup>15</sup> Hz`;
};

function Controls({
  intensity,
  setIntensity,
  frequency,
  setFrequency,
  selectedMetal,
  setSelectedMetal,
  voltage,
  setVoltage,
}: Props) {
  return (
    <div className="controls">
      {/* Light Intensity */}
      <div className="control-group">
        <label>
          <span className="label-text">Light Intensity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity * 100}
            onChange={(e) => setIntensity(Number(e.target.value) / 100)}
          />
          <span className="value">{Math.round(intensity * 100)}%</span>
        </label>
      </div>

      {/* Light Frequency */}
      <div className="control-group">
        <label>
          <span className="label-text">Light Frequency</span>
          <input
            type="range"
            min="1"
            max="20"
            step="0.1"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />
          <span 
            className="value" 
            dangerouslySetInnerHTML={{__html: toScientific(frequency)}} 
          />
        </label>
      </div>

      {/* Battery Voltage */}
      <div className="control-group">
        <label>
          <span className="label-text">Battery Voltage</span>
          <input
            type="range"
            min="-5"
            max="5"
            step="0.01"
            value={voltage}
            onChange={(e) => setVoltage(Number(e.target.value))}
          />
          <span className="value">
            {voltage > 0 ? "+" : ""}
            {voltage.toFixed(2)} V
          </span>
        </label>
      </div>

      {/* Metal Type */}
      <div className="control-group">
        <span className="label-text">Metal Type</span>
        <div className="metal-selector">
          {metals.map((metal) => (
            <button
              key={metal}
              className={`metal-btn ${selectedMetal === metal ? "active" : ""}`}
              onClick={() => setSelectedMetal(metal)}
            >
              {metal}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Controls;