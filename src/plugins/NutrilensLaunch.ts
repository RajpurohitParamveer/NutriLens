import { registerPlugin } from "@capacitor/core";

export interface NutrilensLaunchPlugin {
  getLaunchPath(): Promise<{ value: string | null }>;
}

const NutrilensLaunch = registerPlugin<NutrilensLaunchPlugin>("NutrilensLaunch");

export { NutrilensLaunch };
