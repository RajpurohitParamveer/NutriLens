import { registerPlugin } from '@capacitor/core';

export interface NutrilensWidgetPlugin {
  updateWidget(options: { steps: number; dailyGoal?: number }): Promise<{ success: boolean }>;
  updateGoal(options: { dailyGoal: number }): Promise<{ success: boolean }>;
}

const NutrilensWidget = registerPlugin<NutrilensWidgetPlugin>('NutrilensWidget');

export { NutrilensWidget };
