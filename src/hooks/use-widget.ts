import { Capacitor } from '@capacitor/core';

export function useWidget() {
  const isNative = Capacitor.isNativePlatform();

  const updateWidget = async (steps: number, dailyGoal: number = 10000) => {
    if (!isNative) return;
    
    try {
      // Use JavaScript interface to call native Android methods
      if (Capacitor.getPlatform() === 'android') {
        // Call the JavaScript interface directly
        const androidWidget = (window as any).AndroidWidget;
        if (androidWidget && androidWidget.updateWidget) {
          androidWidget.updateWidget(steps, dailyGoal);
          console.log(`Widget updated via JS interface: ${steps} steps, goal: ${dailyGoal}`);
        } else {
          // Fallback: try Capacitor bridge
          const bridge = (window as any).Capacitor?.androidBridge;
          if (bridge && bridge.call) {
            bridge.call('updateWidget', steps, dailyGoal);
            console.log(`Widget updated via bridge: ${steps} steps, goal: ${dailyGoal}`);
          } else {
            console.warn('No widget bridge available');
          }
        }
      }
      
      // Also store in localStorage as backup and for debugging
      localStorage.setItem('widget-steps', steps.toString());
      localStorage.setItem('widget-goal', dailyGoal.toString());
    } catch (error) {
      console.error('Failed to update widget:', error);
      // Fallback to localStorage
      localStorage.setItem('widget-steps', steps.toString());
      localStorage.setItem('widget-goal', dailyGoal.toString());
    }
  };

  const updateGoal = async (dailyGoal: number) => {
    if (!isNative) return;
    
    try {
      // Use JavaScript interface to call native Android methods
      if (Capacitor.getPlatform() === 'android') {
        // Call the JavaScript interface directly
        const androidWidget = (window as any).AndroidWidget;
        if (androidWidget && androidWidget.updateGoal) {
          androidWidget.updateGoal(dailyGoal);
          console.log(`Widget goal updated via JS interface: ${dailyGoal}`);
        } else {
          // Fallback: try Capacitor bridge
          const bridge = (window as any).Capacitor?.androidBridge;
          if (bridge && bridge.call) {
            bridge.call('updateGoal', dailyGoal);
            console.log(`Widget goal updated via bridge: ${dailyGoal}`);
          } else {
            console.warn('No widget bridge available');
          }
        }
      }
      
      // Also store in localStorage as backup and for debugging
      localStorage.setItem('widget-goal', dailyGoal.toString());
    } catch (error) {
      console.error('Failed to update widget goal:', error);
      // Fallback to localStorage
      localStorage.setItem('widget-goal', dailyGoal.toString());
    }
  };

  return {
    updateWidget,
    updateGoal,
    isSupported: isNative
  };
}
