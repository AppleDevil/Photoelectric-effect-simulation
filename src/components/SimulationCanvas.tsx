import { useRef, useEffect } from "react";
import { isAboveThreshold, electronSpeedPx } from "../physics/photoelectric";
import { SIM_SPEED_FACTOR, VOLTAGE_ACCEL_FACTOR } from "../config/canvas";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CATHODE_X,
  ANODE_X,
  PLATE_WIDTH,
  PLATE_HEIGHT,
} from "../config/canvas";

interface Props {
  intensity: number;
  frequency: number;
  thresholdFrequency: number;
  voltage: number;
}

function SimulationCanvas({
  intensity,
  frequency,
  thresholdFrequency,
  voltage,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const electronsRef = useRef<{ x: number; y: number; vx: number }[]>([]);
  const rafId = useRef<number | null>(null);

  const intensityRef = useRef(intensity);
  const freqRef = useRef(frequency);
  const threshRef = useRef(thresholdFrequency);
  const voltageRef = useRef(voltage);

  useEffect(() => {
    intensityRef.current = intensity;
    freqRef.current = frequency;
    threshRef.current = thresholdFrequency;
    voltageRef.current = voltage;
  }, [intensity, frequency, thresholdFrequency, voltage]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // Centre the plates vertically
    const plateY = (canvas.height - PLATE_HEIGHT) / 2;

    const animate = () => {
      const I = intensityRef.current;
      const f = freqRef.current;
      const f0 = threshRef.current;
      const V = voltageRef.current;

      // 1. Clear
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw plates with rounded corners
      const cornerRadius = 8;
      
      // Cathode plate (left plate) - rounded rectangle
      ctx.fillStyle = "#5a5a6a";
      ctx.beginPath();
      ctx.roundRect(CATHODE_X - PLATE_WIDTH, plateY, PLATE_WIDTH, PLATE_HEIGHT, cornerRadius);
      ctx.fill();
      
      // Orange emission edge on cathode (right edge where electrons come from)
      ctx.strokeStyle = "#ff8800";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CATHODE_X, plateY);
      ctx.lineTo(CATHODE_X, plateY + PLATE_HEIGHT);
      ctx.stroke();
      
// Anode plate (right plate) - rounded rectangle
      ctx.fillStyle = "#5a5a6a";
      ctx.beginPath();
      ctx.roundRect(ANODE_X, plateY, PLATE_WIDTH, PLATE_HEIGHT, cornerRadius);
      ctx.fill();

      // 3. Draw wire connection at bottom
      const wireDrop = 45;
      const wireY = plateY + PLATE_HEIGHT + wireDrop;
      const leftWireX = CATHODE_X - PLATE_WIDTH / 2;
      const rightWireX = ANODE_X + PLATE_WIDTH / 2;

      // vertical wires from plates to horizontal wire
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftWireX, plateY + PLATE_HEIGHT);
      ctx.lineTo(leftWireX, wireY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightWireX, plateY + PLATE_HEIGHT);
      ctx.lineTo(rightWireX, wireY);
      ctx.stroke();

      // horizontal wire
      ctx.beginPath();
      ctx.moveTo(leftWireX, wireY);
      ctx.lineTo(rightWireX, wireY);
      ctx.stroke();

      // --- battery symbol on the wire ---
      const batteryX = (leftWireX + rightWireX) / 2;
      const batteryY = wireY;
      const cathodeIsPositive = V < 0;

      const leftTermX = batteryX - 12;
      const rightTermX = batteryX + 12;
      const longHeight = 22;
      const shortHeight = 12;

      // left terminal
      const leftTermHeight = cathodeIsPositive ? longHeight : shortHeight;
      ctx.beginPath();
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = cathodeIsPositive ? 1.5 : 3;
      ctx.moveTo(leftTermX, batteryY - leftTermHeight / 2);
      ctx.lineTo(leftTermX, batteryY + leftTermHeight / 2);
      ctx.stroke();

      // right terminal
      const rightTermHeight = cathodeIsPositive ? shortHeight : longHeight;
      ctx.beginPath();
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = cathodeIsPositive ? 3 : 1.5;
      ctx.moveTo(rightTermX, batteryY - rightTermHeight / 2);
      ctx.lineTo(rightTermX, batteryY + rightTermHeight / 2);
      ctx.stroke();

      // wire gaps around battery
      ctx.beginPath();
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.moveTo(leftWireX, batteryY);
      ctx.lineTo(leftTermX - 5, batteryY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightTermX + 5, batteryY);
      ctx.lineTo(rightWireX, batteryY);
      ctx.stroke();

      // battery polarity labels
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#aaa";
      ctx.textAlign = "center";
      if (cathodeIsPositive) {
        ctx.fillText("+", leftTermX, batteryY - 18);
        ctx.fillText("−", rightTermX, batteryY - 18);
      } else {
        ctx.fillText("−", leftTermX, batteryY - 18);
        ctx.fillText("+", rightTermX, batteryY - 18);
      }

      // 4. Draw polarity symbols on plates if voltage is applied
      if (Math.abs(V) > 0.01) {
        const numSigns = Math.min(Math.ceil(Math.abs(V) * 2), 4);
        const isPositive = V > 0;
        
        ctx.font = "bold 12px Inter, sans-serif";
        
        // Calculate evenly spaced positions within the plate
        const startY = plateY + 25;
        const spacing = (PLATE_HEIGHT - 50) / (numSigns + 1);
        
        // Cathode (left plate)
        if (isPositive) {
          for (let i = 1; i <= numSigns; i++) {
            ctx.fillStyle = "#ff6b6b";
            ctx.textAlign = "center";
            ctx.fillText("−", CATHODE_X - PLATE_WIDTH / 2, startY + i * spacing);
          }
        } else {
          for (let i = 1; i <= numSigns; i++) {
            ctx.fillStyle = "#6bff6b";
            ctx.textAlign = "center";
            ctx.fillText("+", CATHODE_X - PLATE_WIDTH / 2, startY + i * spacing);
          }
        }
        
        // Anode (right plate)
        if (isPositive) {
          for (let i = 1; i <= numSigns; i++) {
            ctx.fillStyle = "#6bff6b";
            ctx.textAlign = "center";
            ctx.fillText("+", ANODE_X + PLATE_WIDTH / 2, startY + i * spacing);
          }
        } else {
          for (let i = 1; i <= numSigns; i++) {
            ctx.fillStyle = "#ff6b6b";
            ctx.textAlign = "center";
            ctx.fillText("−", ANODE_X + PLATE_WIDTH / 2, startY + i * spacing);
          }
        }
      }

      // 4. Spawn electrons if above threshold
      if (isAboveThreshold(f, f0)) {
        if (Math.random() < I * 0.14) {
          const realPxPerFrame = electronSpeedPx(f, f0);
          const randomFactor = 0.3 + Math.random() * 0.7;
          const speed = realPxPerFrame * SIM_SPEED_FACTOR * randomFactor;
          electronsRef.current.push({
            x: CATHODE_X,
            y: plateY + Math.random() * PLATE_HEIGHT,
            vx: speed,
          });
        }
      }

      // 5. Move and draw electrons
      electronsRef.current = electronsRef.current.filter((e) => {
        e.vx += VOLTAGE_ACCEL_FACTOR * V;
        e.x += e.vx;

        if (e.x >= ANODE_X || e.x <= CATHODE_X) return false;

        ctx.beginPath();
        ctx.fillStyle = "#88ccff";
        ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      rafId.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        borderRadius: "12px",
        border: "2px solid #333",
        background: "#0a0a1a",
      }}
    />
  );
}

export default SimulationCanvas;
