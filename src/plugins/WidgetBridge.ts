import { registerPlugin } from '@capacitor/core';

export interface WidgetBridgePlugin {
  updateWidget(options: { steps: number; dailyGoal: number }): Promise<void>;
  updateGoal(options: { dailyGoal: number }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

export default WidgetBridge;
