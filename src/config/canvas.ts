// Canvas size and positions for the simulation
export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 500;

// Where the plates sit (cathode on left, anode on right)
export const CATHODE_X = 0.2 * CANVAS_WIDTH;
export const ANODE_X = 0.8 * CANVAS_WIDTH;

// How big the plates are
export const PLATE_WIDTH = 30;
export const PLATE_HEIGHT = 320;

// Physical gap properties used to scale the animation
export const PHYSICAL_GAP_M = 0.02;
export const GAP_PX = ANODE_X - CATHODE_X;
export const PX_PER_M = GAP_PX / PHYSICAL_GAP_M;

// Animation timing
export const FRAME_TIME = 1 / 60;
// This slows down the electron speed so we can actually see them move
export const SIM_SPEED_FACTOR = 6e-9;
// Adds acceleration to electrons based on voltage (tuned for visual feel)
export const VOLTAGE_ACCEL_FACTOR = 0.003;
