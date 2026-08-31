export const LOADING_DURATION_MS = 3400;

export const LOADING_STAGES = [
  { from: 0, to: 20, message: "Initializing TechAtlas..." },
  { from: 20, to: 40, message: "Preparing geographic data..." },
  { from: 40, to: 60, message: "Preparing city layers..." },
  { from: 60, to: 80, message: "Preparing technology ecosystem..." },
  { from: 80, to: 95, message: "Preparing 3D environment..." },
  { from: 95, to: 101, message: "Entering TechAtlas..." }
] as const;
