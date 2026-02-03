import { registerPlugin } from "@capacitor/core";

export interface StepCounterPlugin {
  /**
   * Check if step counter sensor is available on the device
   */
  isAvailable(): Promise<{ available: boolean }>;
  
  /**
   * Start listening to step counter sensor
   * Returns current step count and continues to update
   */
  start(): Promise<{ steps: number }>;
  
  /**
   * Stop listening to step counter sensor
   */
  stop(): Promise<void>;
  
  /**
   * Get current step count without starting continuous tracking
   */
  getSteps(): Promise<{ steps: number }>;
}

const StepCounter = registerPlugin<StepCounterPlugin>("StepCounter");

export { StepCounter };
