// ----------------------------------------------------------------
// photoelectric.ts – Pure physics & photoelectric-effect equations
// ----------------------------------------------------------------
import { FRAME_TIME, PX_PER_M } from "../config/canvas";

// ───────── Fundamental constants ─────────
export const PLANCK_CONSTANT = 6.62607015e-34;   // J·s
export const ELECTRON_MASS   = 9.1093837015e-31;  // kg
export const EV_TO_JOULE     = 1.602176634e-19;   // J per eV

// ───────── Metal data ─────────
export const METAL_THRESHOLDS: Record<string, number> = {
  Sodium:   4.4,
  Zinc:     9.0,
  Copper:   12.3,
  Platinum: 14.7,
};

// ───────── Helper ─────────
export function isAboveThreshold(freq: number, threshold: number): boolean {
  return freq > threshold;
}

// ───────── Core photoelectric equations ─────────

// Photon energy in eV
export function photonEnergy(freq: number): number {
  return (PLANCK_CONSTANT * freq * 1e14) / EV_TO_JOULE;
}

// Work function of a metal in eV
export function workFunction(threshold: number): number {
  return photonEnergy(threshold);
}

// Maximum kinetic energy in eV
export function maxKineticEnergy(freq: number, threshold: number): number {
  if (!isAboveThreshold(freq, threshold)) return 0;
  return photonEnergy(freq) - workFunction(threshold);
}

// Stopping voltage in volts
export function stoppingVoltage(freq: number, threshold: number): number {
  return maxKineticEnergy(freq, threshold);
}


export function getCurrent(
  intensity: number,
  voltage: number,
  freq: number,
  threshold: number
): number {
  if (!isAboveThreshold(freq, threshold)) return 0;
  const baseCurrent = intensity * 12; // mA model
  if (voltage >= 0) return baseCurrent;
  const V_stop = stoppingVoltage(freq, threshold);
  const fraction = Math.max(0, 1 - Math.abs(voltage) / V_stop);
  return baseCurrent * fraction;
}

// Electron velocity in m/s
export function electronVelocity(freq: number, threshold: number): number {
  const ke_ev = maxKineticEnergy(freq, threshold);
  if (ke_ev <= 0) return 0;
  const ke_j = ke_ev * EV_TO_JOULE;
  return Math.sqrt((2 * ke_j) / ELECTRON_MASS);
}

// Electron speed in pixels per frame (uses config)
export function electronSpeedPx(freq: number, threshold: number): number {
  const v_mps = electronVelocity(freq, threshold);
  if (v_mps === 0) return 0;
  return v_mps * FRAME_TIME * PX_PER_M;
}