import { useRef, useEffect } from "react";
import {
  maxKineticEnergy,
  stoppingVoltage,
  isAboveThreshold,
  getCurrent,
} from "../physics/photoelectric";

interface GraphProps {
  intensity: number;
  frequency: number;
  thresholdFrequency: number;
  voltage: number;
}

// Convert our internal frequency (in units of 10^14 Hz) to THz
// Our slider goes from 1 to 20, which means 100 to 2000 THz
const toTHz = (f: number) => f * 100;

// Returns just the mantissa part, like "1.31" from frequency 13.1
// We need this for the ×10^15 Hz display on canvas
const toMantissa = (freq: number): string => {
  const mantissa = (freq * 100) / 1000;
  return `${mantissa.toFixed(2)}`;
};

// Padding around the graph plot area
const PAD = { top: 20, right: 14, bottom: 26, left: 38 };

// Given axis ranges, returns scaleX and scaleY functions
// that convert data values to pixel coordinates on the canvas
function makeScaleFunctions(
  width: number,
  height: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
) {
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  return {
    scaleX: (val: number) => PAD.left + ((val - xMin) / (xMax - xMin)) * plotW,
    scaleY: (val: number) =>
      PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH,
  };
}

// Draws the background, plot area, axes, title, and labels for a graph
function drawAxes(
  ctx: CanvasRenderingContext2D,
  title: string,
  xLabel: string,
  yLabel: string
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const plotW = w - PAD.left - PAD.right;
  const plotH = h - PAD.top - PAD.bottom;

  // Dark background behind the whole graph
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, w, h);

  // Slightly lighter background for the plot area
  ctx.fillStyle = "#11162b";
  ctx.fillRect(PAD.left, PAD.top, plotW, plotH);

  // X-axis line
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, h - PAD.bottom);
  ctx.lineTo(w - PAD.right, h - PAD.bottom);
  ctx.stroke();

  // Y-axis line (brighter because it's the main reference)
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, h - PAD.bottom);
  ctx.stroke();

  // Graph title at the top
  ctx.fillStyle = "#ddd";
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, w / 2, 12);

  // X-axis label
  ctx.fillStyle = "#999";
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, w / 2, h - 4);

  // Y-axis label (rotated 90 degrees to be vertical)
  ctx.save();
  ctx.translate(8, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

// Draw a connected line through a list of points
function drawLine(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
) {
  if (points.length < 2) return;

  const { scaleX, scaleY } = makeScaleFunctions(
    ctx.canvas.width,
    ctx.canvas.height,
    xMin,
    xMax,
    yMin,
    yMax
  );

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Move to first point, then draw lines to the rest
  for (let i = 0; i < points.length; i++) {
    const sx = scaleX(points[i].x);
    const sy = scaleY(points[i].y);
    if (i === 0) {
      ctx.moveTo(sx, sy);
    } else {
      ctx.lineTo(sx, sy);
    }
  }

  ctx.stroke();
}

// Draw a dot with a label showing the current frequency and its KE
function drawCurrentFreqMarker(
  ctx: CanvasRenderingContext2D,
  freq: number,
  ke: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
) {
  const { scaleX, scaleY } = makeScaleFunctions(
    ctx.canvas.width,
    ctx.canvas.height,
    xMin,
    xMax,
    yMin,
    yMax
  );

  const sx = scaleX(toTHz(freq));
  const sy = scaleY(ke);

  // White outer dot
  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.arc(sx, sy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Green inner dot
  ctx.fillStyle = "#69f0ae";
  ctx.arc(sx, sy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Label next to the dot
  ctx.fillStyle = "#ddd";
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "left";

  // Write "v = 1.00 × 10" with the "15" as a smaller superscript
  ctx.fillText(`v = ${toMantissa(freq)}`, sx + 6, sy - 6);
  ctx.font = "7px Inter, sans-serif";
  ctx.fillText("15", sx + 28, sy - 11);

  ctx.font = "9px Inter, sans-serif";
  ctx.fillText(`KE = ${ke.toFixed(2)} eV`, sx + 6, sy + 8);
}

// Draw the "× 10 15" label (where 15 is superscript) at a given position
// The axis label on the KE graph shows frequency in ×10^15 Hz
function drawScientificLabel(
  ctx: CanvasRenderingContext2D,
  prefix: string,
  mantissa: string,
  x: number,
  y: number
) {
  ctx.fillStyle = "#aaa";
  ctx.font = "8px Inter, sans-serif";
  ctx.fillText(`${prefix} = ${mantissa}`, x, y);
  ctx.font = "6px Inter, sans-serif";
  ctx.fillText("15", x + 33, y - 5);
}

// Draw graph 1: how current changes with voltage applied to the plates
function drawCurrentVsVoltage(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  frequency: number,
  threshold: number
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const V_stop = stoppingVoltage(frequency, threshold);
  const above = isAboveThreshold(frequency, threshold);

  // Make the x-axis symmetric around zero
  const vRange = Math.max(V_stop + 1, 1);
  const vMin = -vRange;
  const vMax = vRange;

  // Generate data points
  const points: { x: number; y: number }[] = [];
  for (let v = vMin; v <= vMax; v += 0.05) {
    points.push({ x: v, y: getCurrent(intensity, v, frequency, threshold) });
  }

  const yMax = 15;

  drawAxes(ctx, "Current vs Voltage", "Voltage (V)", "I (mA)");
  drawLine(ctx, points, "#ffaa66", vMin, vMax, 0, yMax);

  const { scaleX, scaleY } = makeScaleFunctions(
    ctx.canvas.width,
    ctx.canvas.height,
    vMin,
    vMax,
    0,
    yMax
  );

  // Dashed vertical line at V = 0
  const zeroX = scaleX(0);
  ctx.beginPath();
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.moveTo(zeroX, PAD.top);
  ctx.lineTo(zeroX, ctx.canvas.height - PAD.bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#888";
  ctx.font = "8px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("0 V", zeroX, ctx.canvas.height - PAD.bottom + 12);

  // Stopping voltage marker
  if (above) {
    const stopX = scaleX(-V_stop);
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(stopX, scaleY(0), 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#aaa";
    ctx.font = "8px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`V0 = ${V_stop.toFixed(2)} V`, stopX + 5, scaleY(0) - 4);
  }
}

// Draw graph 2: how current changes with light intensity
function drawCurrentVsIntensity(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  frequency: number,
  threshold: number,
  voltage: number
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const above = isAboveThreshold(frequency, threshold);

  // Generate data points from 0% to 100% intensity
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 1; i += 0.05) {
    points.push({
      x: i,
      y: above ? getCurrent(i, voltage, frequency, threshold) : 0,
    });
  }

  const yMax = 12;

  drawAxes(ctx, "Current vs Intensity", "Intensity", "I (mA)");
  drawLine(ctx, points, "#64b5f6", 0, 1, 0, yMax);

  const { scaleX, scaleY } = makeScaleFunctions(
    ctx.canvas.width,
    ctx.canvas.height,
    0,
    1,
    0,
    yMax
  );

  // Marker at the current intensity
  const currentValue = above
    ? getCurrent(intensity, voltage, frequency, threshold)
    : 0;
  const markerX = scaleX(intensity);
  const markerY = scaleY(currentValue);

  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#64b5f6";
  ctx.arc(markerX, markerY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ddd";
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`I = ${Math.round(intensity * 100)}%`, markerX + 6, markerY - 4);
  ctx.fillText(`${currentValue.toFixed(1)} mA`, markerX + 6, markerY + 10);
}

// Draw graph 3: kinetic energy of electrons vs light frequency
function drawKEvsFrequency(
  ctx: CanvasRenderingContext2D,
  frequency: number,
  threshold: number
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Set the x-axis range to show around the threshold
  const fMin = Math.max(1, threshold - 2);
  const fMax = threshold + 8;

  // Generate KE values across the frequency range
  const points: { x: number; y: number }[] = [];
  let keMax = 0;
  for (let f = fMin; f <= fMax; f += 0.2) {
    const ke = maxKineticEnergy(f, threshold);
    keMax = Math.max(keMax, ke);
    // Convert frequency to THz for the x-axis
    points.push({ x: toTHz(f), y: ke });
  }

  const yMax = Math.max(keMax, 1);

  // On the x-axis, we show THz values. The axis label says "v (Hz)"
  // but the tick marks show THz numbers (since that's what we pass to drawLine)
  drawAxes(ctx, "Kinetic Energy vs Frequency", "v (Hz)", "KE (eV)");
  drawLine(ctx, points, "#69f0ae", toTHz(fMin), toTHz(fMax), 0, yMax);

  const { scaleX, scaleY } = makeScaleFunctions(
    ctx.canvas.width,
    ctx.canvas.height,
    toTHz(fMin),
    toTHz(fMax),
    0,
    yMax
  );

  // Threshold point marker
  const thX = scaleX(toTHz(threshold));
  const thY = scaleY(0);
  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.arc(thX, thY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Label with scientific notation
  drawScientificLabel(ctx, "f0", toMantissa(threshold), thX + 5, thY - 4);

  // Marker for the current frequency
  const currentKE = maxKineticEnergy(frequency, threshold);
  drawCurrentFreqMarker(
    ctx,
    frequency,
    currentKE,
    toTHz(fMin),
    toTHz(fMax),
    0,
    yMax
  );
}

// ---------- Component ----------
function Graph({
  intensity,
  frequency,
  thresholdFrequency,
  voltage,
}: GraphProps) {
  const ivCanvas = useRef<HTMLCanvasElement>(null);
  const iICanvas = useRef<HTMLCanvasElement>(null);
  const keCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ivCtx = ivCanvas.current?.getContext("2d");
    if (ivCtx) {
      drawCurrentVsVoltage(ivCtx, intensity, frequency, thresholdFrequency);
    }

    const iiCtx = iICanvas.current?.getContext("2d");
    if (iiCtx) {
      drawCurrentVsIntensity(iiCtx, intensity, frequency, thresholdFrequency, voltage);
    }

    const keCtx = keCanvas.current?.getContext("2d");
    if (keCtx) {
      drawKEvsFrequency(keCtx, frequency, thresholdFrequency);
    }
  }, [intensity, frequency, thresholdFrequency, voltage]);

  return (
    <div className="graphs-container">
      <div className="graph-placeholder">
        <h3>Current vs Voltage</h3>
        <canvas ref={ivCanvas} width={420} height={260} />
      </div>
      <div className="graph-placeholder">
        <h3>Current vs Intensity</h3>
        <canvas ref={iICanvas} width={420} height={260} />
      </div>
      <div className="graph-placeholder">
        <h3>KE vs Frequency</h3>
        <canvas ref={keCanvas} width={420} height={260} />
      </div>
    </div>
  );
}

export default Graph;