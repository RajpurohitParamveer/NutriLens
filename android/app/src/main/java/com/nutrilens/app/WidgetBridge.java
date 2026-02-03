package com.nutrilens.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridge extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        try {
            int steps = call.getInt("steps", 0);
            int dailyGoal = call.getInt("dailyGoal", 10000);
            
            // Update the widget using the native service
            NutrilensWidgetUpdateService.updateWidget(getContext(), steps, dailyGoal);
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to update widget", e);
        }
    }

    @PluginMethod
    public void updateGoal(PluginCall call) {
        try {
            int dailyGoal = call.getInt("dailyGoal", 10000);
            
            // Update the widget goal using the native service
            NutrilensWidgetUpdateService.updateGoal(getContext(), dailyGoal);
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to update widget goal", e);
        }
    }
}
