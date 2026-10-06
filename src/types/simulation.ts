export type CameraMode = 
  | 'cinematic'       // Auto cinematic cuts
  | 'orbit'           // Free 3D orbital control
  | 'meteor_chase'    // Behind the meteor looking at Earth
  | 'meteor_pov'      // In front of the meteor looking down
  | 'earth_view'      // Seoul Observatory looking up at the falling text
  | 'iss_orbit'       // High orbital satellite view
  | 'top_down';       // Polar top down tactical view

export type MeteorStyle = 
  | 'magma'           // Burning rock and lava
  | 'cyber_neon'      // Cyberpunk neon grid apocalypse
  | 'gold'            // Bling bling Golden Jae-deok
  | 'ice'             // Cryogenic blue comet
  | 'dark_matter';    // Void dark purple cosmic anomaly

export type SimulationPhase = 
  | 'deep_space'      // Approaching Earth from far away
  | 'reentry'         // Entering upper atmosphere, catching fire
  | 'terminal'        // Supersonic dive, blinding heat
  | 'impact'          // Cataclysmic explosion
  | 'post_impact';    // Smoldering crater, meme aftermath

export interface SimulationConfig {
  text: string;
  style: MeteorStyle;
  speedMultiplier: number;
  enableLasers: boolean;
  enableSound: boolean;
  enableParticles: boolean;
  enableAtmosphereGlow: boolean;
  meteorScale: number;
  targetCity: string;
}

export interface TelemetryData {
  distanceToEarth: number; // in km (e.g. 120,000 km -> 0 km)
  velocity: number;        // in km/s (e.g. 45.2 km/s)
  temperature: number;     // in °C (e.g. 4,500°C)
  studyPowerLevel: number; // Jae-deok's secret study power level (9,999 -> 0)
  timeToImpact: number;    // seconds
  phase: SimulationPhase;
  progress: number;        // 0.0 to 1.0
}
