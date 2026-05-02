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

// ============================================================================
// CANVAS DRAWING HELPERS
// Shortcuts so I don't have to type ctx.fillStyle = ... over and over
// ============================================================================// Pick the color that shapes will be filled with
function setFillColor(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
}

// Make the outline/stroke a certain color
function setStrokeColor(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
}

// How thick the lines should be
function setLineWidth(ctx: CanvasRenderingContext2D, width: number) {
  ctx.lineWidth = width;
}

// Start drawing a new shape
function startPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
}

// Fill in the current shape
function fillShape(ctx: CanvasRenderingContext2D) {
  ctx.fill();
}

// Draw the outline of the current shape
function strokePath(ctx: CanvasRenderingContext2D) {
  ctx.stroke();
}

// Draw a filled rectangle
function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillRect(x, y, w, h);
}

// Draw a filled rectangle with rounded corners
function fillRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.roundRect(x, y, w, h, r);
}

// Draw a line from point A to point B
function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.moveTo(x1, y1);  // Move "pen" to start point
  ctx.lineTo(x2, y2); // Draw line to end point
}

// Draw a filled circle
function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// Set the font for text
function setFont(ctx: CanvasRenderingContext2D, size: number, weight: string = "normal") {
  ctx.font = weight + " " + size + "px Inter, sans-serif";
}

// Set text alignment
function setTextAlign(ctx: CanvasRenderingContext2D, align: CanvasTextAlign) {
  ctx.textAlign = align;
}

// Draw text at a position
function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillText(text, x, y);
}

// ============================================================================
// PLATE DRAWING FUNCTIONS
// ============================================================================

// Draw the metal plates (cathode and anode)
function drawPlates(ctx: CanvasRenderingContext2D, plateY: number) {
  const cornerRadius = 8;  // How rounded the corners are
  
  // ----- Draw Cathode (left plate) -----
  setFillColor(ctx, "#5a5a6a");  // Gray color
  startPath(ctx);
  fillRoundedRect(ctx, CATHODE_X - PLATE_WIDTH, plateY, PLATE_WIDTH, PLATE_HEIGHT, cornerRadius);
  fillShape(ctx);
  
  // Orange emission edge on cathode (where electrons come out)
  setStrokeColor(ctx, "#ff8800");
  setLineWidth(ctx, 3);
  startPath(ctx);
  drawLine(ctx, CATHODE_X, plateY, CATHODE_X, plateY + PLATE_HEIGHT);
  strokePath(ctx);
  
  // ----- Draw Anode (right plate) -----
  setFillColor(ctx, "#5a5a6a");
  startPath(ctx);
  fillRoundedRect(ctx, ANODE_X, plateY, PLATE_WIDTH, PLATE_HEIGHT, cornerRadius);
  fillShape(ctx);
}

// ============================================================================
// WIRE AND BATTERY DRAWING FUNCTIONS
// ============================================================================

// Draw wires connecting plates to battery
function drawWires(ctx: CanvasRenderingContext2D, plateY: number) {
  const wireDrop = 45;           // How far down wires go
  const wireY = plateY + PLATE_HEIGHT + wireDrop;  // Y position of horizontal wire
  const leftWireX = CATHODE_X - PLATE_WIDTH / 2;   // Left wire X
  const rightWireX = ANODE_X + PLATE_WIDTH / 2; // Right wire X
  
  setStrokeColor(ctx, "#666");   // Dark gray wire color
  setLineWidth(ctx, 2);         // Wire thickness
  
  // Vertical wire from left plate
  startPath(ctx);
  drawLine(ctx, leftWireX, plateY + PLATE_HEIGHT, leftWireX, wireY);
  strokePath(ctx);
  
  // Vertical wire from right plate
  startPath(ctx);
  drawLine(ctx, rightWireX, plateY + PLATE_HEIGHT, rightWireX, wireY);
  strokePath(ctx);
  
  // Horizontal connecting wire
  startPath(ctx);
  drawLine(ctx, leftWireX, wireY, rightWireX, wireY);
  strokePath(ctx);
  
  return { wireX: leftWireX, wireY, rightWireX };
}

// Draw battery symbol on the wire
function drawBattery(ctx: CanvasRenderingContext2D, wireX: number, wireY: number, rightWireX: number, voltage: number) {
  const batteryX = (wireX + rightWireX) / 2;  // Center of battery
  const batteryY = wireY;
  const cathodeIsPositive = voltage < 0;      // Which plate is positive
  
  const leftTermX = batteryX - 12;           // Left terminal X
  const rightTermX = batteryX + 12;         // Right terminal X
  const longHeight = 22;                    // Length of long line (positive terminal)
  const shortHeight = 12;                   // Length of short line (negative terminal)
  
  // Draw left terminal (long or short line)
  const leftTermHeight = cathodeIsPositive ? longHeight : shortHeight;
  setStrokeColor(ctx, "#ccc");
  setLineWidth(ctx, cathodeIsPositive ? 1.5 : 3);
  startPath(ctx);
  drawLine(ctx, leftTermX, batteryY - leftTermHeight / 2, leftTermX, batteryY + leftTermHeight / 2);
  strokePath(ctx);
  
  // Draw right terminal (opposite of left)
  const rightTermHeight = cathodeIsPositive ? shortHeight : longHeight;
  setStrokeColor(ctx, "#ccc");
  setLineWidth(ctx, cathodeIsPositive ? 3 : 1.5);
  startPath(ctx);
  drawLine(ctx, rightTermX, batteryY - rightTermHeight / 2, rightTermX, batteryY + rightTermHeight / 2);
  strokePath(ctx);
  
  // Draw wire gaps around battery (so battery doesn't short the wire)
  setStrokeColor(ctx, "#666");
  setLineWidth(ctx, 2);
  startPath(ctx);
  drawLine(ctx, wireX, batteryY, leftTermX - 5, batteryY);
  strokePath(ctx);
  startPath(ctx);
  drawLine(ctx, rightTermX + 5, batteryY, rightWireX, batteryY);
  strokePath(ctx);
  
  // Draw + and - labels near battery
  setFont(ctx, 12);
  setTextAlign(ctx, "center");
  setFillColor(ctx, "#aaa");
  if (cathodeIsPositive) {
    drawText(ctx, "+", leftTermX, batteryY - 18);
    drawText(ctx, "−", rightTermX, batteryY - 18);
  } else {
    drawText(ctx, "−", leftTermX, batteryY - 18);
    drawText(ctx, "+", rightTermX, batteryY - 18);
  }
}

// ============================================================================
// POLARITY SYMBOLS ON PLATES
// ============================================================================

// Draw + or - signs on the plates based on voltage
function drawPlatePolarity(ctx: CanvasRenderingContext2D, plateY: number, voltage: number) {
  // Only draw if voltage is applied (more than 0.01V)
  if (Math.abs(voltage) > 0.01) {
    const numSigns = Math.min(Math.ceil(Math.abs(voltage) * 2), 4);  // How many signs (1-4)
    const isPositive = voltage > 0;                                // Which direction
    
    setFont(ctx, 12, "bold");
    setTextAlign(ctx, "center");
    
    // Calculate evenly spaced positions within the plate
    const startY = plateY + 25;
    const spacing = (PLATE_HEIGHT - 50) / (numSigns + 1);
    
    // Draw on Cathode (left plate)
    if (isPositive) {
      setFillColor(ctx, "#ff6b6b");  // Red for minus
      for (let i = 1; i <= numSigns; i++) {
        drawText(ctx, "−", CATHODE_X - PLATE_WIDTH / 2, startY + i * spacing);
      }
    } else {
      setFillColor(ctx, "#6bff6b");  // Green for plus
      for (let i = 1; i <= numSigns; i++) {
        drawText(ctx, "+", CATHODE_X - PLATE_WIDTH / 2, startY + i * spacing);
      }
    }
    
    // Draw on Anode (right plate)
    if (isPositive) {
      setFillColor(ctx, "#6bff6b");  // Green for plus
      for (let i = 1; i <= numSigns; i++) {
        drawText(ctx, "+", ANODE_X + PLATE_WIDTH / 2, startY + i * spacing);
      }
    } else {
      setFillColor(ctx, "#ff6b6b");  // Red for minus
      for (let i = 1; i <= numSigns; i++) {
        drawText(ctx, "−", ANODE_X + PLATE_WIDTH / 2, startY + i * spacing);
      }
    }
  }
}

// ============================================================================
// ELECTRON FUNCTIONS
// ============================================================================

// Spawn new electrons from the cathode
function spawnElectron(electrons: { x: number; y: number; vx: number }[], plateY: number, intensity: number, frequency: number, threshold: number) {
  // Only spawn if light frequency is above threshold
  if (isAboveThreshold(frequency, threshold)) {
    // Random chance based on intensity
    if (Math.random() < intensity * 0.14) {
      // Calculate electron speed from physics
      const realPxPerFrame = electronSpeedPx(frequency, threshold);
      // Add randomness (electrons have slightly different energies)
      const randomFactor = 0.3 + Math.random() * 0.7;
      const speed = realPxPerFrame * SIM_SPEED_FACTOR * randomFactor;
      
      // Add new electron at cathode surface
      electrons.push({
        x: CATHODE_X,
        y: plateY + Math.random() * PLATE_HEIGHT,
        vx: speed,
      });
    }
  }
}

// Update and draw all electrons
function updateAndDrawElectrons(
  electrons: { x: number; y: number; vx: number }[],
  ctx: CanvasRenderingContext2D,
  voltage: number
) {
  // Process each electron
  // Filter keeps electrons that stay within the plates
  return electrons.filter((e) => {
    // Apply voltage acceleration to electron velocity
    // (positive voltage pulls electrons right, negative pulls left)
    e.vx += VOLTAGE_ACCEL_FACTOR * voltage;
    
    // Move electron by its velocity
    e.x += e.vx;
    
    // Remove electron if it reaches either plate
    if (e.x >= ANODE_X || e.x <= CATHODE_X) {
      return false;  // Don't keep this electron
    }
    
    // Draw electron as blue circle
    setFillColor(ctx, "#88ccff");
    startPath(ctx);
    fillCircle(ctx, e.x, e.y, 4);
    
    return true;  // Keep this electron
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SimulationCanvas({
  intensity,
  frequency,
  thresholdFrequency,
  voltage,
}: Props) {
  // References to store data (like global variables that persist across renders)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const electronsRef = useRef<{ x: number; y: number; vx: number }[]>([]);  // Array of electrons
  const rafId = useRef<number | null>(null);
  
  // Store prop values in refs (so they're available in animation loop)
  const intensityRef = useRef(intensity);
  const freqRef = useRef(frequency);
  const threshRef = useRef(thresholdFrequency);
  const voltageRef = useRef(voltage);
  
  // Update refs when props change
  useEffect(() => {
    intensityRef.current = intensity;
    freqRef.current = frequency;
    threshRef.current = thresholdFrequency;
    voltageRef.current = voltage;
  }, [intensity, frequency, thresholdFrequency, voltage]);
  
  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    
    // Calculate vertical center position for plates
    const plateY = (canvas.height - PLATE_HEIGHT) / 2;
    
    const animate = () => {
      // Get current values from refs
      const I = intensityRef.current;
      const f = freqRef.current;
      const f0 = threshRef.current;
      const V = voltageRef.current;
      
      // ----- Step 1: Clear the canvas (draw background) -----
      setFillColor(ctx, "#0a0a1a");
      fillRect(ctx, 0, 0, canvas.width, canvas.height);
      
      // ----- Step 2: Draw the metal plates -----
      drawPlates(ctx, plateY);
      
      // ----- Step 3: Draw wires and battery -----
      const { wireX, wireY, rightWireX } = drawWires(ctx, plateY);
      drawBattery(ctx, wireX, wireY, rightWireX, V);
      
      // ----- Step 4: Draw polarity symbols on plates -----
      drawPlatePolarity(ctx, plateY, V);
      
      // ----- Step 5: Spawn new electrons -----
      spawnElectron(electronsRef.current, plateY, I, f, f0);
      
      // ----- Step 6: Update and draw electrons -----
      electronsRef.current = updateAndDrawElectrons(electronsRef.current, ctx, V);
      
      // Request next frame (keeps animation running at 60fps)
      rafId.current = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animate();
    
    // Cleanup when component unmounts (stops animation)
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);  // Empty array = run once on mount
  
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