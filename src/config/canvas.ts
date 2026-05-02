// ----------------------------------------------------------------
// canvas.ts – Canvas configuration & display settings
// ----------------------------------------------------------------

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 500;

// Plate positions
export const CATHODE_X = 0.2 * CANVAS_WIDTH;     // 200 px
export const ANODE_X = 0.8 * CANVAS_WIDTH;        // 800 px

// Plate dimensions
export const PLATE_WIDTH = 30;
export const PLATE_HEIGHT = 320;
export const PLATE_Y_RATIO = 0.2;

// Physical scaling for animation
export const PHYSICAL_GAP_M = 0.02;               // 2 cm gap
export const GAP_PX = ANODE_X - CATHODE_X;       // 840 px
export const PX_PER_M = GAP_PX / PHYSICAL_GAP_M; // px per metre

// Animation
export const FRAME_TIME = 1 / 60;               // seconds per frame (60 fps)
export const SIM_SPEED_FACTOR = 6e-9;      // simulation time per real second
export const VOLTAGE_ACCEL_FACTOR = 0.003;  // voltage effect per frame
