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

const toTHz = (f: number) => f * 100;

const toScientific = (freq: number): string => {
  const thz = freq * 100;
  const mantissa = thz / 1000;
  return `${mantissa.toFixed(2)}`;
};

const drawSuperscript = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.font = "7px Inter, sans-serif";
  ctx.fillText("15", x, y);
};

// ---------- drawing helpers ----------
const PAD = { top: 20, right: 14, bottom: 26, left: 38 };

function drawAxes(
  ctx: CanvasRenderingContext2D,
  title: string,
  xLabel: string,
  yLabel: string,
  _xMin: number,
  _xMax: number,
  _yMin: number,
  _yMax: number,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const plotW = w - PAD.left - PAD.right;
  const plotH = h - PAD.top - PAD.bottom;

  // background
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, w, h);

  // plot area
  ctx.fillStyle = "#11162b";
  ctx.fillRect(PAD.left, PAD.top, plotW, plotH);

  // x-axis
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, h - PAD.bottom);
  ctx.lineTo(w - PAD.right, h - PAD.bottom);
  ctx.stroke();

  // y-axis (prominent)
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, h - PAD.bottom);
  ctx.stroke();

  // title
  ctx.fillStyle = "#ddd";
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, w / 2, 12);

  // axis labels
  ctx.fillStyle = "#999";
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, w / 2, h - 4);
  ctx.save();
  ctx.translate(8, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
) {
  if (points.length < 2) return;
  const plotW = ctx.canvas.width - PAD.left - PAD.right;
  const plotH = ctx.canvas.height - PAD.top - PAD.bottom;

  const scaleX = (val: number) =>
    PAD.left + ((val - xMin) / (xMax - xMin)) * plotW;
  const scaleY = (val: number) =>
    PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  let first = true;
  for (const pt of points) {
    const sx = scaleX(pt.x);
    const sy = scaleY(pt.y);
    if (first) {
      ctx.moveTo(sx, sy);
      first = false;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();
}

function drawCurrentFreqMarker(
  ctx: CanvasRenderingContext2D,
  freq: number,
  ke: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
) {
  const plotW = ctx.canvas.width - PAD.left - PAD.right;
  const plotH = ctx.canvas.height - PAD.top - PAD.bottom;
  const scaleX = (val: number) =>
    PAD.left + ((val - xMin) / (xMax - xMin)) * plotW;
  const scaleY = (val: number) =>
    PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  const sx = scaleX(toTHz(freq));
  const sy = scaleY(ke);

  // bright dot
  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.arc(sx, sy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#69f0ae";
  ctx.arc(sx, sy, 3, 0, Math.PI * 2);
  ctx.fill();

  // label
  ctx.fillStyle = "#ddd";
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "left";
  const sci = toScientific(freq);
  ctx.fillText(`v = ${sci}`, sx + 6, sy - 6);
  drawSuperscript(ctx, sx + 28, sy - 11);
  ctx.fillText(`KE = ${ke.toFixed(2)} eV`, sx + 6, sy + 8);
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
    const f_th = thresholdFrequency;
    const V_stop = stoppingVoltage(frequency, f_th);
    const above = isAboveThreshold(frequency, f_th);

    // 1. Current vs Voltage
    const ctx1 = ivCanvas.current?.getContext("2d");
    if (ctx1) {
      ctx1.clearRect(0, 0, ctx1.canvas.width, ctx1.canvas.height);
      const vRange = Math.max(V_stop + 1, 1);
      const vMin = -vRange;
      const vMax = vRange;
      const pts: { x: number; y: number }[] = [];
      for (let v = vMin; v <= vMax; v += 0.05) {
        const cur = getCurrent(intensity, v, frequency, f_th);
        pts.push({ x: v, y: cur });
      }
      const yMax = 15;
      drawAxes(
        ctx1,
        "Current vs Voltage",
        "Voltage (V)",
        "I (mA)",
        vMin,
        vMax,
        0,
        yMax,
      );
      drawLine(ctx1, pts, "#ffaa66", vMin, vMax, 0, yMax);

      // dashed vertical line at V = 0
      const plotW = ctx1.canvas.width - PAD.left - PAD.right;
      const plotH = ctx1.canvas.height - PAD.top - PAD.bottom;
      const scaleX = (val: number) =>
        PAD.left + ((val - vMin) / (vMax - vMin)) * plotW;
      const scaleY = (val: number) =>
        PAD.top + plotH - ((val - 0) / (yMax - 0)) * plotH;

      const zeroX = scaleX(0);
      ctx1.beginPath();
      ctx1.strokeStyle = "#888";
      ctx1.lineWidth = 1;
      ctx1.setLineDash([4, 4]);
      ctx1.moveTo(zeroX, PAD.top);
      ctx1.lineTo(zeroX, ctx1.canvas.height - PAD.bottom);
      ctx1.stroke();
      ctx1.setLineDash([]);

      ctx1.fillStyle = "#888";
      ctx1.font = "8px Inter, sans-serif";
      ctx1.textAlign = "center";
      ctx1.fillText("0 V", zeroX, ctx1.canvas.height - PAD.bottom + 12);

      // stopping voltage marker
      if (above) {
        const sx = scaleX(-V_stop);
        const sy = scaleY(0);
        ctx1.beginPath();
        ctx1.fillStyle = "#fff";
        ctx1.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx1.fill();
        ctx1.fillStyle = "#aaa";
        ctx1.font = "8px Inter, sans-serif";
        ctx1.textAlign = "left";
        ctx1.fillText(`V0 = ${V_stop.toFixed(2)} V`, sx + 5, sy - 4);
      }
    }

    // 2. Current vs Intensity
    const ctx2 = iICanvas.current?.getContext("2d");
    if (ctx2) {
      ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 1; i += 0.05) {
        const cur = above ? getCurrent(i, voltage, frequency, f_th) : 0;
        pts.push({ x: i, y: cur });
      }
      const yMax = 12;
      drawAxes(
        ctx2,
        "Current vs Intensity",
        "Intensity",
        "I (mA)",
        0,
        1,
        0,
        yMax,
      );
      drawLine(ctx2, pts, "#64b5f6", 0, 1, 0, yMax);

      // marker
      const plotW = ctx2.canvas.width - PAD.left - PAD.right;
      const plotH = ctx2.canvas.height - PAD.top - PAD.bottom;
      const scaleX = (val: number) => PAD.left + ((val - 0) / 1) * plotW;
      const scaleY = (val: number) =>
        PAD.top + plotH - ((val - 0) / (yMax - 0)) * plotH;
      const curAtIntensity = above
        ? getCurrent(intensity, voltage, frequency, f_th)
        : 0;
      const sx = scaleX(intensity);
      const sy = scaleY(curAtIntensity);

      ctx2.beginPath();
      ctx2.fillStyle = "#fff";
      ctx2.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = "#64b5f6";
      ctx2.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx2.fill();

      ctx2.fillStyle = "#ddd";
      ctx2.font = "9px Inter, sans-serif";
      ctx2.textAlign = "left";
      ctx2.fillText(`I = ${Math.round(intensity * 100)}%`, sx + 6, sy - 4);
      ctx2.fillText(`${curAtIntensity.toFixed(1)} mA`, sx + 6, sy + 10);
    }

    // 3. KE vs Frequency
    const ctx3 = keCanvas.current?.getContext("2d");
    if (ctx3) {
      ctx3.clearRect(0, 0, ctx3.canvas.width, ctx3.canvas.height);
      const fMin = Math.max(1, f_th - 2);
      const fMax = f_th + 8;
      const pts: { x: number; y: number }[] = [];
      let keMax = 0;
      for (let f = fMin; f <= fMax; f += 0.2) {
        const ke = maxKineticEnergy(f, f_th);
        keMax = Math.max(keMax, ke);
        pts.push({ x: toTHz(f), y: ke });
      }
      const yMax = Math.max(keMax, 1);
      drawAxes(
        ctx3,
        "Kinetic Energy vs Frequency",
        "v (Hz)",
        "KE (eV)",
        toTHz(fMin),
        toTHz(fMax),
        0,
        yMax,
      );
      drawLine(ctx3, pts, "#69f0ae", toTHz(fMin), toTHz(fMax), 0, yMax);

      // threshold point
      const plotW = ctx3.canvas.width - PAD.left - PAD.right;
      const plotH = ctx3.canvas.height - PAD.top - PAD.bottom;
      const thSX =
        PAD.left +
        ((toTHz(f_th) - toTHz(fMin)) / (toTHz(fMax) - toTHz(fMin))) * plotW;
      const thSY = PAD.top + plotH - ((0 - 0) / (yMax - 0)) * plotH;
      ctx3.beginPath();
      ctx3.fillStyle = "#fff";
      ctx3.arc(thSX, thSY, 3, 0, Math.PI * 2);
      ctx3.fill();
      ctx3.fillStyle = "#aaa";
      ctx3.font = "8px Inter, sans-serif";
      const thSci = toScientific(f_th);
      ctx3.fillText(`f0 = ${thSci}`, thSX + 5, thSY - 4);
      drawSuperscript(ctx3, thSX + 33, thSY - 9);

      // current frequency marker
      const currentKE = maxKineticEnergy(frequency, f_th);
      drawCurrentFreqMarker(
        ctx3,
        frequency,
        currentKE,
        toTHz(fMin),
        toTHz(fMax),
        0,
        yMax,
      );
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