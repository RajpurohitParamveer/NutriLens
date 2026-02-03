import { registerPlugin } from "@capacitor/core";

export interface NutrilensWidgetSyncPlugin {
  setStepsData(options: { steps: number; goal: number }): Promise<void>;
}

const NutrilensWidgetSync = registerPlugin<NutrilensWidgetSyncPlugin>("NutrilensWidgetSync");

export { NutrilensWidgetSync };
