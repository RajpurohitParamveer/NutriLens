import { registerPlugin } from '@capacitor/core';

export interface WidgetPluginPlugin {
  updateWidget(options: { steps: number; dailyGoal: number }): Promise<{ success: boolean; message: string }>;
  updateGoal(options: { dailyGoal: number }): Promise<{ success: boolean; message: string }>;
}

const WidgetPlugin = registerPlugin<WidgetPluginPlugin>('WidgetPlugin');

export default WidgetPlugin;
