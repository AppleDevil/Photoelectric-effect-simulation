// Photoelectric effect physics calculations
// All constants and formulas are real physics values

import { FRAME_TIME, PX_PER_M } from "../config/canvas";

// Physical constants (all SI units - meters, seconds, joules, kg)
export const PLANCK_CONSTANT = 6.62607015e-34;
export const ELECTRON_MASS = 9.1093837015e-31;
export const EV_TO_JOULE = 1.602176634e-19;

// Threshold frequencies for each metal (in units of 10^14 Hz)
// These are the minimum frequency needed to eject electrons
export const METAL_THRESHOLDS: Record<string, number> = {
  Sodium: 4.4,
  Zinc: 9.0,
  Copper: 12.3,
  Platinum: 14.7,
};

// Check if the light frequency is high enough to eject electrons
export function isAboveThreshold(freq: number, threshold: number): boolean {
  return freq > threshold;
}

// Figure out the energy of a photon at a given frequency
// E = h * f, converted from joules to electronvolts (eV)
export function photonEnergy(freq: number): number {
  return (PLANCK_CONSTANT * freq * 1e14) / EV_TO_JOULE;
}

// The work function is the energy needed to free an electron from the metal
// This is just the photon energy at the threshold frequency
export function workFunction(threshold: number): number {
  return photonEnergy(threshold);
}

// The maximum kinetic energy an ejected electron can have
// If frequency is below threshold, no electrons are ejected
// Above threshold: KE = photon energy - work function
export function maxKineticEnergy(freq: number, threshold: number): number {
  if (!isAboveThreshold(freq, threshold)) return 0;
  return photonEnergy(freq) - workFunction(threshold);
}

// The voltage needed to stop the fastest electrons from reaching the anode
// This is numerically equal to the max KE (in eV, it's a 1-to-1 relationship)
export function stoppingVoltage(freq: number, threshold: number): number {
  return maxKineticEnergy(freq, threshold);
}

// Calculate how much current flows based on intensity, voltage, and frequency
export function getCurrent(
  intensity: number,
  voltage: number,
  freq: number,
  threshold: number
): number {
  if (!isAboveThreshold(freq, threshold)) return 0;
  const baseCurrent = intensity * 12;
  if (voltage >= 0) return baseCurrent;
  const V_stop = stoppingVoltage(freq, threshold);
  const fraction = Math.max(0, 1 - Math.abs(voltage) / V_stop);
  return baseCurrent * fraction;
}

// Convert the electron's kinetic energy into actual velocity
// v = sqrt(2 * KE / mass)
export function electronVelocity(freq: number, threshold: number): number {
  const ke_ev = maxKineticEnergy(freq, threshold);
  if (ke_ev <= 0) return 0;
  const ke_j = ke_ev * EV_TO_JOULE;
  return Math.sqrt((2 * ke_j) / ELECTRON_MASS);
}

// Convert electron velocity into pixels per animation frame
// This is used to figure out how fast to move electrons across the canvas
export function electronSpeedPx(freq: number, threshold: number): number {
  const v_mps = electronVelocity(freq, threshold);
  if (v_mps === 0) return 0;
  return v_mps * FRAME_TIME * PX_PER_M;
}
